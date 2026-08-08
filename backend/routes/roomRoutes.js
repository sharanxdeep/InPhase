import express from "express";
import { createRoom } from "../controllers/roomController.js";
import { Router } from "express";
import { getRoom } from "../controllers/roomController.js";

const router = express.Router();

router.post('/',createRoom);
router.get("/:roomId", getRoom);

export default router
