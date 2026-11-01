import {
  saveMemory,
  getMemories,
  searchMemories,
  deleteMemory,
} from "../services/memory/memory.service.js";

// Save memory
const createMemory = async (req, res) => {
  try {
    const { userId, content, category, importance } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        message: "User ID and memory content are required.",
      });
    }

    const memory = await saveMemory({
      userId,
      content,
      category,
      importance,
    });

    return res.status(201).json({
      success: true,
      message: "Memory saved successfully.",
      memory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve and save a suggested memory
const approveMemorySuggestion = async (req, res) => {
  try {
    const { userId, suggestion } = req.body;

    if (
      !userId ||
      typeof userId !== "string" ||
      !suggestion ||
      typeof suggestion.content !== "string" ||
      !suggestion.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A user ID and valid memory suggestion are required.",
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
      userId: userId.trim(),
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

// Retrieve memories
const fetchMemories = async (req, res) => {
  try {
    const memories = await getMemories(req.params.userId);

    return res.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search memories
const findMemories = async (req, res) => {
  try {
    const { userId, keyword } = req.query;

    if (!userId || !keyword) {
      return res.status(400).json({
        success: false,
        message: "User ID and keyword are required.",
      });
    }

    const memories = await searchMemories(userId, keyword);

    return res.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete memory
const removeMemory = async (req, res) => {
  try {
    const { userId } = req.body;
    const { memoryId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const memory = await deleteMemory(userId, memoryId);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found.",
      });
    }

    return res.json({
      success: true,
      message: "Memory deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createMemory,
  approveMemorySuggestion,
  fetchMemories,
  findMemories,
  removeMemory,
};