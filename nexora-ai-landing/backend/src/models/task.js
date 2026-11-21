import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
  category: { type: String, trim: true, maxlength: 40, default: "General" },
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);
export default Task;
