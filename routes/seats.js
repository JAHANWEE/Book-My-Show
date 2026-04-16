import express from "express";
import pool from "../db/pool.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /seats — public, no auth required
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM seats");
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch seats." });
  }
});

// PUT /seats/:id/:name — protected, requires valid JWT
router.put("/:id/:name", verifyToken, async (req, res) => {
  try {
    const { id, name } = req.params;

    if (!name || name.trim().length === 0 || name.length > 50) {
      return res.status(400).json({ error: "Invalid name. Must be 1-50 characters." });
    }

    const conn = await pool.connect();
    await conn.query("BEGIN");

    const result = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [id]
    );

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(409).json({ error: "Seat already booked." });
    }

    await conn.query(
      "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1",
      [id, name]
    );

    await conn.query("COMMIT");
    conn.release();

    res.json({ message: "Seat booked successfully.", bookedBy: req.user.email });
  } catch (ex) {
    await conn.query("ROLLBACK").catch(() => {});
    conn.release();
    console.error(ex);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;