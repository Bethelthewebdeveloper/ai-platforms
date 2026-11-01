import mongoose from "mongoose";
import zenAgent from "../services/ai/zen.agent.js";
import Conversation from "../models/conversation.js";

import { getMemories } from "../services/memory/memory.service.js";
import { detectMemorySuggestion } from "../services/memory/memory.suggestion.service.js";

const sendMessage = async (req, res) => {
  try {
    const { userId, message, conversationId } = req.body;

    // Validate user ID
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: "A user ID is required.",
      });
    }

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message.",
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Your message is too long.",
      });
    }

    const cleanUserId = userId.trim();
    const cleanMessage = message.trim();

    // Find an existing conversation or create a new one
    let conversation;

    if (conversationId) {
      if (!mongoose.isValidObjectId(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID.",
        });
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: cleanUserId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }
    } else {
      conversation = new Conversation({
        userId: cleanUserId,
        title: cleanMessage.slice(0, 60),
      });
    }

    // Retrieve the user's saved memories
    const memories = await getMemories(cleanUserId);

    const memoryContext = memories
      .slice(0, 10)
      .map(
        (memory, index) =>
          `${index + 1}. [${memory.category}] ${memory.content}`
      )
      .join("\n");

    // Add the current user message to the conversation
    conversation.messages.push({
      role: "user",
      content: cleanMessage,
    });

    // Keep the latest 20 messages as conversation context
    const recentMessages = conversation.messages.slice(-20);

    const conversationContext = recentMessages
      .map((item) => {
        const speaker = item.role === "user" ? "USER" : "ZEN";
        return `${speaker}: ${item.content}`;
      })
      .join("\n");

    const memorySuggestion = detectMemorySuggestion(cleanMessage);

    const prompt = `
You are ZEN, an intelligent personal AI assistant.

Use the user's saved memories when relevant.
Use the conversation history to understand context and follow-up questions.
Do not invent memories or claim to remember information that is not provided.

USER'S SAVED MEMORIES:
${memoryContext || "No saved memories are available yet."}

RECENT CONVERSATION:
${conversationContext}

Respond naturally, helpfully, and honestly.
`;

    // Save the user's message
    await conversation.save();

    // Generate ZEN's response
    const result = await zenAgent.generate({ prompt });

    // Save ZEN's reply
    conversation.messages.push({
      role: "assistant",
      content: result.text,
    });

    await conversation.save();

    return res.status(200).json({
      success: true,
      assistant: "ZEN",
      reply: result.text,
      conversationId: conversation._id,
      title: conversation.title,
      memoriesUsed: Math.min(memories.length, 10),
      memorySuggestion,
    });
  } catch (error) {
    console.error("ZEN chat error:", error);

    return res.status(500).json({
      success: false,
      message: "ZEN could not process your message. Please try again.",
    });
  }
};

export { sendMessage };