import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const validateAuthInput = (username, password) => {
  if (!username || !password) return "All fields required";
  if (username.length < 3 || username.length > 30) return "Username must be 3–30 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username: letters, numbers, underscores only";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

router.post("/register", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const validationError = validateAuthInput(username, password);
    if (validationError)
      return res.status(400).json({ message: validationError });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(400).json({ message: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const validationError = validateAuthInput(username, password);
    if (validationError)
      return res.status(400).json({ message: validationError });

    const user = await User.findOne({ username });

    // Always run bcrypt to prevent timing attacks
    const dummyHash = "$2b$12$invalidhashfortimingattackprevention000000000000000000";
    const ok = await bcrypt.compare(password, user?.passwordHash || dummyHash);

    if (!user || !ok)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account deactivated" });

    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date(),
    });

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user._id, username: user.username, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", authRequired, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
