// server/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import connectDB from "./db.js";

dotenv.config();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const PORT = process.env.PORT || 8080;

const app = express();

// -----------------------------
// Create HTTP + Socket.IO server
// -----------------------------
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io available in routes
app.set("io", io);

// Socket.io basic logs
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// -----------------------------
// Middleware
// -----------------------------

// ---------------- CORS ----------------
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// JSON parser
app.use(express.json());

// -----------------------------
// Routes
// -----------------------------
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

// Simple health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "StudySync backend is running 🚀",
    origin: CLIENT_ORIGIN,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, route: "/api/health" });
});

// -----------------------------
// Start server
// -----------------------------
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log("========================================");
    console.log("🚀 Backend running on: http://localhost:" + PORT);
    console.log("🌍 Allowed origins:", allowedOrigins);
    console.log("========================================");
  });
});