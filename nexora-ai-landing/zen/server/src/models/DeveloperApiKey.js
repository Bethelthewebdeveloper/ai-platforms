import mongoose from "mongoose";
import { businessGrowthDB } from "../middleware/auth.middleware.js";

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, maxlength: 50 },
  prefix: { type: String, required: true },
  secretHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  tokenLimit: { type: Number, required: true },
  tokensUsed: { type: Number, default: 0 },
  revokedAt: { type: Date, default: null },
}, { timestamps: true, collection: "developer_api_keys" });

export default businessGrowthDB.models.DeveloperApiKey || businessGrowthDB.model("DeveloperApiKey", schema);
