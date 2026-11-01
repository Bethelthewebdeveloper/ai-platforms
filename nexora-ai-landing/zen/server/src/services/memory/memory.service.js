import Memory from "../../models/memory.js";

// Save a new memory
const saveMemory = async (data) => {
  const memory = await Memory.create({
    userId: data.userId,
    content: data.content,
    category: data.category || "general",
    importance: data.importance ?? 5,
  });

  return memory;
};

// Retrieve a user's memories
const getMemories = async (userId) => {
  return await Memory.find({ userId })
    .sort({ importance: -1, createdAt: -1 });
};

// Search memories
const searchMemories = async (userId, keyword) => {
  return await Memory.find({
    userId,
    content: { $regex: keyword, $options: "i" },
  }).sort({ importance: -1 });
};

// Delete a memory
const deleteMemory = async (userId, memoryId) => {
  return await Memory.findOneAndDelete({
    _id: memoryId,
    userId,
  });
};

export {
  saveMemory,
  getMemories,
  searchMemories,
  deleteMemory,
};