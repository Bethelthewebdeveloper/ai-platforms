import express from "express";
import { sendMessage } from "../controllers/chat.controller.js";

const router = express.Router();

// Send a message to ZEN
router.post("/", sendMessage);

export default router;