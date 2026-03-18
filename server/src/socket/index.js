import jwt from "jsonwebtoken";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const initSocket = (io) => {
  const rooms = {};
  // roomId -> { adminUserId, adminSocketId, users: { socketId: { userId, username, avatar } } }

  // Auth middleware — runs once per connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      socket.data.username = decoded.username;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("Socket connected:", socket.id, socket.data.username);

    // Update user online status
    await User.findByIdAndUpdate(socket.data.userId, { isOnline: true });

    // JOIN ROOM
    socket.on("join-room", async ({ roomId }) => {
      try {
        if (!roomId) return socket.emit("error", { message: "Missing roomId" });

        const { userId, username } = socket.data;

        const room = await Room.findOne({ roomId, isActive: true })
          .populate("admin", "username avatar");
        if (!room) return socket.emit("error", { message: "Room not found" });

        const participant = room.participants.find(
          (p) => p.user.toString() === userId
        );
        if (!participant) return socket.emit("error", { message: "Join the room first via API" });

        const isAdmin = room.admin._id.toString() === userId;

        socket.join(roomId);
        socket.data.roomId = roomId;

        if (!rooms[roomId]) {
          rooms[roomId] = {
            adminUserId: room.admin._id.toString(),
            adminSocketId: null,
            users: {},
          };
        }

        const user = await User.findById(userId).select("avatar").lean();

        rooms[roomId].users[socket.id] = {
          userId,
          username,
          avatar: user?.avatar || "",
          role: participant.role || "member",
        };

        if (isAdmin) rooms[roomId].adminSocketId = socket.id;

        socket.emit("room-joined", {
          users: rooms[roomId].users,
          isAdmin,
        });

        socket.to(roomId).emit("room-update", {
          users: rooms[roomId].users,
        });

        // Notify room a user joined
        socket.to(roomId).emit("systemMessage", {
          text: `${username} joined the room`,
          timestamp: new Date().toISOString(),
        });

      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Join failed" });
      }
    });

    // CHAT MESSAGE
    socket.on("chatMessage", async ({ roomId, text, replyTo, mentions }) => {
      if (!roomId || !text?.trim()) return;
      if (!rooms[roomId]?.users[socket.id]) return socket.emit("error", { message: "Not in room" });

      const { userId, username } = socket.data;
      const timestamp = new Date();

      try {
        const message = await Message.create({
          roomId,
          sender: userId,
          text: text.trim(),
          type: "text",
          replyTo: replyTo || null,
          mentions: mentions || [],
          deliveredTo: [userId],
        });

        // Update room's last message
        await Room.findOneAndUpdate(
          { roomId },
          {
            lastMessage: {
              text: text.trim().slice(0, 60),
              sentAt: timestamp,
              sentBy: userId,
              senderName: username,
            },
          }
        );

        const payload = {
          _id: message._id,
          text: text.trim(),
          sender: username,
          userId,
          timestamp: timestamp.toISOString(),
          replyTo: replyTo || null,
          mentions: mentions || [],
          reactions: [],
          readBy: [userId],
          isEdited: false,
        };

        io.to(roomId).emit("chatMessage", payload);

        // Emit mention notifications
        if (mentions?.length) {
          for (const mentionedUserId of mentions) {
            const targetSocket = findSocketByUserId(mentionedUserId, rooms[roomId]);
            if (targetSocket) {
              io.to(targetSocket).emit("mentioned", {
                roomId,
                messageId: message._id,
                by: username,
              });
            }
          }
        }

      } catch (err) {
        console.error("chatMessage error:", err);
        socket.emit("error", { message: "Message failed" });
      }
    });

    // MEDIA MESSAGE
    socket.on("mediaMessage", async ({ roomId, url, name, size, mimeType, type }) => {
      if (!roomId || !url) return;
      if (!rooms[roomId]?.users[socket.id]) return socket.emit("error", { message: "Not in room" });

      const { userId, username } = socket.data;
      const timestamp = new Date();

      try {
        const message = await Message.create({
          roomId,
          sender: userId,
          text: "",
          type: type || "file",
          media: { url, name, size, mimeType },
        });

        await Room.findOneAndUpdate(
          { roomId },
          {
            lastMessage: {
              text: `📎 ${name || "File"}`,
              sentAt: timestamp,
              sentBy: userId,
              senderName: username,
            },
          }
        );

        io.to(roomId).emit("chatMessage", {
          _id: message._id,
          text: "",
          sender: username,
          userId,
          type: type || "file",
          media: { url, name, size, mimeType },
          timestamp: timestamp.toISOString(),
          reactions: [],
          readBy: [userId],
        });

      } catch (err) {
        console.error("mediaMessage error:", err);
        socket.emit("error", { message: "Media message failed" });
      }
    });

    // TYPING
    socket.on("typing", ({ roomId }) => {
      if (!rooms[roomId]?.users[socket.id]) return;
      socket.to(roomId).emit("typing", { username: socket.data.username });
    });

    socket.on("stop-typing", ({ roomId }) => {
      if (!rooms[roomId]?.users[socket.id]) return;
      socket.to(roomId).emit("stop-typing", { username: socket.data.username });
    });

    // EDIT MESSAGE
    socket.on("edit-message", async ({ roomId, messageId, text }) => {
      if (!rooms[roomId]?.users[socket.id]) return;
      if (!text?.trim()) return;

      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.data.userId) return;

        message.text = text.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(roomId).emit("message-edited", {
          messageId,
          text: text.trim(),
          editedAt: message.editedAt,
        });
      } catch (err) {
        console.error("edit-message error:", err);
      }
    });

    // DELETE MESSAGE
    socket.on("delete-message", async ({ roomId, messageId }) => {
      if (!rooms[roomId]?.users[socket.id]) return;

      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const room = rooms[roomId];
        const isAdmin = room.adminUserId === socket.data.userId;
        const isSender = message.sender.toString() === socket.data.userId;

        if (!isSender && !isAdmin) return;

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.text = "";
        await message.save();

        io.to(roomId).emit("message-deleted", { messageId });
      } catch (err) {
        console.error("delete-message error:", err);
      }
    });

    // REACT TO MESSAGE
    socket.on("react-message", async ({ roomId, messageId, emoji }) => {
      if (!rooms[roomId]?.users[socket.id]) return;

      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.findIndex(
            (u) => u.toString() === socket.data.userId
          );
          if (idx > -1) {
            existing.users.splice(idx, 1);
            if (existing.users.length === 0)
              message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
          } else {
            existing.users.push(socket.data.userId);
          }
        } else {
          message.reactions.push({ emoji, users: [socket.data.userId] });
        }

        await message.save();

        io.to(roomId).emit("message-reaction", {
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error("react-message error:", err);
      }
    });

    // READ RECEIPT
    socket.on("read-message", async ({ roomId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const alreadyRead = message.readBy.some(
          (r) => r.user.toString() === socket.data.userId
        );
        if (!alreadyRead) {
          message.readBy.push({ user: socket.data.userId, readAt: new Date() });
          await message.save();
        }

        socket.to(roomId).emit("message-read", {
          messageId,
          userId: socket.data.userId,
          username: socket.data.username,
        });
      } catch (err) {
        console.error("read-message error:", err);
      }
    });

    // KICK USER (ADMIN ONLY)
    socket.on("kick-user", ({ roomId, targetSocketId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.adminUserId !== socket.data.userId) return;

      const targetUser = room.users[targetSocketId];
      if (!targetUser) return;

      io.to(targetSocketId).emit("kicked");
      io.sockets.sockets.get(targetSocketId)?.leave(roomId);
      delete room.users[targetSocketId];

      io.to(roomId).emit("room-update", { users: room.users });
      io.to(roomId).emit("systemMessage", {
        text: `${targetUser.username} was removed by admin`,
        timestamp: new Date().toISOString(),
      });
    });

    // DISMISS ROOM (ADMIN ONLY)
    socket.on("dismiss-room", async ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (room.adminUserId !== socket.data.userId) return;

      io.to(roomId).emit("room-dismissed");
      await Room.findOneAndUpdate({ roomId }, { isActive: false });
      delete rooms[roomId];
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const { roomId, userId, username } = socket.data;

      // Update online status
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      if (!roomId || !rooms[roomId]) return;

      const room = rooms[roomId];
      delete room.users[socket.id];

      if (room.adminUserId === userId) {
        io.to(roomId).emit("room-dismissed");
        delete rooms[roomId];
        return;
      }

      io.to(roomId).emit("room-update", { users: room.users });
      io.to(roomId).emit("systemMessage", {
        text: `${username} left the room`,
        timestamp: new Date().toISOString(),
      });

      console.log("Socket disconnected:", socket.id);
    });
  });

  // Helper: find socket ID for a user in a room
  function findSocketByUserId(userId, room) {
    if (!room) return null;
    return Object.entries(room.users).find(
      ([, u]) => u.userId === userId.toString()
    )?.[0] || null;
  }
};
