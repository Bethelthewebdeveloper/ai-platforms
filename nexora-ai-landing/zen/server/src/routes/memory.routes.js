import express from "express";

import {
  createMemory,
  approveMemorySuggestion,
  fetchMemories,
  findMemories,
  removeMemory,
} from "../controllers/memory.controller.js";

const router = express.Router();

// Search memories
router.get("/search", findMemories);

// Approve a memory suggestion
router.post("/suggestions/approve", approveMemorySuggestion);

// Save memory directly
router.post("/", createMemory);

// Retrieve memories
router.get("/:userId", fetchMemories);

// Delete memory
router.delete("/:memoryId", removeMemory);

export default router;