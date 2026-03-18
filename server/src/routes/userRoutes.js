import express from "express";
import User from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET CURRENT USER PROFILE
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE PROFILE
router.put("/me", authRequired, async (req, res) => {
  try {
    const { bio, notifications, theme } = req.body;

    const updates = {};
    if (bio !== undefined) updates.bio = bio.slice(0, 150);
    if (notifications) updates.notifications = notifications;
    if (theme && ["dark", "light"].includes(theme)) updates.theme = theme;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, select: "-passwordHash" }
    ).lean();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD AVATAR
router.post("/me/avatar", authRequired, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, select: "-passwordHash" }
    ).lean();

    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// SEARCH USERS
router.get("/search", authRequired, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: "Query too short" });

    const users = await User.find({
      username: { $regex: q.trim(), $options: "i" },
      isActive: true,
      _id: { $ne: req.user._id },
    })
      .select("username avatar isOnline lastSeen")
      .limit(20)
      .lean();

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER BY ID
router.get("/:userId", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("username avatar isOnline lastSeen bio")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
