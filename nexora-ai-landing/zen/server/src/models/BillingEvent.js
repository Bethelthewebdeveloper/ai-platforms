import mongoose from "mongoose";
import { businessGrowthDB } from "../middleware/auth.middleware.js";

const schema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  kind: { type: String, enum: ["subscription", "topup"], required: true },
  planId: String,
  amountKobo: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
}, { timestamps: true, collection: "ai_billing_events" });

export default businessGrowthDB.models.BillingEvent || businessGrowthDB.model("BillingEvent", schema);
