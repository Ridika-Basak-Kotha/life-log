// backend/src/server.ts
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import routineRoutes from "./routes/routine.routes";
import { seedDefaultUsers } from "./services/auth.service";

dotenv.config();

const app = express();

// 🟢 DEBUG: show which file is actually running
console.log("🟢 Running server from:", __filename);

// 🔥 GLOBAL CORS MIDDLEWARE – no libraries, always runs first
app.use((req, res, next) => {
  console.log("💥 CORS middleware hit:", req.method, req.url);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// parse JSON bodies
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in .env");
}

// Simple health check
app.get("/", (_req, res) => {
  res.send("LifeLog API is running 🚀");
});

// API routes// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

console.log("🧩 Mounting /api/routines router");
app.use("/api/routines", routineRoutes);


async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // optional: seed default admin/user
    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

start();
