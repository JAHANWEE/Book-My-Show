import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { migrate } from "./db/migrate.js";
import authRoutes     from "./routes/auth.js";
import seatRoutes     from "./routes/seats.js";
import bookingRoutes  from "./routes/bookings.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const app = new express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use("/public", express.static(join(__dirname, "public")));

app.get("/", (_, res) => res.sendFile(join(__dirname, "index.html")));

app.use("/auth",     authRoutes);
app.use("/seats",    seatRoutes);
app.use("/bookings", bookingRoutes);

// Run migrations then start server
migrate()
  .then(() => app.listen(port, () => console.log(`Server running on port: ${port}`)))
  .catch(err => { console.error("Migration failed:", err); process.exit(1); });
