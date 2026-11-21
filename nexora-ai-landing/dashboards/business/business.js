"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const ZEN_API_URL = window.BusinessGrowthAPI.zen;
    const API_URL = `${window.BusinessGrowthAPI.core}/auth`;
    const token = sessionStorage.getItem("businessGrowthToken");
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

    // ZEN chat widget for the business dashboard.
    const zenWidget = $("#zenWidget");
    const zenOrb = $("#zenOrb");
    const zenPanel = $("#zenWidgetPanel");
    const zenMessages = $("#zenMessages");
    const zenForm = $("#zenChatForm");
    const zenInput = $("#zenMessageInput");
    const zenSend = $("#zenSendButton");
    const zenConversationList = $("#zenConversationList");
    let currentZenConversationId = null;

    function setZenOpen(open) {
        if (!zenPanel || !zenOrb) return;
        zenPanel.hidden = !open;
        zenOrb.setAttribute("aria-expanded", String(open));
        zenOrb.setAttribute("aria-label", open ? "Close chat with ZEN" : "Open chat with ZEN");
        if (open) zenInput?.focus();
    }

    function addZenMessage(role, content) {
        if (!zenMessages) return;
        zenMessages.querySelector(".zen-welcome")?.remove();
        const item = document.createElement("div");
        item.className = `zen-message ${role}`;
        const label = document.createElement("span");
        label.className = "zen-message-label";
        label.textContent = role === "user" ? "You" : "ZEN";
        const text = document.createElement("div");
        text.className = "zen-message-content";
        text.textContent = content;
        item.append(label, text);
        zenMessages.appendChild(item);
        zenMessages.scrollTop = zenMessages.scrollHeight;
    }

    async function loadZenConversations() {
        if (!zenConversationList) return;
        if (!token) {
            zenConversationList.textContent = "Sign in to view your conversations.";
            return;
        }
        zenConversationList.textContent = "Loading conversations...";
        try {
            const response = await fetch(`${ZEN_API_URL}/conversations`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to load conversations.");
            zenConversationList.replaceChildren();
            if (!result.conversations?.length) {
                const empty = document.createElement("p");
                empty.textContent = "No conversations yet.";
                zenConversationList.appendChild(empty);
                return;
            }
            result.conversations.forEach((conversation) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "zen-conversation-item";
                button.textContent = conversation.title || "New conversation";
                button.addEventListener("click", async () => {
                    try {
                        const itemResponse = await fetch(`${ZEN_API_URL}/conversations/${conversation._id}`, { headers: { Authorization: `Bearer ${token}` } });
                        const itemResult = await itemResponse.json();
                        if (!itemResponse.ok || !itemResult.success) throw new Error(itemResult.message || "Unable to open conversation.");
                        currentZenConversationId = conversation._id;
                        zenMessages.replaceChildren();
                        (itemResult.conversation.messages || []).forEach((message) => addZenMessage(message.role, message.content));
                        if (!itemResult.conversation.messages?.length) zenMessages.innerHTML = '<div class="zen-welcome"><i class="bi bi-stars"></i><h3>Hello! I\'m ZEN.</h3><p>What would you like help with today?</p></div>';
                    } catch (error) { showToast(error.message); }
                });
                zenConversationList.appendChild(button);
            });
        } catch (error) {
            console.error("ZEN conversation load failed:", error);
            zenConversationList.textContent = "Unable to load conversations. Check that ZEN is running on port 5000.";
        }
    }

    zenOrb?.addEventListener("click", () => {
        setZenOpen(zenPanel?.hidden ?? true);
        if (zenPanel && !zenPanel.hidden) loadZenConversations();
    });
    $("#closeZenChat")?.addEventListener("click", () => setZenOpen(false));
    $("#newZenChat")?.addEventListener("click", () => {
        currentZenConversationId = null;
        if (zenMessages) zenMessages.innerHTML = '<div class="zen-welcome"><i class="bi bi-stars"></i><h3>Hello! I\'m ZEN.</h3><p>What would you like help with today?</p></div>';
        zenInput?.focus();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && zenPanel && !zenPanel.hidden) setZenOpen(false);
    });

    zenForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = zenInput?.value.trim();
        if (!message) return;
        if (!token) { addZenMessage("assistant", "Please sign in again to chat with ZEN."); return; }
        addZenMessage("user", message);
        zenInput.value = "";
        if (zenSend) zenSend.disabled = true;
        const typing = document.createElement("div");
        typing.className = "zen-message assistant";
        typing.textContent = "ZEN is thinking...";
        zenMessages?.appendChild(typing);
        try {
            const response = await fetch(`${ZEN_API_URL}/chat`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ message, conversationId: currentZenConversationId, persona: window.ZenPreferences?.getPersona?.() || "neutral" }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "ZEN could not respond.");
            currentZenConversationId = result.conversationId;
            typing.remove();
            addZenMessage("assistant", result.reply);
            window.dispatchEvent(new Event("ai-usage-updated"));
            await loadZenConversations();
        } catch (error) {
            typing.remove();
            addZenMessage("assistant", error.message || "ZEN could not respond. Check that the ZEN server and AI model are configured.");
        } finally {
            if (zenSend) zenSend.disabled = false;
            zenInput?.focus();
        }
    });

    loadZenConversations();

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
        if (greetingText) {
            greetingText.textContent = greeting;
        }

    }

    function renderBusinessOwner(user) {
        if (!user) return;
        const firstName = (user.firstName || "").trim();
        const lastName = (user.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim() || user.username || "Business Owner";
        const nameForGreeting = firstName || fullName;
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || fullName.slice(0, 2).toUpperCase();

        const profileName = $("#profileName");
        const profileRole = $("#profileRole");
        const profileAvatar = $("#profileAvatar");
        const sidebarAccountName = $("#sidebarAccountName");
        const sidebarAccountRole = $("#sidebarAccountRole");
        const sidebarAccountAvatar = $("#sidebarAccountAvatar");
        const profileMenuName = $("#profileMenuName");
        const profileMenuEmail = $("#profileMenuEmail");
        const sidebarMenuName = $("#sidebarMenuName");
        const sidebarMenuEmail = $("#sidebarMenuEmail");
        const greetingName = $("#greetingName");
        const welcomeName = $("#welcomeName");

        if (profileName) profileName.textContent = fullName;
        if (profileRole) profileRole.textContent = user.accountType === "business" ? "Business Owner" : "Account Owner";
        if (profileAvatar) profileAvatar.textContent = initials;
        if (sidebarAccountName) sidebarAccountName.textContent = fullName;
        if (sidebarAccountRole) sidebarAccountRole.textContent = user.accountType === "business" ? "Business Owner" : "Account Owner";
        if (sidebarAccountAvatar) sidebarAccountAvatar.textContent = initials;
        if (profileMenuName) profileMenuName.textContent = fullName;
        if (profileMenuEmail) profileMenuEmail.textContent = user.email || "";
        if (sidebarMenuName) sidebarMenuName.textContent = fullName;
        if (sidebarMenuEmail) sidebarMenuEmail.textContent = user.email || "";
        if (greetingName) greetingName.textContent = nameForGreeting;
        if (welcomeName) welcomeName.textContent = nameForGreeting;
    }

    async function loadBusinessOwner() {
        try {
            const savedUser = sessionStorage.getItem("businessGrowthUser");
            if (savedUser) renderBusinessOwner(JSON.parse(savedUser));
        } catch (error) {
            console.warn("Could not read saved profile information.", error);
        }

        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok || !result.success || !result.user) {
                throw new Error(result.message || "Could not load the signed-in profile.");
            }
            sessionStorage.setItem("businessGrowthUser", JSON.stringify(result.user));
            renderBusinessOwner(result.user);
        } catch (error) {
            console.warn("Business owner profile could not be refreshed.", error);
        }
    }

    updateGreeting();
    loadBusinessOwner();

    /* =========================================
       4. SIDEBAR AND NAVIGATION
    ========================================= */

    const sidebar = $("#sidebar");
    const menuToggle = $("#menuToggle");

    const navLinks = $$(".sidebar-nav [data-section]");
    const settingsSection = $("#settings");
    const aiAgentPlansSection = $("#ai-agent-plans");
    const integrationsSection = $("#integrations");
    const marketingSection = $("#marketing-studio");

    const sectionTargets = {
        "Dashboard": null,
        "Deals": "deals",
        "Tasks": "tasks",
        "Settings": "settings",
        "AI Plans": "ai-agent-plans",
        "Integrations": "integrations",
        "Marketing Studio": "marketing-studio"
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

        if (settingsSection) {
            settingsSection.hidden = sectionName !== "Settings";
        }
        if (aiAgentPlansSection) {
            aiAgentPlansSection.hidden = sectionName !== "AI Plans";
        }
        if (integrationsSection) {
            integrationsSection.hidden = sectionName !== "Integrations";
        }
        if (marketingSection) {
            marketingSection.hidden = sectionName !== "Marketing Studio";
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

            if (link.classList.contains("nav-expand")) {
                event.preventDefault();
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

            const href = link.getAttribute("href");
            if (href && !href.startsWith("#")) {
                if (window.innerWidth <= 768) closeSidebar();
                return;
            }

            event.preventDefault();
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
    const sidebarAccountToggle = $("#sidebarAccountToggle");
    const sidebarAccountMenu = $("#sidebarAccountMenu");

    function closeSidebarAccount() {
        if (sidebarAccountMenu) sidebarAccountMenu.hidden = true;
        if (sidebarAccountToggle) sidebarAccountToggle.setAttribute("aria-expanded", "false");
    }

    if (sidebarAccountToggle && sidebarAccountMenu) {
        sidebarAccountToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const shouldOpen = sidebarAccountMenu.hidden;
            closeNotifications();
            closeProfile();
            sidebarAccountMenu.hidden = !shouldOpen;
            sidebarAccountToggle.setAttribute("aria-expanded", String(shouldOpen));
        });
        sidebarAccountMenu.addEventListener("click", function (event) { event.stopPropagation(); });
        sidebarAccountMenu.querySelector("[data-sidebar-settings]")?.addEventListener("click", function (event) {
            event.preventDefault();
            showDashboardSection("Settings");
            closeSidebarAccount();
        });
    }

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

        profilePopover.querySelectorAll("[data-section]").forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                showDashboardSection(link.dataset.section);
                closeProfile();
            });
        });
    }

    $$('[data-action="signout"]').forEach(button => {
        button.addEventListener("click", () => {
            sessionStorage.removeItem("businessGrowthToken");
            sessionStorage.removeItem("businessGrowthUser");
            window.location.href = "../../auth/login.html";
        });
    });

    document.addEventListener("click", function () {
        closeNotifications();
        closeProfile();
        closeSidebarAccount();
    });

    /* =========================================
       8. GLOBAL SEARCH
    ========================================= */

    const globalSearch = $("#globalSearch");

    const searchableSections = [
        { terms: ["dashboard", "home"], name: "Dashboard" },
        { terms: ["customer", "customers", "clients"], name: "Customers", href: "pages/customer.html" },
        { terms: ["deal", "deals", "sales"], name: "Deals" },
        { terms: ["task", "tasks"], name: "Tasks" },
        { terms: ["setting", "settings", "preferences"], name: "Settings" }
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
                if (match.href) {
                    window.location.href = match.href;
                } else {
                    showDashboardSection(match.name);
                }
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
            closeSidebarAccount();

            if (globalSearch) {
                globalSearch.blur();
            }

            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        }
    });

    
/* =========================================
       17. RESPONSIVE RESIZE
    ========================================= */

    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    /* =========================================
       18. INITIALIZE DASHBOARD
    ========================================= */

    console.log(
        "BusinessGrowth dashboard initialized successfully."
    );
});
