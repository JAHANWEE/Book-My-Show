import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import seatRoutes from "./routes/seats.js";
import pool from "./db/pool.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = new express();
app.use(cors());
app.use(express.json());

// Serve static files (src/script.js, etc.)
app.use(express.static(__dirname));

app.get("/", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});


app.use("/auth", authRoutes);
app.use("/seats", seatRoutes);

app.get("/seed", async (_, res) => {
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

    // Only insert if table is empty
    const { rowCount } = await pool.query("SELECT 1 FROM seats LIMIT 1");
    if (rowCount === 0) {
      await pool.query(`
        INSERT INTO seats (isbooked)
        SELECT 0 FROM generate_series(1, 20)
      `);
    }

    res.send("Seeded successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error seeding: " + err.message);
  }
});

app.listen(port, () => console.log(`Server running on port: ${port}`));