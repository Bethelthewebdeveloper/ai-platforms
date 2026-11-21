
import User from "../models/user.js";
import jwt from "jsonwebtoken";

// Generate authentication token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// =========================
// REGISTER USER
// =========================

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      accountType,
    } = req.body;

    // Check required fields
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !accountType
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Validate account type
    if (!["individual", "business"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    // Validate names
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid first and last names.",
      });
    }

    // Validate username
    if (
      typeof username !== "string" ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters and contain only letters, numbers, or underscores.",
      });
    }

    // Validate email
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Validate password
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain 8-128 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // Check for existing email or username
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "This email is already registered."
            : "This username is already taken.",
      });
    }

    // Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      accountType,
    });

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};



// =========================
// LOGIN USER
// =========================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    // Find user and explicitly include hashed password
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    // Check account credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive.",
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate authentication token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};


// =====================================
// GET LOGGED-IN USER PROFILE
// =====================================

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,

    user: {
      id: req.user._id,

      firstName: req.user.firstName,
      lastName: req.user.lastName,
      username: req.user.username,
      email: req.user.email,

      accountType: req.user.accountType,
      role: req.user.role,

      // Onboarding information
      onboardingProfile: req.user.onboardingProfile,

      onboardingCompleted: req.user.onboardingCompleted,
      onboardingCompletedAt: req.user.onboardingCompletedAt,
    },
  });
};


