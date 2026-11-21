const readPositiveInt = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
};

export const AI_PLANS = Object.freeze({
  free: Object.freeze({
    id: "free",
    name: "Free",
    monthlyTokens: readPositiveInt("AI_FREE_MONTHLY_TOKENS", 20000),
    priceKobo: 0,
    maxActiveKeys: 0,
    keyLifetimeDays: 0,
    keyTokenLimit: 0,
    paystackPlanCode: "",
  }),
  pro: Object.freeze({
    id: "pro",
    name: "Pro",
    monthlyTokens: readPositiveInt("AI_PRO_MONTHLY_TOKENS", 250000),
    priceKobo: readPositiveInt("AI_PRO_PRICE_KOBO", 990000),
    maxActiveKeys: readPositiveInt("AI_PRO_MAX_API_KEYS", 3),
    keyLifetimeDays: readPositiveInt("AI_PRO_KEY_LIFETIME_DAYS", 7),
    keyTokenLimit: readPositiveInt("AI_PRO_KEY_TOKEN_LIMIT", 50000),
    paystackPlanCode: process.env.PAYSTACK_PRO_PLAN_CODE || "",
  }),
  business: Object.freeze({
    id: "business",
    name: "Business",
    monthlyTokens: readPositiveInt("AI_BUSINESS_MONTHLY_TOKENS", 1000000),
    priceKobo: readPositiveInt("AI_BUSINESS_PRICE_KOBO", 4990000),
    maxActiveKeys: readPositiveInt("AI_BUSINESS_MAX_API_KEYS", 10),
    keyLifetimeDays: readPositiveInt("AI_BUSINESS_KEY_LIFETIME_DAYS", 30),
    keyTokenLimit: readPositiveInt("AI_BUSINESS_KEY_TOKEN_LIMIT", 250000),
    paystackPlanCode: process.env.PAYSTACK_BUSINESS_PLAN_CODE || "",
  }),
});

export const AI_TOKEN_PACK = Object.freeze({
  tokens: readPositiveInt("AI_TOKEN_PACK_TOKENS", 100000),
  priceKobo: readPositiveInt("AI_TOKEN_PACK_PRICE_KOBO", 499000),
});

export const getPlan = (id) => AI_PLANS[id] || AI_PLANS.free;

export const getPlanIdFromPaystackCode = (code) =>
  Object.values(AI_PLANS).find((plan) => plan.paystackPlanCode === code)?.id || null;

export const isPaystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

