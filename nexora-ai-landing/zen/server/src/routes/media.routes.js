import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { analyzeMedia, createImage, createVideo, speak } from "../controllers/media.controller.js";

const router = express.Router();
router.use(protect);
router.post("/analyze", analyzeMedia);
router.post("/image", createImage);
router.post("/video", createVideo);
router.post("/speech", speak);
export default router;
