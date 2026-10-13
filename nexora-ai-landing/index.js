// ========================================
// BUSINESSGROWTH - LANDING PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", function () {

// 1. SMOOTH SCROLLING
document.documentElement.style.scrollBehavior = "smooth";


// 2. AUTOMATIC COPYRIGHT YEAR
const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


// 3. CONTACT FORM VALIDATION
const contactForm = document.getElementById("contactForm");
const formNotice = document.getElementById("formNotice");

if (contactForm && formNotice) {

    contactForm.addEventListener("submit", function (event) {

        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        formNotice.textContent =
            "Your message has been checked, but the form is not connected to a message service yet.";

        formNotice.style.color = "#f59e0b";

    });

}


// 4. NAVIGATION ACTIVE STATE
const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        navLinks.forEach(function (navLink) {
            navLink.classList.remove("active");
        });

        link.classList.add("active");

    });

});


// 5. BACK TO TOP
const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

    backToTop.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

}


// 6. BUTTON CLICK FEEDBACK
const actionLinks = document.querySelectorAll(
    ".hero-buttons a, .tools-footer a, .solutions-cta a, .about-content a, .footer-cta a"
);

actionLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        // Let the existing HTML link handle navigation.
        // No duplicate action is needed here.

        link.style.transition = "opacity 0.2s ease";
        link.style.opacity = "0.85";

        setTimeout(function () {
            link.style.opacity = "";
        }, 200);

    });

});

});