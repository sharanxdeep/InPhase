import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import connectDB from './config/db.js';
import roomRoutes from "./routes/roomRoutes.js";
import registerSocketHandlers from './sockets/socketHandler.js';
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express()
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use("/api/rooms", roomRoutes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true } })

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });

  registerSocketHandlers(io,socket);
});

connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
