import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { initSocket } from "./socket/index.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check
app.get("/health", (_, res) => res.send("OK"));

app.get("/", (_, res) => res.send("Chit-Chat API running"));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`)
);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
