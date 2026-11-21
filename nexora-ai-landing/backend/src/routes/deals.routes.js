import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createDeal, deleteDeal, listDeals, updateDeal } from "../controllers/deals.controller.js";

const router = express.Router();
router.use(protect);
router.get("/", listDeals);
router.post("/", createDeal);
router.patch("/:dealId", updateDeal);
router.delete("/:dealId", deleteDeal);
export default router;
