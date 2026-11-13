
import User from "../models/User.js";

// =====================================
// SAVE INDIVIDUAL ONBOARDING
// =====================================

export const saveIndividualOnboarding = async (req, res) => {
  try {
    // Make sure the account is an individual account.
    if (req.user.accountType !== "individual") {
      return res.status(403).json({
        success: false,
        message: "This onboarding is only for individual accounts.",
      });
    }

    const {
      role,
      goal,
      experience,
      interest,
      frequency,
      challenge,
      interests,
    } = req.body;

    // Validate required answers.
    if (
      !role ||
      !goal ||
      !experience ||
      !interest ||
      !frequency ||
      !challenge
    ) {
      return res.status(400).json({
        success: false,
        message: "Please answer all required onboarding questions.",
      });
    }

    // Prepare onboarding information.
    const onboardingData = {
      role,
      goal,
      experience,
      interest,
      frequency,
      challenge,
      interests: interests || "",
    };

    // Find the authenticated user.
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Save onboarding information.
    user.onboardingProfile = onboardingData;
    user.onboardingCompleted = true;
    user.onboardingCompletedAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Individual onboarding completed successfully.",
      onboardingCompleted: user.onboardingCompleted,
    });

  } catch (error) {
    console.error("Onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save onboarding information.",
    });
  }
};
