import mongoose from "mongoose";
import Deal from "../models/deal.js";

const stages = new Set(["lead", "qualified", "proposal", "negotiation", "won", "lost"]);
const parseDate = (value) => value ? new Date(value) : null;
const validDate = (value) => !value || !Number.isNaN(parseDate(value).getTime());

export async function listDeals(req, res) {
  const deals = await Deal.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, deals });
}

export async function createDeal(req, res) {
  const { name, customer = "", amountKobo = 0, expectedCloseDate = null, stage = "lead", notes = "" } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) return res.status(400).json({ success: false, message: "Enter a deal name up to 120 characters." });
  if (typeof customer !== "string" || customer.length > 120 || typeof notes !== "string" || notes.length > 1500) return res.status(400).json({ success: false, message: "Check the customer and notes fields." });
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) return res.status(400).json({ success: false, message: "Enter a valid deal value." });
  if (!stages.has(stage)) return res.status(400).json({ success: false, message: "Choose a valid deal stage." });
  if (!validDate(expectedCloseDate)) return res.status(400).json({ success: false, message: "Choose a valid expected close date." });
  const deal = await Deal.create({ userId: req.user._id, name: name.trim(), customer: customer.trim(), amountKobo, expectedCloseDate: parseDate(expectedCloseDate), stage, notes: notes.trim() });
  res.status(201).json({ success: true, deal });
}

export async function updateDeal(req, res) {
  if (!mongoose.isValidObjectId(req.params.dealId)) return res.status(400).json({ success: false, message: "Invalid deal." });
  const updates = {};
  const { name, customer, amountKobo, expectedCloseDate, stage, notes } = req.body || {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) return res.status(400).json({ success: false, message: "Enter a deal name up to 120 characters." });
    updates.name = name.trim();
  }
  if (customer !== undefined) {
    if (typeof customer !== "string" || customer.length > 120) return res.status(400).json({ success: false, message: "Customer name must be under 120 characters." });
    updates.customer = customer.trim();
  }
  if (amountKobo !== undefined) {
    if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) return res.status(400).json({ success: false, message: "Enter a valid deal value." });
    updates.amountKobo = amountKobo;
  }
  if (expectedCloseDate !== undefined) {
    if (!validDate(expectedCloseDate)) return res.status(400).json({ success: false, message: "Choose a valid expected close date." });
    updates.expectedCloseDate = parseDate(expectedCloseDate);
  }
  if (stage !== undefined) {
    if (!stages.has(stage)) return res.status(400).json({ success: false, message: "Choose a valid deal stage." });
    updates.stage = stage;
  }
  if (notes !== undefined) {
    if (typeof notes !== "string" || notes.length > 1500) return res.status(400).json({ success: false, message: "Notes must be under 1,500 characters." });
    updates.notes = notes.trim();
  }
  const deal = await Deal.findOneAndUpdate({ _id: req.params.dealId, userId: req.user._id }, { $set: updates }, { new: true, runValidators: true });
  if (!deal) return res.status(404).json({ success: false, message: "Deal not found." });
  res.json({ success: true, deal });
}

export async function deleteDeal(req, res) {
  if (!mongoose.isValidObjectId(req.params.dealId)) return res.status(400).json({ success: false, message: "Invalid deal." });
  const deal = await Deal.findOneAndDelete({ _id: req.params.dealId, userId: req.user._id });
  if (!deal) return res.status(404).json({ success: false, message: "Deal not found." });
  res.json({ success: true });
}
