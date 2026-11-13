
// ========================================
// BUSINESSGROWTH LOGIN AUTHENTICATION
// ========================================

const API_URL = "http://127.0.0.1:4000/api/auth";

// Select HTML elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");
const forgotPassword = document.getElementById("forgotPassword");

// ========================================
// DISPLAY MESSAGES
// ========================================

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

// ========================================
// SHOW / HIDE PASSWORD
// ========================================

togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
        togglePassword.setAttribute("aria-label", "Hide password");
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
        togglePassword.setAttribute("aria-label", "Show password");
    }
});

// ========================================
// FORGOT PASSWORD
// TEMPORARY PLACEHOLDER
// ========================================

forgotPassword.addEventListener("click", function (event) {
    event.preventDefault();

    showMessage(
        "Password recovery will be available soon.",
        "error"
    );
});

// ========================================
// LOGIN USER
// ========================================

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const submitButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    const buttonLabel = submitButton.querySelector("span:first-child");
    const originalButtonText = buttonLabel.textContent;

    showMessage("", "");

    // Validate inputs
    if (!email || !password) {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    try {
        // Disable button while logging in
        submitButton.disabled = true;
        buttonLabel.textContent = "Logging in...";

        showMessage("Authenticating your account...", "success");

        // Send login request to backend
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Login failed. Please try again."
            );
        }

        if (!result.success || !result.token || !result.user) {
            throw new Error("The server returned an incomplete response.");
        }

        // Save authentication session
        sessionStorage.setItem(
            "businessGrowthToken",
            result.token
        );

        sessionStorage.setItem(
            "businessGrowthUser",
            JSON.stringify(result.user)
        );

        showMessage(
            `Welcome back, ${result.user.firstName}!`,
            "success"
        );

        // Redirect based on account type
        const dashboardPage =
    result.user.accountType === "individual"
        ? "../dashboards/individual/individual.html"
        : "../dashboards/business/business.html";

        window.location.href = dashboardPage;

    } catch (error) {
        console.error("Login error:", error);

        if (error instanceof TypeError) {
            showMessage(
                "Cannot connect to BusinessGrowth. Make sure your backend server is running.",
                "error"
            );
        } else {
            showMessage(error.message, "error");
        }

    } finally {
        submitButton.disabled = false;
        buttonLabel.textContent = originalButtonText;
    }
});
