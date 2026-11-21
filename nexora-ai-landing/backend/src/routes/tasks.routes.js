import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/tasks.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);
export default router;
