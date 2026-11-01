import express from "express";

import {
  getConversations,
  getConversationById,
  deleteConversation,
  renameConversation,
} from "../controllers/conversation.controller.js";

const router = express.Router();

// Get all conversations for a user
router.get("/user/:userId", getConversations);

// Get one conversation and its messages
router.get("/:conversationId", getConversationById);

router.delete("/:conversationId", deleteConversation)

router.patch("/:conversationId/rename", renameConversation)

export default router;