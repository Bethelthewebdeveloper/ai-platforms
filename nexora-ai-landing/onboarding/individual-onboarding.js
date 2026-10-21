// ========================================
// NEXORA AI - INDIVIDUAL ONBOARDING
// ========================================

// 1. Select the HTML elements
const onboardingForm = document.getElementById(
    "individualOnboardingForm"
);

const onboardingMessage = document.getElementById(
    "onboardingMessage"
);

const continueButton = document.getElementById(
    "continueButton"
);


// 2. Listen for form submission
onboardingForm.addEventListener("submit", function (event) {

    // Prevent the page from refreshing
    event.preventDefault();

    // 3. Collect the user's answers
    const onboardingData = {
        role: document.getElementById("role").value,
        goal: document.getElementById("goal").value,
        experience: document.getElementById("experience").value,
        interest: document.getElementById("interest").value,
        frequency: document.getElementById("frequency").value,
        challenge: document.getElementById("challenge").value,
        interests: document.getElementById("interests").value.trim()
    };

    // 4. Check that the required questions are answered
    const requiredAnswers = [
        onboardingData.role,
        onboardingData.goal,
        onboardingData.experience,
        onboardingData.interest,
        onboardingData.frequency,
        onboardingData.challenge
    ];

    const allAnswered = requiredAnswers.every(function (answer) {
        return answer !== "";
    });

    if (!allAnswered) {
        showOnboardingMessage(
            "Please answer all required questions before continuing.",
            "error"
        );

        return;
    }

    // 5. Save the answers in the browser
    try {
        localStorage.setItem(
            "nexoraIndividualOnboarding",
            JSON.stringify(onboardingData)
        );
    } catch (error) {
        showOnboardingMessage(
            "We couldn't save your answers. Please try again.",
            "error"
        );

        return;
    }

    // 6. Show a success message
    showOnboardingMessage(
        "Your onboarding is complete! Welcome to Business Growth.",
        "success"
    );

    // 7. Disable the button while preparing to continue
    continueButton.disabled = true;
    continueButton.textContent = "Setup Complete ✓";

    // 8. Continue to the individual dashboard
    setTimeout(function () {
        window.location.href = "../dashboards/individual.html";
    }, 1500);

});


// 9. Display messages to the user
function showOnboardingMessage(message, type) {

    onboardingMessage.textContent = message;

    onboardingMessage.className = "message " + type;
}