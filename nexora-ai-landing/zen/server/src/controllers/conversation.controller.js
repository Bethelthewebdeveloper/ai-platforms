import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const conversations = await Conversation.find({ userId })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve conversations.",
    });
  }
};

const getConversationById = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve this conversation.",
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete conversation.",
    });
  }
};

const renameConversation = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a conversation title.",
      });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Conversation title cannot exceed 100 characters.",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        userId,
      },
      {
        $set: { title: title.trim() },
      },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation renamed successfully.",
      conversation,
    });
  } catch (error) {
    console.error("Rename conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not rename conversation.",
    });
  }
};

export {
  getConversations,
  getConversationById,
  deleteConversation,
  renameConversation,
};