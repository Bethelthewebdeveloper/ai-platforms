import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  customer: { type: String, trim: true, maxlength: 120, default: "" },
  amountKobo: { type: Number, min: 0, required: true, default: 0 },
  expectedCloseDate: { type: Date, default: null },
  stage: { type: String, enum: ["lead", "qualified", "proposal", "negotiation", "won", "lost"], default: "lead" },
  notes: { type: String, trim: true, maxlength: 1500, default: "" },
}, { timestamps: true });

export default mongoose.model("Deal", dealSchema);
