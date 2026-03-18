import express from "express";
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import path from "path";

const router = express.Router();

// UPLOAD MEDIA
router.post("/upload", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");
    const type = isImage ? "image" : isVideo ? "video" : "file";

    res.json({
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// EDIT MESSAGE
router.put("/:messageId", authRequired, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Text is required" });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Cannot edit others' messages" });

    if (message.isDeleted)
      return res.status(400).json({ message: "Cannot edit deleted message" });

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ message: "Message updated", data: message });
  } catch (err) {
    console.error("Edit message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE MESSAGE
router.delete("/:messageId", authRequired, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Allow sender or room admin to delete
    const room = await Room.findOne({ roomId: message.roomId });
    const isAdmin = room?.admin.toString() === req.user._id.toString();
    const isSender = message.sender.toString() === req.user._id.toString();

    if (!isSender && !isAdmin)
      return res.status(403).json({ message: "Cannot delete this message" });

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = "";
    await message.save();

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE REACTION
router.post("/:messageId/react", authRequired, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji required" });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existing = message.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      const idx = existing.users.indexOf(req.user._id);
      if (idx > -1) {
        existing.users.splice(idx, 1);
        if (existing.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existing.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    res.json({ reactions: message.reactions });
  } catch (err) {
    console.error("React error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK AS READ
router.post("/:messageId/read", authRequired, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const alreadyRead = message.readBy.some(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
      await message.save();
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
