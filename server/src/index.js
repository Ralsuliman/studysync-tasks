// server/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";                       // NEW
import { Server as SocketIOServer } from "socket.io"; // NEW

import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import connectDB from "./db.js"; // whatever your DB connect file is called

dotenv.config();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
const PORT = process.env.PORT || 8080;

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io available to routes via req.app.get("io")
app.set("io", io);

// Socket.IO basic logging
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    where: "root",
    message: "StudySync backend is running on / 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    where: "/api/health",
    message: "StudySync backend is running 🚀",
  });
});

// Connect DB then start server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running with Socket.IO on http://localhost:${PORT}`);
  });
});