import mongoose from "mongoose";

import {
  saveMemory,
  getMemories,
  searchMemories,
  updateMemory,
  deleteMemory,
} from "../services/memory/memory.service.js";

// Save memory
const createMemory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { content, category, importance } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Memory content is required.",
      });
    }

    const memory = await saveMemory({
      userId,
      content: content.trim().slice(0, 500),
      category,
      importance,
    });

    return res.status(201).json({
      success: true,
      message: "Memory saved successfully.",
      memory,
    });
  } catch (error) {
    console.error("Create memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save memory.",
    });
  }
};

// Approve a suggested memory
const approveMemorySuggestion = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { suggestion } = req.body;

    if (
      !suggestion ||
      typeof suggestion.content !== "string" ||
      !suggestion.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid memory suggestion is required.",
      });
    }

    const allowedCategories = [
      "personal",
      "preference",
      "business",
      "project",
      "general",
    ];

    const category = allowedCategories.includes(suggestion.category)
      ? suggestion.category
      : "general";

    const importance = Number.isInteger(suggestion.importance)
      ? Math.min(10, Math.max(1, suggestion.importance))
      : 5;

    const memory = await saveMemory({
      userId,
      content: suggestion.content.trim().slice(0, 500),
      category,
      importance,
    });

    return res.status(201).json({
      success: true,
      message: "Memory suggestion approved and saved.",
      memory,
    });
  } catch (error) {
    console.error("Memory approval error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save the approved memory.",
    });
  }
};

// Retrieve authenticated user's memories
const fetchMemories = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const memories = await getMemories(userId);

    return res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    console.error("Fetch memories error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve memories.",
    });
  }
};

// Search authenticated user's memories
const findMemories = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        message: "A search keyword is required.",
      });
    }

    const memories = await searchMemories(userId, keyword.trim());

    return res.status(200).json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    console.error("Search memories error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not search memories.",
    });
  }
};

// Update an existing memory
const editMemory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { memoryId } = req.params;
    const { content, category, importance } = req.body;

    if (!mongoose.isValidObjectId(memoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid memory ID.",
      });
    }

    const allowedCategories = [
      "personal",
      "preference",
      "business",
      "project",
      "general",
    ];

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Memory content must contain 1–500 characters.",
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid memory category.",
      });
    }

    if (!Number.isInteger(importance) || importance < 1 || importance > 10) {
      return res.status(400).json({
        success: false,
        message: "Importance must be between 1 and 10.",
      });
    }

    const memory = await updateMemory(userId, memoryId, {
      content: content.trim(),
      category,
      importance,
    });

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Memory updated successfully.",
      memory,
    });
  } catch (error) {
    console.error("Update memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update memory.",
    });
  }
};

// Delete authenticated user's memory
const removeMemory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { memoryId } = req.params;

    if (!mongoose.isValidObjectId(memoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid memory ID.",
      });
    }

    const memory = await deleteMemory(userId, memoryId);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Memory deleted successfully.",
    });
  } catch (error) {
    console.error("Delete memory error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete memory.",
    });
  }
};

export {
  createMemory,
  approveMemorySuggestion,
  fetchMemories,
  findMemories,
  editMemory,
  removeMemory,
};