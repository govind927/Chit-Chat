import express from "express";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authRequired } from "../middleware/authMiddleware.js";
import { generateRoomId } from "../utils/generateRoomId.js";

const router = express.Router();

// CREATE
router.post("/create", authRequired, async (req, res) => {
  try {
    const { name, description, maxParticipants } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: "Room name is required" });
    if (name.trim().length < 2 || name.trim().length > 50)
      return res.status(400).json({ message: "Room name must be 2–50 characters" });

    let id, exists, attempts = 0;
    do {
      id = generateRoomId();
      exists = await Room.findOne({ roomId: id });
      if (++attempts > 10)
        return res.status(500).json({ message: "Could not generate unique room ID" });
    } while (exists);

    const room = await Room.create({
      roomId: id,
      name: name.trim(),
      description: description?.trim() || "",
      admin: req.user._id,
      maxParticipants: maxParticipants || 50,
      participants: [{ user: req.user._id, role: "admin" }],
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: room._id },
    });

    res.status(201).json({
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      isAdmin: true,
    });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// JOIN
router.post("/join", authRequired, async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId?.trim())
      return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findOne({ roomId: roomId.trim().toUpperCase(), isActive: true })
      .populate("admin", "username avatar");
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.participants.length >= room.maxParticipants)
      return res.status(400).json({ message: "Room is full" });

    const already = room.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!already) {
      room.participants.push({ user: req.user._id, role: "member" });
      await room.save();
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { rooms: room._id },
      });
    }

    const isAdmin = room.admin._id.toString() === req.user._id.toString();
    const participant = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    res.json({
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      adminName: room.admin.username,
      participantCount: room.participants.length,
      isAdmin,
      role: participant?.role || "member",
    });
  } catch (err) {
    console.error("Join room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LEAVE
router.post("/leave", authRequired, async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId?.trim())
      return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findOne({ roomId, isActive: true });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.admin.toString() === req.user._id.toString())
      return res.status(400).json({ message: "Admin must dismiss the room instead of leaving" });

    room.participants = room.participants.filter(
      (p) => p.user.toString() !== req.user._id.toString()
    );
    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { rooms: room._id },
    });

    res.json({ message: "Left room successfully" });
  } catch (err) {
    console.error("Leave room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DISMISS
router.post("/dismiss", authRequired, async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId?.trim())
      return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can dismiss" });

    await Room.findByIdAndUpdate(room._id, { isActive: false });

    await User.updateMany(
      { rooms: room._id },
      { $pull: { rooms: room._id } }
    );

    res.json({ message: "Room dismissed" });
  } catch (err) {
    console.error("Dismiss room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET MESSAGE HISTORY
router.get("/:roomId/messages", authRequired, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const room = await Room.findOne({ roomId, isActive: true });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const isMember = room.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (!isMember)
      return res.status(403).json({ message: "Not a member of this room" });

    const messages = await Message.find({ roomId, isDeleted: false })
      .populate("sender", "username avatar")
      .populate("replyTo", "text sender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit,
    });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER'S ROOMS
router.get("/my-rooms", authRequired, async (req, res) => {
  try {
    const rooms = await Room.find({
      "participants.user": req.user._id,
      isActive: true,
    })
      .populate("lastMessage.sentBy", "username")
      .sort({ "lastMessage.sentAt": -1 })
      .lean();

    res.json({ rooms });
  } catch (err) {
    console.error("Fetch rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
