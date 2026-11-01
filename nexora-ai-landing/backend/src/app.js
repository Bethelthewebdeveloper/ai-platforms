import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

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

export default app;