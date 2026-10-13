console.log("javascript Loaded")

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


// alert("JavaScript is Working")

// ========================================
// 7. BUSINESSGROWTH AI TOOLS POPUP
// ========================================

const aiTools = [
    {
        name: "AI Business Assistant",
        icon: "bi-robot",
        description: "Get help with everyday business questions, solve problems, and discover smarter ways to work.",
        placeholder: "Ask a business question...",
        button: "Ask Assistant"
    },
    {
        name: "AI Content Creator",
        icon: "bi-pencil-square",
        description: "Create ideas for social media posts, advertisements, product descriptions, and other business content.",
        placeholder: "What content do you want to create?",
        button: "Create Content"
    },
    {
        name: "AI Business Insights",
        icon: "bi-graph-up-arrow",
        description: "Explore business performance questions and discover what information you need to make better decisions.",
        placeholder: "Describe your business goal...",
        button: "Explore Insights"
    },
    {
        name: "Workflow Automation",
        icon: "bi-arrow-repeat",
        description: "Identify repetitive tasks in your business that could be simplified or automated.",
        placeholder: "Which task do you want to automate?",
        button: "Explore Automation"
    },
    {
        name: "AI Marketing Assistant",
        icon: "bi-megaphone",
        description: "Explore marketing ideas to reach more customers, promote your products, and grow your brand.",
        placeholder: "Describe your product or service...",
        button: "Get Marketing Ideas"
    },
    {
        name: "Business Growth Planner",
        icon: "bi-bullseye",
        description: "Turn your business goals into practical steps you can work towards.",
        placeholder: "What is your main business goal?",
        button: "Create a Plan"
    }
];


// Create the popup automatically
const toolModal = document.createElement("div");

toolModal.id = "businessGrowthToolModal";
toolModal.className = "bg-tool-modal";

toolModal.innerHTML = `
    <div class="bg-tool-modal-content">

        <button class="bg-tool-close" aria-label="Close popup">
            &times;
        </button>

        <div class="bg-tool-icon">
            <i class="bi bi-robot"></i>
        </div>

        <span class="bg-tool-label">BUSINESSGROWTH AI</span>

        <h2 class="bg-tool-title">AI Tool</h2>

        <p class="bg-tool-description"></p>

        <form class="bg-tool-form">

            <label for="bgToolInput">
                What would you like help with?
            </label>

            <textarea
                id="bgToolInput"
                placeholder="Enter your request..."
                required
                maxlength="500"
            ></textarea>

            <button type="submit" class="bg-tool-submit">
                Try Demo
            </button>

        </form>

        <div class="bg-tool-result" aria-live="polite" hidden></div>

        <p class="bg-tool-note">
            This is a sample demonstration. Connect an AI service later
            to generate real AI-powered responses.
        </p>

    </div>
`;

document.body.appendChild(toolModal);


// Find the popup elements
const toolModalContent = toolModal.querySelector(
    ".bg-tool-modal-content"
);

const toolTitle = toolModal.querySelector(".bg-tool-title");
const toolIcon = toolModal.querySelector(".bg-tool-icon i");
const toolDescription = toolModal.querySelector(
    ".bg-tool-description"
);

const toolInput = toolModal.querySelector("#bgToolInput");
const toolForm = toolModal.querySelector(".bg-tool-form");
const toolSubmit = toolModal.querySelector(".bg-tool-submit");
const toolResult = toolModal.querySelector(".bg-tool-result");
const toolClose = toolModal.querySelector(".bg-tool-close");


// Open the correct popup when an Explore Tool link is clicked
// document.addEventListener("click", function (event) {

//     const exploreLink = event.target.closest("a");

//     if (!exploreLink) {
//         return;
//     }

//     const linkText = exploreLink.textContent
//         .replace(/\s+/g, " ")
//         .trim()
//         .toLowerCase();

//     if (linkText !== "explore tool") {
//         return;
//     }

//     const toolCards = document.querySelectorAll(
//         "#tools .tool-card, #tools .ai-tool-card, #tools .feature-card"
//     );

//     let cardIndex = -1;

//     toolCards.forEach(function (card, index) {
//         if (card.contains(exploreLink)) {
//             cardIndex = index;
//         }
//     });

//     // Fallback: use the order of the Explore Tool links
//     if (cardIndex === -1) {
//         const allExploreLinks = Array.from(
//             document.querySelectorAll("#tools a")
//         ).filter(function (link) {
//             return link.textContent
//                 .replace(/\s+/g, " ")
//                 .trim()
//                 .toLowerCase() === "explore tool";
//         });

//         cardIndex = allExploreLinks.indexOf(exploreLink);
//     }

//     if (cardIndex < 0 || cardIndex >= aiTools.length) {
//         return;
//     }

//     event.preventDefault();

//     const selectedTool = aiTools[cardIndex];

//     toolTitle.textContent = selectedTool.name;
//     toolIcon.className = "bi " + selectedTool.icon;

//     toolDescription.textContent = selectedTool.description;
//     toolInput.placeholder = selectedTool.placeholder;
//     toolSubmit.textContent = selectedTool.button;

//     toolInput.value = "";
//     toolResult.hidden = true;
//     toolResult.textContent = "";

//     toolModal.classList.add("show");
//     document.body.style.overflow = "hidden";

//     toolInput.focus();

// });

// Open the correct popup when an Explore Tool link is clicked
// document.addEventListener("click", function (event) {

//     const exploreLink = event.target.closest("a");

//     if (!exploreLink) return;

//     const linkText = exploreLink.textContent
//         .replace(/\s+/g, " ")
//         .trim()
//         .toLowerCase();

//     if (linkText !== "explore tool") return;

//     // Stop the browser from scrolling to the contact section
//     event.preventDefault();

//     const toolCards = document.querySelectorAll(
//         "#tools .tool-card, #tools .ai-tool-card, #tools .feature-card"
//     );

//     let cardIndex = -1;

//     toolCards.forEach(function (card, index) {
//         if (card.contains(exploreLink)) {
//             cardIndex = index;
//         }
//     });

//     if (cardIndex === -1) {
//         const allExploreLinks = Array.from(
//             document.querySelectorAll("#tools a")
//         ).filter(function (link) {
//             return link.textContent
//                 .replace(/\s+/g, " ")
//                 .trim()
//                 .toLowerCase() === "explore tool";
//         });

//         cardIndex = allExploreLinks.indexOf(exploreLink);
//     }

//     if (cardIndex < 0 || cardIndex >= aiTools.length) {
//         console.error("Could not identify the selected AI tool.");
//         return;
//     }

//     const selectedTool = aiTools[cardIndex];

//     toolTitle.textContent = selectedTool.name;
//     toolIcon.className = "bi " + selectedTool.icon;
//     toolDescription.textContent = selectedTool.description;
//     toolInput.placeholder = selectedTool.placeholder;
//     toolSubmit.textContent = selectedTool.button;

//     toolInput.value = "";
//     toolResult.hidden = true;
//     toolResult.textContent = "";

//     toolModal.classList.add("show");
//     document.body.style.overflow = "hidden";

//     toolInput.focus();

// });

// BUSINESSGROWTH AI TOOLS POPUP
document.addEventListener("click", function (event) {

    const exploreLink = event.target.closest(".tool-link");

    if (!exploreLink) {
        return;
    }

    event.preventDefault();

    const toolCard = exploreLink.closest(".tool-card");

    if (!toolCard) {
        console.error("AI tool card not found.");
        return;
    }

    const toolCards = Array.from(
        document.querySelectorAll("#tools .tool-card")
    );

    const cardIndex = toolCards.indexOf(toolCard);

    if (cardIndex === -1 || cardIndex >= aiTools.length) {
        console.error("Could not identify the selected AI tool.");
        return;
    }

    const selectedTool = aiTools[cardIndex];

    toolTitle.textContent = selectedTool.name;
    toolIcon.className = "bi " + selectedTool.icon;
    toolDescription.textContent = selectedTool.description;
    toolInput.placeholder = selectedTool.placeholder;
    toolSubmit.textContent = selectedTool.button;

    toolInput.value = "";
    toolResult.hidden = true;
    toolResult.textContent = "";

    toolModal.classList.add("show");
    document.body.style.overflow = "hidden";

    toolInput.focus();

});


// Close popup using the X button
toolClose.addEventListener("click", closeToolModal);


// Close popup by clicking outside it
toolModal.addEventListener("click", function (event) {

    if (event.target === toolModal) {
        closeToolModal();
    }

});


// Close popup using Escape
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape" &&
        toolModal.classList.contains("show")) {
        closeToolModal();
    }

});


function closeToolModal() {

    toolModal.classList.remove("show");
    document.body.style.overflow = "";

}


// Interactive sample demonstrations
toolForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const userRequest = toolInput.value.trim();

    if (!userRequest) {
        toolInput.focus();
        return;
    }

    const selectedToolIndex = aiTools.findIndex(function (tool) {
        return tool.name === toolTitle.textContent;
    });

    let response = "";

    switch (selectedToolIndex) {

        case 0:
            response =
                "BUSINESS ASSISTANT DEMO\n\n" +
                "You've asked: " + userRequest + "\n\n" +
                "Suggested next step: Break this problem into smaller tasks, " +
                "identify the most important priority, and decide what action " +
                "you can take first.";
            break;

        case 1:
            response =
                "CONTENT CREATOR DEMO\n\n" +
                "Content idea: Introduce your business and explain how it " +
                "helps customers.\n\n" +
                "Suggested caption: Looking for a smarter way to meet your " +
                "needs? Discover what our business can do for you!\n\n" +
                "Your topic: " + userRequest;
            break;

        case 2:
            response =
                "BUSINESS INSIGHTS DEMO\n\n" +
                "Goal: " + userRequest + "\n\n" +
                "Consider tracking your sales, customer feedback, expenses, " +
                "and customer retention. Comparing these figures over time " +
                "can help you identify areas that need attention.";
            break;

        case 3:
            response =
                "AUTOMATION DEMO\n\n" +
                "Task: " + userRequest + "\n\n" +
                "Possible approach: Identify the repeated steps, define " +
                "when the task should begin, and decide what should happen " +
                "automatically. Review the process before implementing it.";
            break;

        case 4:
            response =
                "MARKETING ASSISTANT DEMO\n\n" +
                "Business or product: " + userRequest + "\n\n" +
                "Marketing idea: Create a short promotional post showing " +
                "the problem your product solves, its main benefit, and " +
                "a clear invitation for customers to learn more.";
            break;

        case 5:
            response =
                "GROWTH PLANNER DEMO\n\n" +
                "Your goal: " + userRequest + "\n\n" +
                "Step 1: Define a measurable target.\n" +
                "Step 2: Choose three actions that support that target.\n" +
                "Step 3: Set deadlines for each action.\n" +
                "Step 4: Review your progress every week.";
            break;

        default:
            response = "Please select an AI tool and try again.";
    }

    toolResult.textContent = response;
    toolResult.hidden = false;

    toolResult.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

});