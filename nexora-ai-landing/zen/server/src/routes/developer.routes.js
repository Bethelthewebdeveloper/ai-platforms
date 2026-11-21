import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createApiKey, getDeveloperOverview, revokeApiKey, startCheckout, startTopup } from "../controllers/developer.controller.js";

const router = express.Router();
router.use(protect);
router.get("/overview", getDeveloperOverview);
router.post("/keys", createApiKey);
router.delete("/keys/:id", revokeApiKey);
router.post("/checkout", startCheckout);
router.post("/topup", startTopup);
export default router;
