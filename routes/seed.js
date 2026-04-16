import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db/pool.js";

const router = express.Router();

const MOVIE_IDS = [1, 2, 3, 4];
const SHOW_TIMES = ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"];
const SEATS_PER_SHOW = 100;

router.get("/", async (_, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Drop and recreate seats with new schema
    await pool.query(`DROP TABLE IF EXISTS seats`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id        SERIAL PRIMARY KEY,
        movie_id  INTEGER NOT NULL,
        show_time TEXT NOT NULL,
        seat_no   INTEGER NOT NULL,
        isbooked  INTEGER DEFAULT 0,
        name      TEXT,
        UNIQUE (movie_id, show_time, seat_no)
      )
    `);

    // Seed seats for every movie × showtime combination
    for (const movieId of MOVIE_IDS) {
      for (const showTime of SHOW_TIMES) {
        const { rowCount } = await pool.query(
          "SELECT 1 FROM seats WHERE movie_id = $1 AND show_time = $2 LIMIT 1",
          [movieId, showTime]
        );
        if (rowCount === 0) {
          const values = Array.from({ length: SEATS_PER_SHOW }, (_, i) =>
            `(${movieId}, '${showTime}', ${i + 1}, 0)`
          ).join(", ");
          await pool.query(
            `INSERT INTO seats (movie_id, show_time, seat_no, isbooked) VALUES ${values}`
          );
        }
      }
    }

    // Guest user
    const guestHash = await bcrypt.hash("Guest@1234", 10);
    await pool.query(`
      INSERT INTO users (email, password)
      VALUES ('guest@ticketbaazi.com', $1)
      ON CONFLICT (email) DO NOTHING
    `, [guestHash]);

    res.send("Seeded successfully — 100 seats × 4 movies × 4 showtimes.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error seeding: " + err.message);
  }
});

export default router;
