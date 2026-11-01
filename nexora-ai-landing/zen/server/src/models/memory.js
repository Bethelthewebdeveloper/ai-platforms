import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "personal",
        "preference",
        "business",
        "project",
        "general",
      ],
      default: "general",
    },

    importance: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;