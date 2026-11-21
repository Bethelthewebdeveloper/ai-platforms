
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// =====================================
// INDIVIDUAL ONBOARDING SCHEMA
// =====================================

const onboardingSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        "student",
        "professional",
        "freelancer",
        "creator",
        "job-seeker",
        "researcher",
        "other",
      ],
    },

    goal: {
      type: String,
      enum: [
        "learning",
        "productivity",
        "content",
        "career",
        "business",
        "research",
        "other",
      ],
    },

    experience: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },

    interest: {
      type: String,
      enum: [
        "writing",
        "images",
        "coding",
        "video",
        "automation",
        "data",
        "all",
      ],
    },

    frequency: {
      type: String,
      enum: [
        "daily",
        "weekly",
        "occasionally",
        "exploring",
      ],
    },

    challenge: {
      type: String,
      enum: [
        "prompts",
        "finding-tools",
        "accuracy",
        "time",
        "learning",
        "none",
        "other",
      ],
    },

    interests: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false }
);

// =====================================
// USER SCHEMA
// =====================================

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },

    accountType: {
      type: String,
      required: true,
      enum: ["individual", "business"],
    },

    role: {
      type: String,
      default: "owner",
    },

    // Individual onboarding information
    onboardingProfile: {
      type: onboardingSchema,
      default: null,
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    onboardingCompletedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    aiPlan: {
      type: String,
      enum: ["free", "pro", "business"],
      default: "free",
    },

    aiTokensUsed: {
      type: Number,
      min: 0,
      default: 0,
    },

    aiTokenBalance: {
      type: Number,
      min: 0,
      default: 0,
    },

    aiUsagePeriodStart: {
      type: Date,
      default: Date.now,
    },

    paystackCustomerCode: {
      type: String,
      default: "",
    },

    aiBillingEventRefs: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// PASSWORD HASHING
// =====================================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// =====================================
// PASSWORD COMPARISON
// =====================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
