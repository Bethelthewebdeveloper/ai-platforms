// ==========================================
// SELECT HTML ELEMENTS
// ==========================================

const businessForm = document.getElementById("business-onboarding-form");

const stepOne = document.getElementById("step-1");
const stepTwo = document.getElementById("step-2");

const nextButton = document.getElementById("next-button");
const backButton = document.getElementById("back-button");

const stepLabel = document.getElementById("step-label");
const progressBar = document.getElementById("progress-bar");
const progressPercentage = document.getElementById("progress-percentage");

const formMessage = document.getElementById("form-message");
const goalsError = document.getElementById("goals-error");

const goalCheckboxes = document.querySelectorAll(
    'input[name="businessGoals"]'
);


// ==========================================
// SHOW A PARTICULAR STEP
// ==========================================

function showStep(stepNumber) {
    stepOne.classList.remove("active");
    stepTwo.classList.remove("active");

    formMessage.textContent = "";
    formMessage.className = "form-message";

    if (stepNumber === 1) {
        stepOne.classList.add("active");

        stepLabel.textContent = "Step 1 of 2";
        progressPercentage.textContent = "50%";
        progressBar.style.width = "50%";
    } else {
        stepTwo.classList.add("active");

        stepLabel.textContent = "Step 2 of 2";
        progressPercentage.textContent = "100%";
        progressBar.style.width = "100%";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// VALIDATE STEP ONE
// ==========================================

function validateStepOne() {
    const businessName = document.getElementById("business-name");
    const industry = document.getElementById("business-industry");
    const businessSize = document.getElementById("business-size");

    const fields = [businessName, industry, businessSize];

    for (const field of fields) {
        if (!field.checkValidity()) {
            field.reportValidity();
            return false;
        }
    }

    return true;
}


// ==========================================
// CONTINUE TO STEP TWO
// ==========================================

nextButton.addEventListener("click", function () {
    if (validateStepOne()) {
        showStep(2);
    }
});


// ==========================================
// RETURN TO STEP ONE
// ==========================================

backButton.addEventListener("click", function () {
    showStep(1);
});


// ==========================================
// LIMIT BUSINESS GOALS TO THREE
// ==========================================

goalCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
        const selectedGoals = document.querySelectorAll(
            'input[name="businessGoals"]:checked'
        );

        goalsError.textContent = "";

        if (selectedGoals.length > 3) {
            checkbox.checked = false;

            goalsError.textContent =
                "You can select a maximum of three business goals.";
        }
    });
});


// ==========================================
// VALIDATE STEP TWO
// ==========================================

function validateStepTwo() {
    const businessRole = document.getElementById("business-role");

    if (!businessRole.checkValidity()) {
        businessRole.reportValidity();
        return false;
    }

    const selectedGoals = document.querySelectorAll(
        'input[name="businessGoals"]:checked'
    );

    if (selectedGoals.length === 0) {
        goalsError.textContent =
            "Please select at least one business goal.";

        goalsError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return false;
    }

    if (selectedGoals.length > 3) {
        goalsError.textContent =
            "Please select no more than three business goals.";

        return false;
    }

    goalsError.textContent = "";

    return true;
}


// ==========================================
// SUBMIT BUSINESS ONBOARDING
// ==========================================

businessForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateStepTwo()) {
        return;
    }

    const businessName = document.getElementById("business-name").value.trim();
    const industry = document.getElementById("business-industry").value;
    const businessSize = document.getElementById("business-size").value;
    const businessRole = document.getElementById("business-role").value;

    const selectedGoals = Array.from(
        document.querySelectorAll(
            'input[name="businessGoals"]:checked'
        )
    ).map(function (checkbox) {
        return checkbox.value;
    });

    const businessChallenge = document
        .getElementById("business-challenge")
        .value.trim();

    // Collect the user's answers.
    const businessOnboardingData = {
        businessName: businessName,
        industry: industry,
        businessSize: businessSize,
        businessRole: businessRole,
        businessGoals: selectedGoals,
        businessChallenge: businessChallenge,
        onboardingCompleted: true,
        completedAt: new Date().toISOString()
    };

    /*
       DEMO STORAGE ONLY

       This saves the answers in this browser.
       It does NOT save them to the project's database.

       Your backend teammate will need to connect this
       form to the approved BusinessGrowth API.
    */

    try {
        localStorage.setItem(
            "businessGrowthBusinessOnboarding",
            JSON.stringify(businessOnboardingData)
        );

        formMessage.textContent =
            "Your business onboarding answers have been saved in this browser!";

        formMessage.className = "form-message success";

        // Allow the user to see the success message.
        // Redirect to the business dashboard after a short delay.
        setTimeout(function () {
            window.location.href = "../dashboards/business/business.html";
        }, 1800);

    } catch (error) {
        console.error("Unable to save onboarding data:", error);

        formMessage.textContent =
            "We couldn't save your answers in this browser. Please try again.";

        formMessage.className = "form-message error";
    }
});


// ==========================================
// INITIAL PAGE STATE
// ==========================================

showStep(1);

