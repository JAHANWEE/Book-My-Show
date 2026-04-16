import pool from "./pool.js";
import bcrypt from "bcryptjs";

const SHOW_TIMES    = ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"];
const MOVIE_IDS     = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SEATS_PER_SHOW = 100;

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id        SERIAL PRIMARY KEY,
      movie_id  INT NOT NULL,
      show_time VARCHAR(20) NOT NULL,
      seat_no   INT NOT NULL,
      isbooked  INT DEFAULT 0,
      UNIQUE (movie_id, show_time, seat_no)
    )
  `);

  // One row per booking session (multiple seats booked together)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id        SERIAL PRIMARY KEY,
      user_id   INT NOT NULL REFERENCES users(id),
      movie_id  INT NOT NULL,
      show_time VARCHAR(20) NOT NULL,
      seat_nos  INT[] NOT NULL,
      names     TEXT[] NOT NULL,
      booked_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Individual seat → booking reference (for locking/lookup)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_seats (
      id         SERIAL PRIMARY KEY,
      booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      seat_id    INT NOT NULL REFERENCES seats(id),
      seat_no    INT NOT NULL,
      name       VARCHAR(255) NOT NULL
    )
  `);

  // ── Seed seats ──────────────────────────────────────────────────
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

  // ── Guest user ──────────────────────────────────────────────────
  const guestHash = await bcrypt.hash("Guest@1234", 10);
  await pool.query(`
    INSERT INTO users (email, password)
    VALUES ('guest@ticketbaazi.com', $1)
    ON CONFLICT (email) DO NOTHING
  `, [guestHash]);

  console.log("✅ Database ready");
}
