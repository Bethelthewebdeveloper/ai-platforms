import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import memoryRoutes from "./routes/memory.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import conversationRoutes from "./routes/conversation.routes.js"

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Memory routes
app.use("/api/memory", memoryRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

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