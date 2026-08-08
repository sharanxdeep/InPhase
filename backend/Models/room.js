import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderName: { type: String, required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true, maxlength: 1000 },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    videoId: { type: String, default: null },
    allowGuestControl: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false },
    messages: [messageSchema],
  },
  { timestamps: true }
);

roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Room || mongoose.model("Room", roomSchema);