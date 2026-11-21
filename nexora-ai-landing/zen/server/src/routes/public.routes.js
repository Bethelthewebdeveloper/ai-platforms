import express from "express";
import { runPublicAgent, verifyApiKey } from "../controllers/developer.controller.js";

const router = express.Router();
router.post("/agents/run", verifyApiKey, runPublicAgent);
export default router;
