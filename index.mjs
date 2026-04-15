import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import seatRoutes from "./routes/seats.js";

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

app.get("/seed", async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO seats (isbooked)
      SELECT 0 FROM generate_series(1, 20)
    `);

    res.send("Seeded 20 seats");
  } catch (err) {
    console.error(err);
    res.send("Error seeding");
  }
});

app.listen(port, () => console.log(`Server running on port: ${port}`));