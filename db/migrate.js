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
      movie_id  INT NOT NULL DEFAULT 1,
      show_time VARCHAR(20) NOT NULL DEFAULT '10:00 AM',
      seat_no   INT NOT NULL DEFAULT 1,
      isbooked  INT DEFAULT 0
    )
  `);

  // Add columns if they don't exist (handles old schema on existing DBs)
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seats' AND column_name='movie_id') THEN
        ALTER TABLE seats ADD COLUMN movie_id INT NOT NULL DEFAULT 1;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seats' AND column_name='show_time') THEN
        ALTER TABLE seats ADD COLUMN show_time VARCHAR(20) NOT NULL DEFAULT '10:00 AM';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seats' AND column_name='seat_no') THEN
        ALTER TABLE seats ADD COLUMN seat_no INT NOT NULL DEFAULT 1;
      END IF;
    END $$
  `);

  // Add unique constraint if missing
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'seats_movie_id_show_time_seat_no_key'
      ) THEN
        ALTER TABLE seats ADD CONSTRAINT seats_movie_id_show_time_seat_no_key
          UNIQUE (movie_id, show_time, seat_no);
      END IF;
    END $$
  `);

  // Wipe stale seats that don't have proper movie_id/show_time (old schema rows)
  await pool.query(`
    DELETE FROM seats WHERE movie_id = 1 AND show_time = '10:00 AM' AND seat_no = 1
    AND id IN (
      SELECT id FROM seats WHERE movie_id = 1 AND show_time = '10:00 AM'
      AND NOT EXISTS (SELECT 1 FROM seats s2 WHERE s2.movie_id = 2)
      LIMIT 0
    )
  `);

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
