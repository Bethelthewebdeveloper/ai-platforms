// =====================================
// BUSINESSGROWTH - INDIVIDUAL ONBOARDING
// =====================================

const API_URL = "http://127.0.0.1:4000/api/onboarding/individual";

const onboardingForm = document.getElementById("individualOnboardingForm");
const onboardingMessage = document.getElementById("onboardingMessage");
const continueButton = document.getElementById("continueButton");

onboardingForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = sessionStorage.getItem("businessGrowthToken");

    if (!token) {
        showOnboardingMessage(
            "Your session has expired. Please log in again.",
            "error"
        );

        setTimeout(() => {
            window.location.href = "../auth/login.html";
        }, 1500);

        return;
    }

    const onboardingData = {
        role: document.getElementById("role").value,
        goal: document.getElementById("goal").value,
        experience: document.getElementById("experience").value,
        interest: document.getElementById("interest").value,
        frequency: document.getElementById("frequency").value,
        challenge: document.getElementById("challenge").value,
        interests: document.getElementById("interests").value.trim()
    };

    const requiredAnswers = [
        onboardingData.role,
        onboardingData.goal,
        onboardingData.experience,
        onboardingData.interest,
        onboardingData.frequency,
        onboardingData.challenge
    ];

    if (requiredAnswers.some(answer => !answer)) {
        showOnboardingMessage(
            "Please answer all required questions.",
            "error"
        );
        return;
    }

    continueButton.disabled = true;
    continueButton.textContent = "Saving your answers...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(onboardingData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to save onboarding.");
        }

        showOnboardingMessage(
            "Your onboarding is complete! Welcome to BusinessGrowth.",
            "success"
        );

        continueButton.textContent = "Setup Complete ✓";

        setTimeout(() => {
            window.location.href = "../dashboards/individual/individual.html";
        }, 1500);

    } catch (error) {
        console.error("Onboarding error:", error);

        showOnboardingMessage(
            error.message || "Something went wrong. Please try again.",
            "error"
        );

        continueButton.disabled = false;
        continueButton.textContent = "Continue";
    }
});

function showOnboardingMessage(message, type) {
    onboardingMessage.textContent = message;
    onboardingMessage.className = "message " + type;
}