import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import memoryRoutes from "./routes/memory.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import conversationRoutes from "./routes/conversation.routes.js"
import developerRoutes from "./routes/developer.routes.js";
import { paystackWebhook } from "./controllers/developer.controller.js";
import publicRoutes from "./routes/public.routes.js";
import mediaRoutes from "./routes/media.routes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use("/api/billing/paystack/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "12mb" }));
app.use(morgan("dev"));

// Memory routes
app.use("/api/memory", memoryRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/developer", developerRoutes);
app.use("/v1", publicRoutes);
app.post("/api/billing/paystack/webhook", paystackWebhook);

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ZEN AI Assistant",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ZEN AI",
    status: "healthy",
  });
});

export default app;
