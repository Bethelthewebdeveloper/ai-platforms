import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 25, default: "" },
  company: { type: String, trim: true, maxlength: 160, default: "" },
  customerType: { type: String, enum: ["individual", "business"], required: true },
  industry: { type: String, trim: true, maxlength: 60, default: "" },
  location: { type: String, trim: true, maxlength: 120, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

customerSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.model("Customer", customerSchema);
