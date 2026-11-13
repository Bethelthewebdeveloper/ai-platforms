import express from "express";

import {
  getConversations,
  getConversationById,
  deleteConversation,
  renameConversation,
} from "../controllers/conversation.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect every conversation route
router.use(protect);

// Get all conversations for the authenticated user
router.get("/", getConversations);

// Get one conversation and its messages
router.get("/:conversationId", getConversationById);

// Delete one conversation
router.delete("/:conversationId", deleteConversation);

// Rename one conversation
router.patch("/:conversationId/rename", renameConversation);

export default router;