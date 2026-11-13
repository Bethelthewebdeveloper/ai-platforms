
import Memory from "../../models/memory.js";

// Save a new memory without creating duplicates
const saveMemory = async (data) => {
  const content = data.content.trim();
  const category = data.category || "general";

  const escapedContent = content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const existingMemory = await Memory.findOne({
    userId: data.userId,
    category,
    content: {
      $regex: `^${escapedContent}$`,
      $options: "i",
    },
  });

  if (existingMemory) {
    return existingMemory;
  }

  return await Memory.create({
    userId: data.userId,
    content,
    category,
    importance: data.importance ?? 5,
  });
};

// Retrieve a user's memories
const getMemories = async (userId) => {
  return Memory.find({ userId })
    .sort({ importance: -1, createdAt: -1 });
};

// Search memories
const searchMemories = async (userId, keyword) => {
  return Memory.find({
    userId,
    content: { $regex: keyword, $options: "i" },
  }).sort({ importance: -1 });
};

// Update a specific memory belonging to the user
const updateMemory = async (userId, memoryId, data) => {
  return Memory.findOneAndUpdate(
    { _id: memoryId, userId },
    {
      $set: {
        content: data.content.trim(),
        category: data.category,
        importance: data.importance,
      },
    },
    { new: true, runValidators: true }
  );
};

// Delete a memory
const deleteMemory = async (userId, memoryId) => {
  return Memory.findOneAndDelete({
    _id: memoryId,
    userId,
  });
};

export {
  saveMemory,
  getMemories,
  searchMemories,
  updateMemory,
  deleteMemory,
};
