import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
        role: { type: String, enum: ["admin", "moderator", "member"], default: "member" },
        nickname: { type: String, default: "" },
      },
    ],
    isActive: { type: Boolean, default: true },
    maxParticipants: { type: Number, default: 50 },
    avatar: { type: String, default: "" },
    lastMessage: {
      text: String,
      sentAt: Date,
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      senderName: String,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

roomSchema.index({ roomId: 1 });
roomSchema.index({ admin: 1 });
roomSchema.index({ "participants.user": 1 });
roomSchema.index({ isActive: 1, createdAt: -1 });

roomSchema.virtual("participantCount").get(function () {
  return this.participants.length;
});

export default mongoose.model("Room", roomSchema);
