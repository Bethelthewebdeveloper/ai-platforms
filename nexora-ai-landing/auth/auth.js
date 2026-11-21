
// ========================================
// BUSINESSGROWTH SIGNUP AUTHENTICATION
// ========================================

const API_URL = `${window.BusinessGrowthAPI.core}/auth`;

// Select HTML elements
const signupForm = document.getElementById("signupForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");

// Check required elements
if (!signupForm || !passwordInput || !togglePassword || !message) {
    console.error("Required signup elements are missing. Check auth.html.");
}

// ========================================
// SHOW / HIDE PASSWORD
// ========================================

if (togglePassword && passwordInput) {
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
}

// ========================================
// DISPLAY MESSAGES
// ========================================

function showMessage(text, type) {
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;
}

// ========================================
// REGISTER USER
// ========================================

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = passwordInput.value;
        const accountType = document.getElementById("accountType").value;
        const terms = document.getElementById("terms");

        const submitButton = signupForm.querySelector(
            'button[type="submit"]'
        );

        // Preserve the original button text and arrow
        const buttonLabel = submitButton?.querySelector("span:first-child");
        const originalButtonText = buttonLabel?.textContent || "Create Account";

        showMessage("", "");

        // Validate form
        if (!firstName || !lastName) {
            showMessage("Please enter your first and last name.", "error");
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            showMessage(
                "Username must be 3-30 characters and contain only letters, numbers, or underscores.",
                "error"
            );
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            showMessage(
                "Password must contain between 8 and 128 characters.",
                "error"
            );
            return;
        }

        if (!terms || !terms.checked) {
            showMessage(
                "Please agree to the Terms of Service and Privacy Policy.",
                "error"
            );
            return;
        }

        if (!["individual", "business"].includes(accountType)) {
            showMessage("Please select a valid account type.", "error");
            return;
        }

        // Prepare registration data
        const userData = {
            firstName,
            lastName,
            username,
            email,
            password,
            accountType
        };

        try {
            // Disable button during registration
            if (submitButton) {
                submitButton.disabled = true;

                if (buttonLabel) {
                    buttonLabel.textContent = "Creating account...";
                }
            }

            showMessage("Creating your BusinessGrowth account...", "success");

            // Send registration request to backend
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const responseText = await response.text();
            let result = null;

            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                // Hosting platforms can return plain-text or HTML error pages
                // when an API route is missing. Keep that response from
                // surfacing as a confusing JSON parse error to the user.
                console.error("Signup endpoint returned a non-JSON response:", {
                    status: response.status,
                    contentType: response.headers.get("content-type")
                });
            }

            if (!result || typeof result !== "object") {
                if (response.status === 404) {
                    throw new Error(
                        "The signup service could not be reached. Please try again later."
                    );
                }

                if (response.status >= 500) {
                    throw new Error(
                        "The signup service is temporarily unavailable. Please try again later."
                    );
                }

                throw new Error(
                    "The signup service returned an unexpected response. Please try again later."
                );
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "Registration failed. Please try again."
                );
            }

            if (!result.success || !result.token || !result.user) {
                throw new Error("The server returned an incomplete response.");
            }

            // Save login session
            sessionStorage.setItem("businessGrowthToken", result.token);

            sessionStorage.setItem(
                "businessGrowthUser",
                JSON.stringify(result.user)
            );

            showMessage(
                `Welcome, ${result.user.firstName}! Your account has been created.`,
                "success"
            );

            // Redirect according to account type
            const onboardingPage =
                accountType === "individual"
                    ? "../onboarding/individual-onboarding.html"
                    : "../onboarding/business-onboarding.html";

            window.location.href = onboardingPage;

        } catch (error) {
            console.error("Signup error:", error);

            if (error instanceof TypeError) {
                showMessage(
                    "Cannot connect to BusinessGrowth. Check that your backend server is running.",
                    "error"
                );
            } else {
                showMessage(error.message, "error");
            }

        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                if (buttonLabel) {
                    buttonLabel.textContent = originalButtonText;
                }
            }
        }
    });
}
