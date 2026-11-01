/**
 * ONLINE AGENT URL — no trailing slash
 * Same-origin: use ""
 * Tunnel / Render: full URL e.g. "https://your-app.onrender.com"
 */
// const AGENT_API_BASE = "https://cold-insects-check.loca.lt";

const AGENT_API_BASE = "https://silent-ads-carry.loca.lt";

console.log("BusinessGrowth frontend loaded");

document.addEventListener("DOMContentLoaded", function () {
  document.documentElement.style.scrollBehavior = "smooth";

  const currentYear = document.getElementById("currentYear");
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Mobile nav
  const navToggle = document.getElementById("navToggle");
  const navLinksList = document.getElementById("navLinks");
  if (navToggle && navLinksList) {
    navToggle.addEventListener("click", function () {
      const open = navLinksList.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    });

    navLinksList.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinksList.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
        document.body.style.overflow = "";
      });
    });
  }

  // Contact form
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
        "Your message has been checked.";
      formNotice.style.color = "#f59e0b";
    });
  }

  // Active nav link highlighting
  const navLinks = document.querySelectorAll(".nav-links a:not(.nav-button)");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.forEach(function (navLink) {
        navLink.classList.remove("active");
      });
      link.classList.add("active");
    });
  });

  // Back to top
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Subtle press feedback on primary CTAs
  const actionLinks = document.querySelectorAll(
    ".hero-buttons a, .tools-footer a, .solutions-cta a, .about-content a, .footer-cta a"
  );
  actionLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      link.style.transition = "opacity 0.2s ease";
      link.style.opacity = "0.85";
      setTimeout(function () {
        link.style.opacity = "";
      }, 200);
    });
  });

  // Register service worker for PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function (err) {
      console.warn("Service worker registration failed:", err);
    });
  }
});

// ---- AI tool modal ----

const aiTools = [
  {
    name: "AI Business Assistant",
    icon: "bi-robot",
    description:
      "Get help with everyday business questions, solve problems, and discover smarter ways to work.",
    placeholder: "Ask a business question...",
    button: "Ask Assistant",
  },
  {
    name: "AI Content Creator",
    icon: "bi-pencil-square",
    description:
      "Create ideas for social media posts, advertisements, product descriptions, and other business content.",
    placeholder: "What content do you want to create?",
    button: "Create Content",
  },
  {
    name: "AI Business Insights",
    icon: "bi-graph-up-arrow",
    description:
      "Explore business performance questions and discover what information you need to make better decisions.",
    placeholder: "Describe your business goal...",
    button: "Explore Insights",
  },
  {
    name: "Workflow Automation",
    icon: "bi-arrow-repeat",
    description:
      "Identify repetitive tasks in your business that could be simplified or automated.",
    placeholder: "Which task do you want to automate?",
    button: "Explore Automation",
  },
  {
    name: "AI Marketing Assistant",
    icon: "bi-megaphone",
    description:
      "Explore marketing ideas to reach more customers, promote your products, and grow your brand.",
    placeholder: "Describe your product or service...",
    button: "Get Marketing Ideas",
  },
  {
    name: "Business Growth Planner",
    icon: "bi-bullseye",
    description: "Turn your business goals into practical steps you can work towards.",
    placeholder: "What is your main business goal?",
    button: "Create a Plan",
  },
];

const toolModal = document.createElement("div");
toolModal.id = "businessGrowthToolModal";
toolModal.className = "bg-tool-modal";
toolModal.innerHTML = `
  <div class="bg-tool-modal-content" role="dialog" aria-modal="true" aria-labelledby="bgToolTitle">
    <button class="bg-tool-close" type="button" aria-label="Close popup">&times;</button>
    <div class="bg-tool-icon"><i class="bi bi-robot" aria-hidden="true"></i></div>
    <span class="bg-tool-label">BUSINESSGROWTH AI</span>
    <h2 class="bg-tool-title" id="bgToolTitle">AI Tool</h2>
    <p class="bg-tool-description"></p>
    <form class="bg-tool-form">
      <label for="bgToolInput">What would you like help with?</label>
      <textarea id="bgToolInput" placeholder="Enter your request..." required maxlength="2000"></textarea>
      <button type="submit" class="bg-tool-submit">Get AI Response</button>
    </form>
    <div class="bg-tool-result" aria-live="polite" hidden></div>
  </div>
`;
document.body.appendChild(toolModal);

const toolTitle = toolModal.querySelector(".bg-tool-title");
const toolIcon = toolModal.querySelector(".bg-tool-icon i");
const toolDescription = toolModal.querySelector(".bg-tool-description");
const toolInput = toolModal.querySelector("#bgToolInput");
const toolForm = toolModal.querySelector(".bg-tool-form");
const toolSubmit = toolModal.querySelector(".bg-tool-submit");
const toolResult = toolModal.querySelector(".bg-tool-result");
const toolClose = toolModal.querySelector(".bg-tool-close");

function closeToolModal() {
  toolModal.classList.remove("show");
  document.body.style.overflow = "";
}

document.addEventListener("click", function (event) {
  const exploreLink = event.target.closest(".tool-link");
  if (!exploreLink) return;
  event.preventDefault();

  const toolCard = exploreLink.closest(".tool-card");
  if (!toolCard) return;

  const toolCards = Array.from(document.querySelectorAll("#tools .tool-card"));
  const cardIndex = toolCards.indexOf(toolCard);
  if (cardIndex === -1 || cardIndex >= aiTools.length) return;

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

toolClose.addEventListener("click", closeToolModal);
toolModal.addEventListener("click", function (event) {
  if (event.target === toolModal) closeToolModal();
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && toolModal.classList.contains("show")) {
    closeToolModal();
  }
});

toolForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const userRequest = toolInput.value.trim();
  if (!userRequest) {
    toolInput.focus();
    return;
  }

  const toolName = toolTitle.textContent;
  toolSubmit.disabled = true;
  const originalLabel = toolSubmit.textContent;
  toolSubmit.textContent = "Thinking…";
  toolResult.hidden = false;
  toolResult.textContent = "Connecting to BusinessGrowth AI…";

  try {
    const endpoint = (AGENT_API_BASE || "").replace(/\/$/, "") + "/api/agent/run";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
      },
      body: JSON.stringify({ toolName: toolName, request: userRequest }),
    });
    if (!res.ok) throw new Error("Agent HTTP " + res.status);
    const data = await res.json();
    if (!data.reply) throw new Error(data.error || "Empty reply");

    const source =
      data.method === "model"
        ? "Powered by " + (data.model || "AI model")
        : "BusinessGrowth AI";
    toolResult.textContent = source + "\n\n" + data.reply;
  } catch (err) {
    console.warn("Agent API error", err);
    toolResult.textContent =
      "Could not reach the AI agent.\n\n" +
      "Check that AGENT_API_BASE is correct and the server is online.\n" +
      "Error: " +
      (err.message || String(err));
  } finally {
    toolSubmit.disabled = false;
    toolSubmit.textContent = originalLabel;
    toolResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});