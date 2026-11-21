import mongoose from "mongoose";
import Customer from "../models/customer.js";

const fields = ["firstName", "lastName", "email", "phone", "company", "customerType", "industry", "location", "status"];
const types = new Set(["individual", "business"]);
const statuses = new Set(["Active", "Inactive"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data, partial = false) {
  const updates = {};
  for (const field of fields) {
    if (partial && data[field] === undefined) continue;
    const value = data[field] ?? (partial ? undefined : "");
    if (field === "customerType") {
      if (!types.has(value)) return { error: "Choose Individual or Business for customer type." };
      updates[field] = value;
    } else if (field === "status") {
      if (!statuses.has(value)) return { error: "Choose a valid customer status." };
      updates[field] = value;
    } else {
      if (typeof value !== "string") return { error: `Enter a valid ${field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}.` };
      const text = value.trim();
      const max = { firstName: 80, lastName: 80, email: 254, phone: 25, company: 160, industry: 60, location: 120 }[field];
      if (text.length > max) return { error: `${field} is too long.` };
      if (["firstName", "lastName", "email"].includes(field) && !text) return { error: `${field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} is required.` };
      if (field === "email" && !emailPattern.test(text)) return { error: "Enter a valid email address." };
      updates[field] = field === "email" ? text.toLowerCase() : text;
    }
  }
  return { updates };
}

export async function listCustomers(req, res) {
  const customers = await Customer.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, customers });
}

export async function createCustomer(req, res) {
  const { updates, error } = validate(req.body || {});
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const legacyCreatedAt = req.body?.createdAt ? new Date(req.body.createdAt) : null;
    const createdAt = legacyCreatedAt && !Number.isNaN(legacyCreatedAt.getTime()) && legacyCreatedAt <= new Date() ? legacyCreatedAt : undefined;
    const customer = await Customer.create({ ...updates, ...(createdAt ? { createdAt } : {}), userId: req.user._id });
    return res.status(201).json({ success: true, customer });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "A customer with this email address already exists." });
    throw err;
  }
}

export async function updateCustomer(req, res) {
  if (!mongoose.isValidObjectId(req.params.customerId)) return res.status(400).json({ success: false, message: "Invalid customer." });
  const { updates, error } = validate(req.body || {}, true);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const customer = await Customer.findOneAndUpdate({ _id: req.params.customerId, userId: req.user._id }, { $set: updates }, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    return res.json({ success: true, customer });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "A customer with this email address already exists." });
    throw err;
  }
}

export async function deleteCustomer(req, res) {
  if (!mongoose.isValidObjectId(req.params.customerId)) return res.status(400).json({ success: false, message: "Invalid customer." });
  const customer = await Customer.findOneAndDelete({ _id: req.params.customerId, userId: req.user._id });
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  res.json({ success: true });
}
