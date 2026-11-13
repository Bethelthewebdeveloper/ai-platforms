import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const businessGrowthDB = mongoose.createConnection(
  process.env.BUSINESSGROWTH_MONGODB_URI
);

const User =
  businessGrowthDB.models.User ||
  businessGrowthDB.model(
    "User",
    new mongoose.Schema(
      {
        firstName: String,
        lastName: String,
        username: String,
        email: String,
        accountType: String,
        role: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      { collection: "users" }
    )
  );

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await businessGrowthDB.asPromise();

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or inactive.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("ZEN authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Authentication failed. Please log in again.",
    });
  }
};