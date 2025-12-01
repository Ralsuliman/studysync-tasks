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

const app = express();
const PORT = process.env.PORT || 8080;

// -----------------------------
// 🔥 PARSE ALLOWED ORIGINS
// -----------------------------
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// -----------------------------
// 🔥 Create HTTP + Socket.IO server
// -----------------------------
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

// Socket logs
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// -----------------------------
// 🔥 CORS Middleware
// -----------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools with no origin (Postman) OR allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// -----------------------------
// 🔥 Routes
// -----------------------------
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

// -----------------------------
// 🔥 Start server after DB connects
// -----------------------------
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
    console.log("Allowed origins:", allowedOrigins);
  });
});