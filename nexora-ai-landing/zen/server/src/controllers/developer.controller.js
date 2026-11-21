import crypto from "node:crypto";
import { AI_PLANS, AI_TOKEN_PACK, getPlan, getPlanIdFromPaystackCode, isPaystackConfigured } from "../../../../shared/aiPlans.js";
import { businessGrowthDB } from "../middleware/auth.middleware.js";
import ApiKey from "../models/DeveloperApiKey.js";
import BillingEvent from "../models/BillingEvent.js";

const publicPlan = (plan) => ({ id: plan.id, name: plan.name, monthlyTokens: plan.monthlyTokens, priceKobo: plan.priceKobo, maxActiveKeys: plan.maxActiveKeys, keyLifetimeDays: plan.keyLifetimeDays, keyTokenLimit: plan.keyTokenLimit, checkoutAvailable: plan.id !== "free" && Boolean(plan.paystackPlanCode && isPaystackConfigured()) });
const safeInt = (n) => Number.isSafeInteger(n) && n > 0;
export const getActualTokenCount = (result, sourceText) => {
  const usage = result.totalUsage || result.usage || {};
  const providerTotal = usage.totalTokens ?? (Number.isFinite(usage.inputTokens) && Number.isFinite(usage.outputTokens) ? usage.inputTokens + usage.outputTokens : undefined);
  return safeInt(providerTotal) ? providerTotal : Math.max(1, Math.ceil((sourceText.length + (result.text || "").length) / 4));
};

export async function getDeveloperOverview(req, res) {
  const user = req.user;
  const plan = getPlan(user.aiPlan);
  const start = user.aiUsagePeriodStart || user.createdAt || new Date();
  const now = new Date();
  const periodExpired = start.getUTCFullYear() !== now.getUTCFullYear() || start.getUTCMonth() !== now.getUTCMonth();
  if (periodExpired) await user.updateOne({ $set: { aiTokensUsed: 0, aiUsagePeriodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) } });
  const used = periodExpired ? 0 : (user.aiTokensUsed || 0);
  const keys = await ApiKey.find({ userId: user._id, revokedAt: null }).select("name prefix expiresAt tokenLimit tokensUsed createdAt").lean();
  res.json({ success: true, plans: Object.values(AI_PLANS).map(publicPlan), plan: plan.id, usage: { monthlyLimit: plan.monthlyTokens, used, remaining: Math.max(0, plan.monthlyTokens - used) + (user.aiTokenBalance || 0), tokenBalance: user.aiTokenBalance || 0, resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) }, tokenPack: { ...AI_TOKEN_PACK, checkoutAvailable: isPaystackConfigured() }, billingConfigured: isPaystackConfigured(), keys });
}

export async function createApiKey(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 50) : "";
  if (!name) return res.status(400).json({ success: false, message: "Give this key a name." });
  const plan = getPlan(req.user.aiPlan);
  if (!plan.maxActiveKeys) return res.status(403).json({ success: false, message: "API keys are available on Pro and Business plans." });
  const active = await ApiKey.countDocuments({ userId: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (active >= plan.maxActiveKeys) return res.status(409).json({ success: false, message: `Your ${plan.name} plan allows ${plan.maxActiveKeys} active API keys.` });
  const secret = `nx_${crypto.randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + plan.keyLifetimeDays * 86400000);
  const apiKey = await ApiKey.create({ userId: req.user._id, name, prefix: secret.slice(0, 10), secretHash: crypto.createHash("sha256").update(secret).digest("hex"), expiresAt, tokenLimit: plan.keyTokenLimit });
  res.status(201).json({ success: true, key: secret, record: { id: apiKey._id, name, prefix: apiKey.prefix, expiresAt, tokenLimit: apiKey.tokenLimit, tokensUsed: 0 } });
}

export async function revokeApiKey(req, res) {
  const result = await ApiKey.updateOne({ _id: req.params.id, userId: req.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  if (!result.modifiedCount) return res.status(404).json({ success: false, message: "Active API key not found." });
  res.json({ success: true });
}

async function initializePaystack(req, amountKobo, kind, planId) {
  if (!isPaystackConfigured()) throw new Error("Billing is not configured yet. Add your Paystack secret key first.");
  const reference = `nx_${crypto.randomUUID().replaceAll("-", "")}`;
  const event = await BillingEvent.create({ reference, userId: req.user._id, kind, planId, amountKobo });
  const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: req.user.email, amount: amountKobo, reference, ...(kind === "subscription" ? { plan: getPlan(planId).paystackPlanCode } : {}), callback_url: process.env.PAYSTACK_CALLBACK_URL || "http://localhost:4000/billing/return", metadata: { userId: String(req.user._id), kind, planId } }) });
  const data = await response.json();
  if (!response.ok || !data.status || !data.data?.authorization_url) { await event.updateOne({ status: "failed" }); throw new Error(data.message || "Could not start Paystack checkout."); }
  return { authorizationUrl: data.data.authorization_url, reference };
}

export async function startCheckout(req, res) {
  const plan = getPlan(req.body.planId);
  if (plan.id === "free" || !plan.paystackPlanCode) return res.status(503).json({ success: false, message: "Add Paystack plan codes in the server environment before enabling paid plan checkout." });
  try { res.json({ success: true, ...(await initializePaystack(req, plan.priceKobo, "subscription", plan.id)) }); }
  catch (error) { res.status(503).json({ success: false, message: error.message }); }
}

export async function startTopup(req, res) {
  try { res.json({ success: true, ...(await initializePaystack(req, AI_TOKEN_PACK.priceKobo, "topup", "")) }); }
  catch (error) { res.status(503).json({ success: false, message: error.message }); }
}

export async function paystackWebhook(req, res) {
  const currentHeader = req.headers["paystack-signature"];
  const secret = currentHeader ? process.env.PAYSTACK_WEBHOOK_SECRET : process.env.PAYSTACK_SECRET_KEY;
  const signature = currentHeader || req.headers["x-paystack-signature"];
  if (!secret || !signature || !Buffer.isBuffer(req.body)) return res.sendStatus(401);
  let verified = false;
  if (currentHeader) {
    const values = String(signature).split(",");
    const timestamp = Number(values.find((part) => part.trim().startsWith("t="))?.trim().slice(2));
    const signatures = values.filter((part) => part.trim().startsWith("v1=")).map((part) => part.trim().slice(3).split(":").at(-1));
    if (Number.isFinite(timestamp) && Math.abs(Date.now() / 1000 - timestamp) <= 300) {
      const digest = crypto.createHmac("sha512", secret).update(`${timestamp}.`).update(req.body).digest("hex");
      verified = signatures.some((candidate) => { const a = Buffer.from(candidate); const b = Buffer.from(digest); return a.length === b.length && crypto.timingSafeEqual(a, b); });
    }
  } else {
    const expected = crypto.createHmac("sha512", secret).update(req.body).digest("hex");
    const a = Buffer.from(String(signature)); const b = Buffer.from(expected);
    verified = a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  if (!verified) return res.sendStatus(401);
  const payload = JSON.parse(req.body.toString("utf8"));
  if (payload.event === "invoice.payment_failed" || payload.event === "subscription.disable") {
    const customerCode = payload.data?.customer?.customer_code || payload.data?.subscription?.customer?.customer_code;
    const email = payload.data?.customer?.email || payload.data?.subscription?.customer?.email;
    if (customerCode || email) await businessGrowthDB.models.User.updateOne({ $or: [...(customerCode ? [{ paystackCustomerCode: customerCode }] : []), ...(email ? [{ email: email.toLowerCase() }] : [])] }, { $set: { aiPlan: "free", aiTokensUsed: 0, aiUsagePeriodStart: new Date() } });
    return res.sendStatus(200);
  }
  if (payload.event !== "charge.success" || !payload.data?.reference) return res.sendStatus(200);
  if (payload.data.currency !== "NGN") return res.sendStatus(200);
  const event = await BillingEvent.findOne({ reference: payload.data.reference, status: "pending" });
  if (!event || Number(payload.data.amount) !== event.amountKobo) return res.sendStatus(200);
  const User = businessGrowthDB.models.User || businessGrowthDB.model("User", new (await import("mongoose")).default.Schema({}, { strict: false, collection: "users" }));
  const user = await User.findById(event.userId);
  if (!user) return res.sendStatus(200);
  const update = { $push: { aiBillingEventRefs: { $each: [event.reference], $slice: -100 } } };
  if (event.kind === "topup" && payload.data.currency === "NGN") update.$inc = { aiTokenBalance: AI_TOKEN_PACK.tokens };
  else if (event.kind === "subscription" && payload.data.currency === "NGN") {
    const plan = getPlan(event.planId);
    if (getPlanIdFromPaystackCode(payload.data.plan_object?.plan_code || plan.paystackPlanCode) === event.planId) update.$set = { aiPlan: event.planId, aiTokensUsed: 0, aiUsagePeriodStart: new Date(), paystackCustomerCode: payload.data.customer?.customer_code || user.paystackCustomerCode };
  }
  const updated = await User.updateOne({ _id: user._id, aiBillingEventRefs: { $ne: event.reference } }, update);
  const alreadyApplied = !updated.matchedCount && await User.exists({ _id: user._id, aiBillingEventRefs: event.reference });
  if (updated.matchedCount || alreadyApplied) await BillingEvent.updateOne({ _id: event._id }, { $set: { status: "paid" } });
  return res.sendStatus(200);
}

export async function verifyApiKey(req, res, next) {
  try {
    const raw = req.headers["x-api-key"];
    if (typeof raw !== "string" || !raw.startsWith("nx_")) return res.status(401).json({ success: false, message: "Provide a valid X-API-Key." });
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const key = await ApiKey.findOne({ secretHash: hash, revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!key) return res.status(401).json({ success: false, message: "API key is invalid, expired, or revoked." });
    req.apiKey = key; req.user = await businessGrowthDB.models.User.findById(key.userId);
    if (!req.user || !req.user.isActive) return res.status(401).json({ success: false, message: "Account is inactive." });
    if (!getPlan(req.user.aiPlan).maxActiveKeys) return res.status(403).json({ success: false, message: "API access requires an active Pro or Business plan." });
    next();
  } catch { res.status(401).json({ success: false, message: "API key authentication failed." }); }
}

export async function recordApiUsage(req, tokens) {
  if (!safeInt(tokens)) tokens = 1;
  const plan = getPlan(req.user.aiPlan);
  const start = req.user.aiUsagePeriodStart || new Date(); const now = new Date();
  const expired = start.getUTCFullYear() !== now.getUTCFullYear() || start.getUTCMonth() !== now.getUTCMonth();
  if (expired) await req.user.updateOne({ $set: { aiTokensUsed: 0, aiUsagePeriodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) } });
  const used = expired ? 0 : (req.user.aiTokensUsed || 0);
  const monthlyRemaining = Math.max(0, plan.monthlyTokens - used);
  const monthlyCharge = Math.min(tokens, monthlyRemaining);
  const balanceCharge = tokens - monthlyCharge;
  if (tokens > monthlyRemaining + (req.user.aiTokenBalance || 0)) throw new Error("Monthly AI token allowance exhausted. Upgrade your plan or buy a token pack.");
  const userFilter = { _id: req.user._id };
  if (monthlyCharge) userFilter.$or = [{ aiTokensUsed: { $lte: plan.monthlyTokens - monthlyCharge } }, { aiTokensUsed: { $exists: false } }];
  if (balanceCharge) userFilter.aiTokenBalance = { $gte: balanceCharge };
  const userUpdate = await req.user.constructor.updateOne(userFilter, { $inc: { aiTokensUsed: monthlyCharge, aiTokenBalance: -balanceCharge } });
  if (!userUpdate.matchedCount) throw new Error("Monthly AI token allowance exhausted. Upgrade your plan or buy a token pack.");
  if (req.apiKey) {
    const keyUpdate = await req.apiKey.constructor.updateOne({ _id: req.apiKey._id, tokensUsed: { $lte: req.apiKey.tokenLimit - tokens } }, { $inc: { tokensUsed: tokens } });
    if (!keyUpdate.matchedCount) {
      await req.user.constructor.updateOne({ _id: req.user._id }, { $inc: { aiTokensUsed: -monthlyCharge, aiTokenBalance: balanceCharge } });
      throw new Error("This API key reached its token limit. Generate another key or upgrade your plan.");
    }
  }
  return { tokens, remaining: Math.max(0, plan.monthlyTokens - used - monthlyCharge) + Math.max(0, (req.user.aiTokenBalance || 0) - balanceCharge) };
}

export async function runPublicAgent(req, res) {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt || prompt.length > 12000) return res.status(400).json({ success: false, message: "Provide a prompt with 1 to 12,000 characters." });
  try {
    const { default: zenAgent } = await import("../services/ai/zen.agent.js");
    const result = await zenAgent.generate({ prompt, personaInstruction: "Use a neutral professional persona." });
    const tokens = getActualTokenCount(result, prompt);
    const usage = await recordApiUsage(req, tokens);
    res.json({ success: true, model: process.env.AI_GATEWAY_MODEL, output: result.text, usage });
  } catch (error) {
    const exhausted = /token allowance exhausted|token limit/i.test(error.message);
    res.status(exhausted ? 402 : 502).json({ success: false, message: exhausted ? error.message : "The AI request could not be completed." });
  }
}
