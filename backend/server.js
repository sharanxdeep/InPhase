import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';

const PORT = process.env.PORT || 5001;

const app = express()
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173", credentials: true } })

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});


httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});