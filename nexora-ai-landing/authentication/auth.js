// =========================
// SELECT HTML ELEMENTS
// =========================

const signupForm = document.getElementById("signupForm");


const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

const message = document.getElementById("message");

console.log("signupForm:", signupForm);
console.log("passwordInput:", passwordInput);
console.log("togglePassword:", togglePassword);
console.log("message:", message);


// =========================
// SHOW / HIDE PASSWORD
// =========================

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "Hide";

        togglePassword.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "Show";

        togglePassword.setAttribute(
            "aria-label",
            "Show password"
        );

    }

});


// =========================
// FORM SUBMISSION
// =========================

signupForm.addEventListener("submit", function (event) {
    
    // Stop the browser from reloading the page.
    event.preventDefault();
    console.log("STEP 1: Form submission detected!");

    // Get the user's input.
    const firstName = document
        .getElementById("firstName")
        .value
        .trim();

    const lastName = document
        .getElementById("lastName")
        .value
        .trim();

    const username = document
        .getElementById("username")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = passwordInput.value;


    // Clear previous feedback.
    message.textContent = "";

    message.className = "message";


    // Check that names are provided.
    if (!firstName || !lastName) {

        showMessage(
            "Please enter your first and last name.",
            "error"
        );

        return;
    }


    // Check username length.
    if (username.length < 3) {

        showMessage(
            "Your username must contain at least 3 characters.",
            "error"
        );

        return;
    }


    // Check email.
    if (!email.includes("@") || !email.includes(".")) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    // Check password length.
    if (password.length < 8) {

        showMessage(
            "Your password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    // Check terms and conditions.
    const terms = document.getElementById("terms");

    if (!terms.checked) {

        showMessage(
            "Please agree to the terms before continuing.",
            "error"
        );

        return;
    }


    // Get the selected account type.
const accountType = document.getElementById("accountType").value;

// Check that an account type has been selected.
if (!accountType) {
    showMessage(
        "Please select an account type.",
        "error"
    );

    return;
}

  // Choose the correct onboarding page.
  let onboardingPage;

  if (accountType === "individual") {
    onboardingPage = "../onboarding/individual-onboarding.html";
  } else if (accountType === "business") {
    onboardingPage = "../onboarding/business-onboarding.html";
  } else {
    showMessage(
        "Please select a valid account type.",
        "error"
    );

    return;
}

// Show a message before navigating.
showMessage(
    `Welcome, ${firstName}! Taking you to your onboarding page...`,
    "success"
);

// Demonstration only: navigate without creating an account.
setTimeout(function () {
    window.location.href = onboardingPage;
}, 1000);
});


// =========================
// DISPLAY FEEDBACK
// =========================

function showMessage(text, type) {

    message.textContent = text;

    message.className = `message ${type}`;

}