import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /seats?movieId=1&showTime=10:00 AM
router.get("/", async (req, res) => {
  try {
    const { movieId, showTime } = req.query;
    if (!movieId || !showTime) {
      return res.status(400).json({ error: "movieId and showTime are required." });
    }
    const result = await pool.query(
      "SELECT * FROM seats WHERE movie_id = $1 AND show_time = $2 ORDER BY seat_no",
      [movieId, showTime]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch seats." });
  }
});

// POST /seats/book — book multiple seats in one transaction
// Body: { seatIds: [1,2,3], names: ["Alice", "Bob", ""] }
router.post("/book", verifyToken, async (req, res) => {
  const conn = await pool.connect();
  try {
    const { seatIds, names } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 4) {
      conn.release();
      return res.status(400).json({ error: "Select 1–4 seats." });
    }
    if (!Array.isArray(names) || names.length !== seatIds.length) {
      conn.release();
      return res.status(400).json({ error: "Names array must match seats count." });
    }
    if (!names[0] || names[0].trim().length === 0) {
      conn.release();
      return res.status(400).json({ error: "Primary name is required." });
    }

    // Fill empty names with primary name
    const resolvedNames = names.map((n, i) =>
      n && n.trim().length > 0 ? n.trim() : names[0].trim()
    );

    await conn.query("BEGIN");

    // Lock and validate all seats at once
    const seatResult = await conn.query(
      `SELECT * FROM seats WHERE id = ANY($1) AND isbooked = 0 FOR UPDATE`,
      [seatIds]
    );

    if (seatResult.rowCount !== seatIds.length) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(409).json({ error: "One or more seats are already booked." });
    }

    const seats = seatResult.rows;
    const movieId  = seats[0].movie_id;
    const showTime = seats[0].show_time;
    const seatNos  = seats.map(s => s.seat_no);

    // Mark all seats booked
    await conn.query(
      "UPDATE seats SET isbooked = 1 WHERE id = ANY($1)",
      [seatIds]
    );

    // Create one booking group row
    const bookingRes = await conn.query(
      `INSERT INTO bookings (user_id, movie_id, show_time, seat_nos, names)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.id, movieId, showTime, seatNos, resolvedNames]
    );
    const bookingId = bookingRes.rows[0].id;

    // Insert individual booking_seats rows
    for (let i = 0; i < seats.length; i++) {
      await conn.query(
        `INSERT INTO booking_seats (booking_id, seat_id, seat_no, name)
         VALUES ($1, $2, $3, $4)`,
        [bookingId, seats[i].id, seats[i].seat_no, resolvedNames[i]]
      );
    }

    await conn.query("COMMIT");
    conn.release();

    res.json({
      message: "Seats booked successfully.",
      bookingId,
      seatNos,
      movieId,
      showTime,
    });
  } catch (ex) {
    await conn.query("ROLLBACK").catch(() => {});
    conn.release();
    console.error(ex);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
