import Room from "../Models/room.js";

const roomHosts = new Map();

export default function registerSocketHandlers(io, socket) {
  socket.on("join-room", async ({ roomId, hostId }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;

    const room = await Room.findOne({ roomId });
    if (room && room.hostId === hostId) {
      roomHosts.set(roomId, socket.id);
      socket.data.isHost = true;
    } else {
      socket.data.isHost = false;
    }

    console.log(`Socket ${socket.id} joined ${roomId}, isHost=${socket.data.isHost}`);
  });

  socket.on("video-action", async ({ roomId, type, time, videoId }) => {
    const isHostSocket = roomHosts.get(roomId) === socket.id;
    if (!isHostSocket) {
      const room = await Room.findOne({ roomId });
      if (!room?.allowGuestControl) return;
    }
    socket.to(roomId).emit("video-action", { type, time, videoId });
  });

  socket.on("toggle-guest-control", async ({ roomId, allow }) => {
    const isHostSocket = roomHosts.get(roomId) === socket.id;
    if (!isHostSocket) return;

    const room = await Room.findOneAndUpdate(
      { roomId },
      { allowGuestControl: allow },
      { new: true }
    );

    io.to(roomId).emit("guest-control-updated", {
      allowGuestControl: room.allowGuestControl,
    });
  });

  socket.on("sync-time", ({ roomId, time }) => {
    const isHostSocket = roomHosts.get(roomId) === socket.id;
    if (!isHostSocket) return;
    socket.to(roomId).emit("sync-time", { time });
  });

  socket.on("request-sync", ({ roomId }) => {
    const hostSocketId = roomHosts.get(roomId);
    if (hostSocketId) {
      io.to(hostSocketId).emit("sync-requested", { requesterId: socket.id });
    }
  });

  socket.on("sync-response", ({ requesterId, videoId, time, isPlaying }) => {
    io.to(requesterId).emit("sync-response", { videoId, time, isPlaying });
  });

  // THIS needs to be inside the function, with the others:
  socket.on("chat-message", async ({ roomId, senderId, senderName, text }) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim().slice(0, 1000);

    const message = {
      senderId,
      senderName,
      text: trimmedText,
      sentAt: new Date(),
    };

    await Room.findOneAndUpdate(
      { roomId },
      { $push: { messages: message } }
    );

    io.to(roomId).emit("chat-message", message);
  });

  socket.on("disconnect", () => {
    if (roomHosts.get(socket.data.roomId) === socket.id) {
      roomHosts.delete(socket.data.roomId);
    }
  });
}