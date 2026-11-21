import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import dealsRoutes from "./routes/deals.routes.js";
import customersRoutes from "./routes/customers.routes.js";

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
}));

// Request handling
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("dev"));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/customers", customersRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to BusinessGrowth AI",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "BusinessGrowth AI Backend",
    status: "healthy",
  });
});

app.get("/billing/return", (_req, res) => {
  res.type("html").send("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Payment submitted</title><body style=\"font:16px system-ui;max-width:600px;margin:12vh auto;padding:24px;color:#102033\"><h1>Payment submitted</h1><p>Paystack is confirming your payment. Return to your BusinessGrowth dashboard and refresh Settings in a moment to see your plan or token balance.</p></body></html>");
});

export default app;
