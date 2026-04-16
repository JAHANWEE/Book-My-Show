import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        isbooked INTEGER DEFAULT 0,
        name TEXT
      )
    `);

    const { rowCount } = await pool.query("SELECT 1 FROM seats LIMIT 1");
    if (rowCount === 0) {
      await pool.query(`
        INSERT INTO seats (isbooked)
        SELECT 0 FROM generate_series(1, 40)
      `);
    }

    const guestHash = await bcrypt.hash("Guest@1234", 10);
    await pool.query(`
      INSERT INTO users (email, password)
      VALUES ('guest@ticketbaazi.com', $1)
      ON CONFLICT (email) DO NOTHING
    `, [guestHash]);

    res.send("Seeded successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error seeding: " + err.message);
  }
});

export default router;
