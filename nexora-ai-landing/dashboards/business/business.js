"use strict";

document.addEventListener("DOMContentLoaded", function () {
    /* =========================================
       1. HELPER FUNCTIONS
    ========================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    function showToast(message) {
        let toast = $("#dashboardToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "dashboardToast";
            toast.className = "dashboard-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toast.hideTimer);

        toast.hideTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    window.showDashboardToast = showToast;

    function safelyStore(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Continue without persistent storage.
        }
    }

    function safelyRead(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    /* =========================================
       2. CURRENT DATE
    ========================================= */

    const todayDate = $("#todayDate");

    if (todayDate) {
        todayDate.textContent = new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    /* =========================================
       3. PERSONALIZED GREETING
    ========================================= */

    function updateGreeting() {
        const hour = new Date().getHours();

        let greeting = "Good evening";

        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 17) {
            greeting = "Good afternoon";
        }

        const greetingText = $("#greetingText");
        const greetingName = $("#greetingName");
        const welcomeName = $("#welcomeName");

        if (greetingText) {
            greetingText.textContent = greeting;
        }

        let displayName = safelyRead("businessGrowthDisplayName", "");

        if (!displayName) {
            displayName = safelyRead("displayName", "");
        }

        displayName = displayName.trim();

        if (greetingName) {
            greetingName.textContent = displayName || "there";
        }

        if (welcomeName) {
            welcomeName.textContent = displayName || "there";
        }
    }

    updateGreeting();

    /* =========================================
       4. SIDEBAR AND NAVIGATION
    ========================================= */

    const sidebar = $("#sidebar");
    const menuToggle = $("#menuToggle");

    const navLinks = $$(".side-nav [data-section]");

    const sectionTargets = {
        "Dashboard": null,
        "AI Tools": "ai-tools",
        "CRM": "crm",
        "Customers": "customers",
        "Deals": "deals",
        "Company": "company",
        "Team & Roles": "team",
        "Integrations": "integrations",
        "Business Management": "business-management",
        "Projects": "projects",
        "Tasks": "tasks",
        "Calendar": "calendar",
        "Reports": "reports",
        "Settings": "settings",
        "Help & Support": "help-support",
        "My Profile": "profile"
    };

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }
    }

    function showDashboardSection(sectionName) {
        if (!(sectionName in sectionTargets)) {
            showToast("Section not found.");
            return;
        }

        navLinks.forEach(function (link) {
            link.classList.toggle(
                "active",
                link.dataset.section === sectionName
            );
        });

        if (sectionName === "Dashboard") {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } else {
            const targetId = sectionTargets[sectionName];
            const target = targetId
                ? document.getElementById(targetId)
                : null;

            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            } else {
                showToast(
                    sectionName +
                    " section is not available on this page yet."
                );
            }
        }

        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    }

    window.showDashboardSection = showDashboardSection;

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const sectionName = link.dataset.section;

            if (!sectionName) {
                return;
            }

            event.preventDefault();

            if (link.classList.contains("nav-expand")) {
                const submenu = link.nextElementSibling;

                if (submenu && submenu.classList.contains("sub-nav")) {
                    const expanded =
                        link.getAttribute("aria-expanded") === "true";

                    link.setAttribute(
                        "aria-expanded",
                        String(!expanded)
                    );

                    submenu.hidden = expanded;
                    submenu.classList.toggle("open", !expanded);
                }

                return;
            }

            showDashboardSection(sectionName);
        });
    });

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function () {
            const isOpen = sidebar.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    /* =========================================
       5. DARK AND LIGHT MODE
    ========================================= */

    const themeToggle = $("#themeToggle");
    const themeIcon = themeToggle
        ? $("i", themeToggle)
        : null;

    function applyTheme(theme) {
        if (theme !== "light" && theme !== "dark") {
            theme = "dark";
        }

        const isLight = theme === "light";

        document.body.classList.toggle("light-mode", isLight);
        document.body.classList.toggle("dark-mode", !isLight);

        if (themeIcon) {
            themeIcon.className = isLight
                ? "bi bi-moon-stars"
                : "bi bi-sun";
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                isLight ? "Switch to dark mode" : "Switch to light mode"
            );

            themeToggle.setAttribute(
                "title",
                isLight ? "Switch to dark mode" : "Switch to light mode"
            );
        }

        try {
            localStorage.setItem("businessGrowthTheme", theme);
        } catch (error) {
            // Theme still works for the current session.
        }
    }

    let savedTheme = "dark";

    try {
        savedTheme =
            localStorage.getItem("businessGrowthTheme") || "dark";
    } catch (error) {
        // Use dark mode by default.
    }

    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isLight =
                document.body.classList.contains("light-mode");

            applyTheme(isLight ? "dark" : "light");
        });
    }

    /* =========================================
       6. NOTIFICATIONS
    ========================================= */

    const notificationToggle = $("#notificationToggle");
    const notificationsPopover = $("#notificationsPopover");
    const markRead = $("#markRead");
    const notificationDot = $(".notification-dot");

    function closeNotifications() {
        if (notificationsPopover) {
            notificationsPopover.hidden = true;
        }

        if (notificationToggle) {
            notificationToggle.setAttribute("aria-expanded", "false");
        }
    }

    if (notificationToggle && notificationsPopover) {
        notificationToggle.addEventListener("click", function (event) {
            event.stopPropagation();

            const shouldOpen = notificationsPopover.hidden;

            closeProfile();

            notificationsPopover.hidden = !shouldOpen;

            notificationToggle.setAttribute(
                "aria-expanded",
                String(shouldOpen)
            );
        });

        notificationsPopover.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    if (markRead) {
        markRead.addEventListener("click", function () {
            $$(".notification-item").forEach(function (item) {
                item.classList.add("read");
            });

            if (notificationDot) {
                notificationDot.hidden = true;
            }

            closeNotifications();

            showToast("All notifications marked as read.");
        });
    }

    /* =========================================
       7. PROFILE DROPDOWN
    ========================================= */

    const profileToggle = $("#profileToggle");
    const profilePopover = $("#profilePopover");

    function closeProfile() {
        if (profilePopover) {
            profilePopover.hidden = true;
        }

        if (profileToggle) {
            profileToggle.setAttribute("aria-expanded", "false");
        }
    }

    if (profileToggle && profilePopover) {
        profileToggle.addEventListener("click", function (event) {
            event.stopPropagation();

            const shouldOpen = profilePopover.hidden;

            closeNotifications();

            profilePopover.hidden = !shouldOpen;

            profileToggle.setAttribute(
                "aria-expanded",
                String(shouldOpen)
            );
        });

        profilePopover.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }

    document.addEventListener("click", function () {
        closeNotifications();
        closeProfile();
    });

    /* =========================================
       8. GLOBAL SEARCH
    ========================================= */

    const globalSearch = $("#globalSearch");

    const searchableSections = [
        { terms: ["dashboard", "home"], name: "Dashboard" },
        { terms: ["ai tools", "assistant", "artificial intelligence"], name: "AI Tools" },
        { terms: ["crm"], name: "CRM" },
        { terms: ["customer", "customers", "clients"], name: "Customers" },
        { terms: ["deal", "deals", "sales"], name: "Deals" },
        { terms: ["company", "business information"], name: "Company" },
        { terms: ["team", "roles", "employees"], name: "Team & Roles" },
        { terms: ["integration", "integrations"], name: "Integrations" },
        { terms: ["business management"], name: "Business Management" },
        { terms: ["project", "projects"], name: "Projects" },
        { terms: ["task", "tasks"], name: "Tasks" },
        { terms: ["calendar", "meeting", "meetings"], name: "Calendar" },
        { terms: ["report", "reports", "analytics"], name: "Reports" },
        { terms: ["setting", "settings", "preferences"], name: "Settings" },
        { terms: ["help", "support"], name: "Help & Support" },
        { terms: ["profile", "account"], name: "My Profile" }
    ];

    if (globalSearch) {
        globalSearch.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") {
                return;
            }

            const query = globalSearch.value.trim().toLowerCase();

            if (!query) {
                return;
            }

            const match = searchableSections.find(function (section) {
                return section.terms.some(function (term) {
                    return term === query || term.startsWith(query);
                });
            });

            if (match) {
                event.preventDefault();
                showDashboardSection(match.name);
            } else {
                showToast("No matching dashboard section found.");
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();

            if (globalSearch) {
                globalSearch.focus();
            }
        }

        if (event.key === "Escape") {
            closeNotifications();
            closeProfile();

            if (globalSearch) {
                globalSearch.blur();
            }

            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        }
    });

    /* =========================================
       9. REVENUE DATA
    ========================================= */

    const revenueData = {
        7: {
            total: 12480,
            growth: 18.4,
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            values: [1200, 1800, 1500, 2200, 1700, 2400, 1680]
        },

        30: {
            total: 48650,
            growth: 22.6,
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            values: [9500, 11200, 12450, 15500]
        },

        90: {
            total: 138900,
            growth: 31.2,
            labels: ["Month 1", "Month 2", "Month 3"],
            values: [38500, 45200, 55200]
        }
    };

    window.revenueData = revenueData;

    /* =========================================
       10. REVENUE CHART
    ========================================= */

    const chartCanvas = $("#revenueChart");
    const chartRange = $("#chartRange");

    let revenueChart = null;

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function updateRevenueChart(range = "7") {
        const data = revenueData[range];

        if (!data) {
            return;
        }

        const totalElement = $("#totalRevenue");
        const growthElement = $("#revenueGrowth");

        if (totalElement) {
            totalElement.textContent = formatCurrency(data.total);
        }

        if (growthElement) {
            growthElement.textContent = "+" + data.growth + "%";
        }

        if (!chartCanvas || typeof Chart === "undefined") {
            return;
        }

        if (revenueChart) {
            revenueChart.destroy();
        }

        revenueChart = new Chart(chartCanvas, {
            type: "line",

            data: {
                labels: data.labels,

                datasets: [{
                    label: "Revenue",
                    data: data.values,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return "Revenue: " +
                                    formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: function (value) {
                                return "$" + Number(value).toLocaleString();
                            }
                        },

                        grid: {
                            color: "rgba(128, 128, 128, 0.12)"
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    if (chartRange) {
        chartRange.addEventListener("change", function () {
            updateRevenueChart(chartRange.value);
        });
    }

    updateRevenueChart(chartRange ? chartRange.value : "7");

    /* =========================================
       11. QUICK ACTIONS
    ========================================= */

    const quickActionsData = [
        {
            title: "AI Tools",
            description: "Generate content, ideas and more",
            icon: "bi-stars",
            color: "quick-purple",
            action: "ai-tools"
        },
        {
            title: "Add Customer",
            description: "Grow your client base",
            icon: "bi-person-add",
            color: "quick-blue",
            action: "add-customer"
        },
        {
            title: "Create Deal",
            description: "Track and close more deals",
            icon: "bi-plus-lg",
            color: "quick-green",
            action: "create-deal"
        },
        {
            title: "Schedule Meeting",
            description: "Keep your team aligned",
            icon: "bi-calendar-event",
            color: "quick-orange",
            action: "schedule-meeting"
        },
        {
            title: "View Reports",
            description: "Check your performance",
            icon: "bi-file-earmark-bar-graph",
            color: "quick-indigo",
            action: "view-reports"
        }
    ];

    window.quickActionsData = quickActionsData;

    /* =========================================
       12. ACTIVITY FEED
    ========================================= */

    const activityData = [
        {
            title: "Customer registered",
            description: "A new customer joined your business.",
            icon: "bi-person-plus-fill",
            color: "blue",
            time: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
            title: "Deal updated",
            description: "A deal's status was updated.",
            icon: "bi-graph-up-arrow",
            color: "green",
            time: new Date(Date.now() - 3 * 60 * 60 * 1000)
        },
        {
            title: "Task completed",
            description: "A task was marked as completed.",
            icon: "bi-check2-circle",
            color: "teal",
            time: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
    ];

    window.activityData = activityData;

    function formatRelativeTime(date) {
        const seconds = Math.floor(
            (Date.now() - date.getTime()) / 1000
        );

        if (seconds < 60) {
            return "Just now";
        }

        if (seconds < 3600) {
            return Math.floor(seconds / 60) + " minutes ago";
        }

        if (seconds < 86400) {
            return Math.floor(seconds / 3600) + " hours ago";
        }

        return date.toLocaleDateString();
    }

    function renderActivity() {
        const activityList = $("#activityList");

        if (!activityList) {
            return;
        }

        activityList.replaceChildren();

        activityData.forEach(function (activity) {
            const item = document.createElement("div");
            item.className = "activity-item";

            const icon = document.createElement("i");
            icon.className = "bi " + activity.icon;
            icon.setAttribute("aria-hidden", "true");

            const content = document.createElement("div");
            content.className = "activity-content";

            const title = document.createElement("h4");
            title.textContent = activity.title;

            const description = document.createElement("p");
            description.textContent = activity.description;

            const time = document.createElement("small");
            time.textContent = formatRelativeTime(activity.time);

            content.append(title, description, time);
            item.append(icon, content);

            activityList.appendChild(item);
        });
    }

    renderActivity();

    /* =========================================
       13. DEALS
    ========================================= */

    const dealsData = [];

    window.dealsData = dealsData;

    const dealList = $("#dealList");
    const viewAllDeals = $("#viewAllDeals");

    function formatDealAmount(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
    }

    function formatDealDate(dateString) {
        if (!dateString) {
            return "Date unavailable";
        }

        const date = new Date(dateString + "T12:00:00");

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function renderDeals() {
        if (!dealList) {
            return;
        }

        dealList.replaceChildren();

        if (dealsData.length === 0) {
            const emptyMessage = document.createElement("p");

            emptyMessage.className = "empty-state";
            emptyMessage.textContent =
                "No deals yet. Your deals will appear here.";

            dealList.appendChild(emptyMessage);
            return;
        }

        dealsData.forEach(function (deal) {
            const item = document.createElement("div");
            item.className = "deal-item";

            const details = document.createElement("div");
            details.className = "deal-details";

            const title = document.createElement("h4");
            title.textContent = deal.name;

            const customer = document.createElement("p");
            customer.textContent =
                deal.customer || "No customer assigned";

            const date = document.createElement("small");
            date.textContent = formatDealDate(deal.date);

            const amount = document.createElement("strong");
            amount.textContent = formatDealAmount(deal.amount);

            const status = document.createElement("span");
            status.className = "deal-status";
            status.textContent = deal.status || "Pending";

            details.append(title, customer, date);
            item.append(details, amount, status);

            dealList.appendChild(item);
        });
    }

    window.addDashboardDeal = function (deal) {
        if (!deal || !deal.name) {
            showToast("Please provide a deal name.");
            return;
        }

        dealsData.unshift({
            name: String(deal.name),
            customer: String(deal.customer || ""),
            amount: Number(deal.amount) || 0,
            date:
                deal.date ||
                new Date().toISOString().slice(0, 10),
            status: String(deal.status || "Pending")
        });

        renderDeals();

        showToast("Deal added successfully.");
    };

    renderDeals();

    if (viewAllDeals) {
        viewAllDeals.addEventListener("click", function (event) {
            event.preventDefault();

            const dealsSection = $("#deals");

            if (dealsSection) {
                dealsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            } else {
                showToast(
                    "The Deals section could not be found."
                );
            }
        });
    }

    /* =========================================
       14. TASKS
    ========================================= */

    const tasksData = [];

    window.tasksData = tasksData;

    /* =========================================
       15. QUICK ACTION BUTTONS
    ========================================= */

    $$("[data-action]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            const action = button.dataset.action;

            if (action === "ai-tools") {
                const aiSection = $("#ai-tools");

                if (aiSection) {
                    event.preventDefault();

                    aiSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    const assistantInput = $("#assistantInput");

                    if (assistantInput) {
                        setTimeout(function () {
                            assistantInput.focus();
                        }, 400);
                    }
                }

                return;
            }

            if (action === "view-deals") {
                const dealsSection = $("#deals");

                if (dealsSection) {
                    event.preventDefault();

                    dealsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

                return;
            }

            const messages = {
                "add-customer":
                    "Customer registration is not connected yet.",

                "create-deal":
                    "Use the deal form to add a deal.",

                "schedule-meeting":
                    "Meeting scheduling is not connected yet.",

                "view-reports":
                    "Reports are not connected yet."
            };

            if (messages[action]) {
                event.preventDefault();
                showToast(messages[action]);
            }
        });
    });

    /* =========================================
       16. AI ASSISTANT DEMO
    ========================================= */

    const assistantForm = $("#assistantForm");
    const assistantInput = $("#assistantInput");
    const assistantChat = $("#assistantChat");
    const assistantStatus = $("#assistantStatus");

    function addAssistantMessage(message, sender) {
        if (!assistantChat) {
            return null;
        }

        const bubble = document.createElement("div");

        bubble.className =
            sender === "user"
                ? "user-bubble"
                : "assistant-bubble";

        bubble.textContent = message;

        assistantChat.appendChild(bubble);

        assistantChat.scrollTop =
            assistantChat.scrollHeight;

        return bubble;
    }

    function sendAssistantMessage(message) {
        const cleanMessage = message.trim();

        if (!cleanMessage || !assistantChat) {
            return;
        }

        addAssistantMessage(cleanMessage, "user");

        if (assistantInput) {
            assistantInput.value = "";
        }

        const suggestionList =
            $(".suggestion-list", assistantChat);

        if (suggestionList) {
            suggestionList.remove();
        }

        addAssistantMessage(
            "Thanks for your message! The BusinessGrowth AI " +
            "backend has not been connected yet. This is demo " +
            "mode. Once an AI backend is configured, the assistant " +
            "can help with business questions, content generation " +
            "and analysis.",
            "assistant"
        );

        if (assistantStatus) {
            assistantStatus.textContent =
                "Demo mode · Live AI responses are not connected.";
        }
    }

    if (assistantForm && assistantInput) {
        assistantForm.addEventListener(
            "submit",
            function (event) {
                event.preventDefault();

                sendAssistantMessage(
                    assistantInput.value
                );
            }
        );
    }

    $$(".suggestion-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            if (!assistantInput || !assistantForm) {
                return;
            }

            assistantInput.value =
                button.textContent.trim();

            assistantForm.requestSubmit();
        });
    });

    /* =========================================
       17. RESPONSIVE RESIZE
    ========================================= */

    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            closeSidebar();
        }

        if (revenueChart) {
            revenueChart.resize();
        }
    });

    /* =========================================
       18. INITIALIZE DASHBOARD
    ========================================= */

    console.log(
        "BusinessGrowth dashboard initialized successfully."
    );
});