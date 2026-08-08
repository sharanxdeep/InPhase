import { nanoid } from "nanoid";
import Room from "../Models/room.js";

export const createRoom = async (req, res) => {
  try {
    const roomId = nanoid(8);
    const { hostId, hostName, videoId } = req.body;
    const room = await Room.create({ roomId, hostId, hostName, videoId });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};