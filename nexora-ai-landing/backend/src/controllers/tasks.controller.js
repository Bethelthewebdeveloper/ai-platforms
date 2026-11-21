import mongoose from "mongoose";
import Task from "../models/task.js";

const statuses = new Set(["todo", "in_progress", "done"]);
const priorities = new Set(["low", "medium", "high"]);

export async function listTasks(req, res) {
  const tasks = await Task.find({ userId: req.user._id }).sort({ status: 1, dueDate: 1, createdAt: -1 }).lean();
  res.json({ success: true, tasks });
}

export async function createTask(req, res) {
  const { title, description = "", dueDate = null, priority = "medium", category = "General" } = req.body || {};
  if (typeof title !== "string" || !title.trim()) return res.status(400).json({ success: false, message: "Enter a task title." });
  if (title.trim().length > 120 || typeof description !== "string" || description.length > 1000) return res.status(400).json({ success: false, message: "The task title or description is too long." });
  if (!priorities.has(priority)) return res.status(400).json({ success: false, message: "Choose a valid priority." });
  const parsedDueDate = dueDate ? new Date(dueDate) : null;
  if (dueDate && Number.isNaN(parsedDueDate.getTime())) return res.status(400).json({ success: false, message: "Choose a valid due date." });
  const task = await Task.create({ userId: req.user._id, title: title.trim(), description: description.trim(), dueDate: parsedDueDate, priority, category: typeof category === "string" ? category.trim().slice(0, 40) || "General" : "General" });
  res.status(201).json({ success: true, task });
}

export async function updateTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ success: false, message: "Invalid task." });
  const updates = {};
  const { title, description, dueDate, priority, status, category } = req.body || {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.trim().length > 120) return res.status(400).json({ success: false, message: "Enter a task title up to 120 characters." });
    updates.title = title.trim();
  }
  if (description !== undefined) {
    if (typeof description !== "string" || description.length > 1000) return res.status(400).json({ success: false, message: "Description must be under 1,000 characters." });
    updates.description = description.trim();
  }
  if (dueDate !== undefined) {
    const parsed = dueDate ? new Date(dueDate) : null;
    if (dueDate && Number.isNaN(parsed.getTime())) return res.status(400).json({ success: false, message: "Choose a valid due date." });
    updates.dueDate = parsed;
  }
  if (priority !== undefined) {
    if (!priorities.has(priority)) return res.status(400).json({ success: false, message: "Choose a valid priority." });
    updates.priority = priority;
  }
  if (status !== undefined) {
    if (!statuses.has(status)) return res.status(400).json({ success: false, message: "Choose a valid status." });
    updates.status = status;
  }
  if (category !== undefined) updates.category = typeof category === "string" ? category.trim().slice(0, 40) || "General" : "General";
  const task = await Task.findOneAndUpdate({ _id: req.params.taskId, userId: req.user._id }, { $set: updates }, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ success: false, message: "Task not found." });
  res.json({ success: true, task });
}

export async function deleteTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(400).json({ success: false, message: "Invalid task." });
  const task = await Task.findOneAndDelete({ _id: req.params.taskId, userId: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: "Task not found." });
  res.json({ success: true });
}
