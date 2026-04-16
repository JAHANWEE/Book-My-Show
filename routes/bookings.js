import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /bookings — one entry per booking session
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, movie_id, show_time, seat_nos, names, booked_at
       FROM bookings
       WHERE user_id = $1
       ORDER BY booked_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

export default router;
