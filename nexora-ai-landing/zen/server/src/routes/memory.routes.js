import express from "express";

import {
  createMemory,
  approveMemorySuggestion,
  fetchMemories,
  findMemories,
  editMemory,
  removeMemory,
} from "../controllers/memory.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All memory routes require BusinessGrowth authentication
router.use(protect);

// Search memories
router.get("/search", findMemories);

// Approve a memory suggestion
router.post("/suggestions/approve", approveMemorySuggestion);

// Save memory directly
router.post("/", createMemory);

// Retrieve authenticated user's memories
router.get("/", fetchMemories);

// Update an existing memory
router.patch("/:memoryId", editMemory);

// Delete a memory
router.delete("/:memoryId", removeMemory);

export default router;