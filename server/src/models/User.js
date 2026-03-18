import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 150,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    rooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: {
      sound: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
    },
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "dark",
    },
  },
  { timestamps: true }
);

// userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

// Never expose passwordHash
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model("User", userSchema);
