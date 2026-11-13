import express from "express";

import { saveIndividualOnboarding } from "../controllers/onboarding.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Save individual onboarding
router.post("/individual", protect, saveIndividualOnboarding);

export default router;