
document.addEventListener("DOMContentLoaded", () => {
    // =====================================
    // CONFIGURATION
    // =====================================

    const API_URL = `${window.BusinessGrowthAPI.core}/auth`;
    const ZEN_API_URL = window.BusinessGrowthAPI.zen;

    const token = sessionStorage.getItem("businessGrowthToken");

    let currentUser = null;

    // =====================================
    // SELECT ELEMENTS
    // =====================================

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const zenSettingsSection = document.getElementById("settings");
    const aiAgentPlansSection = document.getElementById("ai-agent-plans");
    const integrationsSection = document.getElementById("integrations");

    const themeToggle = document.getElementById("themeToggle");

    const notificationToggle =
        document.getElementById("notificationToggle");

    const notificationsPopover =
        document.getElementById("notificationsPopover");

    const notificationsList =
        document.getElementById("notificationsList");

    const notificationBadge =
        document.getElementById("notificationBadge");

    const markRead = document.getElementById("markRead");

    const profileToggle = document.getElementById("profileToggle");
    const profilePopover = document.getElementById("profilePopover");

    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profileAvatar = document.getElementById("profileAvatar");

    const greetingText = document.getElementById("greetingText");
    const greetingName = document.getElementById("greetingName");
    const welcomeName = document.getElementById("welcomeName");

    // PERSONALIZATION ELEMENTS
const personalRole = document.getElementById("personalRole");
const personalGoal = document.getElementById("personalGoal");
const personalExperience = document.getElementById("personalExperience");
const personalInterests = document.getElementById("personalInterests");

    const todayDate = document.getElementById("todayDate");

    const globalSearch = document.getElementById("globalSearch");

    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    // =====================================
// ZEN MEMORY CENTER ELEMENTS
// =====================================

const memoryList = document.getElementById("memoryList");
const memorySearch = document.getElementById("memorySearch");
const memoryForm = document.getElementById("memoryForm");
const memoryContent = document.getElementById("memoryContent");
const memoryCategory = document.getElementById("memoryCategory");
const memoryImportance = document.getElementById("memoryImportance");
const refreshMemories = document.getElementById("refreshMemories");

let savedMemories = [];


// =====================================
// ZEN CHAT ELEMENTS
// =====================================

const zenMessages = document.getElementById("zenMessages");
const zenConversationList = document.getElementById("zenConversationList");
const zenChatForm = document.getElementById("zenChatForm");
const zenMessageInput = document.getElementById("zenMessageInput");
const zenSendButton = document.getElementById("zenSendButton");
const newZenChat = document.getElementById("newZenChat");
const zenMemorySuggestion = document.getElementById("zenMemorySuggestion");
const zenWidgetPanel = document.getElementById("zenWidgetPanel");
const zenOrb = document.getElementById("zenOrb");

function setZenWidgetOpen(open) {
    if (!zenWidgetPanel || !zenOrb) return;
    zenWidgetPanel.hidden = !open;
    zenOrb.setAttribute("aria-expanded", String(open));
    zenOrb.setAttribute("aria-label", open ? "Close chat with ZEN" : "Open chat with ZEN");
    positionZenPanel();
    if (open) zenMessageInput?.focus();
}

function positionZenPanel() {
    const widget = document.getElementById("zenWidget");
    if (!widget || !zenOrb) return;
    const rect = zenOrb.getBoundingClientRect();
    const panelHeight = zenWidgetPanel && !zenWidgetPanel.hidden
        ? zenWidgetPanel.getBoundingClientRect().height
        : Math.min(650, window.innerHeight - 130);
    widget.classList.toggle("zen-widget--left", rect.left > window.innerWidth / 2);
    widget.classList.toggle("zen-widget--top", rect.top < panelHeight + 100);
}

function setupZenOrbDragging(widget, orb) {
    if (!widget || !orb) return;
    const storageKey = "businessGrowthZenOrbPosition";
    let drag = null;
    let moved = false;
    let suppressClick = false;

    const applyPosition = (left, top) => {
        const maxLeft = Math.max(8, window.innerWidth - orb.offsetWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - orb.offsetHeight - 8);
        const x = Math.max(8, Math.min(left, maxLeft));
        const y = Math.max(8, Math.min(top, maxTop));
        widget.classList.add("zen-widget--positioned");
        widget.style.left = `${x}px`;
        widget.style.top = `${y}px`;
        widget.style.right = "auto";
        widget.style.bottom = "auto";
        positionZenPanel();
        return { x, y };
    };

    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) applyPosition(saved.x, saved.y);
    } catch (error) { /* Ignore unavailable or invalid saved positions. */ }

    orb.title = "Drag to move · Click to open chat";
    orb.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;
        const rect = orb.getBoundingClientRect();
        drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top };
        moved = false;
        orb.setPointerCapture(event.pointerId);
    });
    orb.addEventListener("pointermove", event => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (!moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
        moved = true;
        event.preventDefault();
        applyPosition(drag.left + event.clientX - drag.startX, drag.top + event.clientY - drag.startY);
    });
    const finishDrag = event => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (moved) {
            const rect = orb.getBoundingClientRect();
            try { localStorage.setItem(storageKey, JSON.stringify({ x: rect.left, y: rect.top })); } catch (error) { /* Keep the moved position for this page view. */ }
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 0);
        }
        drag = null;
    };
    orb.addEventListener("pointerup", finishDrag);
    orb.addEventListener("pointercancel", finishDrag);
    orb.addEventListener("click", event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
    window.addEventListener("resize", () => {
        if (!widget.classList.contains("zen-widget--positioned")) return;
        const rect = orb.getBoundingClientRect();
        applyPosition(rect.left, rect.top);
        try { localStorage.setItem(storageKey, JSON.stringify({ x: rect.left, y: rect.top })); } catch (error) { /* Ignore unavailable storage. */ }
    });
}

let currentConversationId = null;
let zenConversations = [];

zenOrb?.addEventListener("click", () => {
    setZenWidgetOpen(zenWidgetPanel?.hidden ?? true);
});
document.getElementById("closeZenChat")?.addEventListener("click", () => setZenWidgetOpen(false));
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && zenWidgetPanel && !zenWidgetPanel.hidden) setZenWidgetOpen(false);
});


    // =====================================
    // TOAST MESSAGE
    // =====================================

    function showToast(message) {
        if (!toast || !toastMessage) {
            console.log(message);
            return;
        }

        toastMessage.textContent = message;
        toast.classList.add("show");

        clearTimeout(showToast.timeout);

        showToast.timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // =====================================
    // AUTHENTICATION
    // =====================================

    if (!token) {
    //    window.location.href = "/auth/login.html";
    window.location.href = "../../auth/login.html";
        return;
    }

    async function loadUser() {
        try {
            const response = await fetch(`${API_URL}/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Authentication failed.");
            }

            currentUser = result.user;

            sessionStorage.setItem(
                "businessGrowthUser",
                JSON.stringify(currentUser)
            );

            displayUser();
displayPersonalization();
personalizeAITools();

// Load ZEN memories after successful authentication
await loadMemories();
await loadConversations();

        } catch (error) {
            console.error("Authentication error:", error);

            sessionStorage.removeItem("businessGrowthToken");
            sessionStorage.removeItem("businessGrowthUser");

            showToast("Your session has expired. Please log in again.");

            setTimeout(() => {
                // window.location.href = "../../authentication/login.html";
                // window.location.href = "/auth/login.html";
                window.location.href = "../../auth/login.html";
            }, 1200);
        }
    }

    // =====================================
// ZEN MEMORY MANAGEMENT
// =====================================

async function loadMemories() {
    if (!memoryList) return;

    memoryList.textContent = "Loading your memories...";

    try {
        const response = await fetch(`${ZEN_API_URL}/memory`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not load memories.");
        }

        savedMemories = result.memories || [];

        renderMemories(savedMemories);

    } catch (error) {
        console.error("ZEN memory loading error:", error);

        memoryList.textContent =
            "Unable to load memories. Please check that the ZEN server is running.";
    }
}


// DISPLAY MEMORIES

function renderMemories(memories) {
    if (!memoryList) return;

    memoryList.replaceChildren();

    if (!memories.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "You don't have any saved memories yet.";

        memoryList.appendChild(emptyMessage);
        return;
    }

    memories.forEach(memory => {
        const card = document.createElement("div");
        card.className = "memory-card";

        const content = document.createElement("p");
        content.textContent = memory.content || "";

        const details = document.createElement("small");
        details.textContent =
            `Category: ${memory.category || "general"} | Importance: ${memory.importance ?? 5}/10`;

        const actions = document.createElement("div");
        actions.className = "memory-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "tool-launch";

        editButton.addEventListener("click", () => {
            editMemory(memory);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "tool-launch";

        deleteButton.addEventListener("click", () => {
            deleteMemory(memory._id);
        });

        actions.append(editButton, deleteButton);
        card.append(content, details, actions);

        memoryList.appendChild(card);
    });
}


// ADD A MEMORY

if (memoryForm) {
    memoryForm.addEventListener("submit", async event => {
        event.preventDefault();

        const content = memoryContent.value.trim();
        const category = memoryCategory.value;
        const importance = Number(memoryImportance.value);

        if (!content) {
            showToast("Please enter a memory.");
            return;
        }

        try {
            const response = await fetch(`${ZEN_API_URL}/memory`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content,
                    category,
                    importance
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Could not save memory.");
            }

            memoryForm.reset();
            memoryImportance.value = 5;

            showToast("Memory saved successfully.");

            await loadMemories();

        } catch (error) {
            console.error("Saving memory error:", error);
            showToast(error.message || "Unable to save memory.");
        }
    });
}


// SEARCH MEMORIES

if (memorySearch) {
    memorySearch.addEventListener("input", () => {
        const keyword = memorySearch.value.trim().toLowerCase();

        const filteredMemories = savedMemories.filter(memory => {
            return (
                (memory.content || "").toLowerCase().includes(keyword) ||
                (memory.category || "").toLowerCase().includes(keyword)
            );
        });

        renderMemories(filteredMemories);
    });
}


// EDIT A MEMORY

async function editMemory(memory) {
    const updatedContent = window.prompt(
        "Edit this memory:",
        memory.content
    );

    if (updatedContent === null) return;

    const content = updatedContent.trim();

    if (!content) {
        showToast("Memory cannot be empty.");
        return;
    }

    const updatedCategory = window.prompt(
        "Enter category (personal, preference, business, project, general):",
        memory.category || "general"
    );

    if (updatedCategory === null) return;

    const validCategories = [
        "personal",
        "preference",
        "business",
        "project",
        "general"
    ];

    const category = updatedCategory.trim().toLowerCase();

    if (!validCategories.includes(category)) {
        showToast("Please enter a valid memory category.");
        return;
    }

    const updatedImportance = window.prompt(
        "Enter importance from 1 to 10:",
        memory.importance ?? 5
    );

    if (updatedImportance === null) return;

    const importance = Number(updatedImportance);

    if (!Number.isInteger(importance) || importance < 1 || importance > 10) {
        showToast("Importance must be a number between 1 and 10.");
        return;
    }

    try {
        const response = await fetch(
            `${ZEN_API_URL}/memory/${memory._id}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content,
                    category,
                    importance
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not update memory.");
        }

        showToast("Memory updated successfully.");

        await loadMemories();

    } catch (error) {
        console.error("Updating memory error:", error);
        showToast(error.message || "Unable to update memory.");
    }
}


// DELETE A MEMORY

async function deleteMemory(memoryId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this memory?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${ZEN_API_URL}/memory/${memoryId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not delete memory.");
        }

        showToast("Memory deleted successfully.");

        await loadMemories();

    } catch (error) {
        console.error("Deleting memory error:", error);
        showToast(error.message || "Unable to delete memory.");
    }
}


// REFRESH MEMORIES

if (refreshMemories) {
    refreshMemories.addEventListener("click", loadMemories);
}


// =====================================
// ZEN CHAT FUNCTIONALITY
// =====================================

// Display a chat message
function addZenMessage(role, content) {
    if (!zenMessages) return;

    const welcome = zenMessages.querySelector(".zen-welcome");
    if (welcome) welcome.remove();

    const message = document.createElement("div");
    message.className = `zen-message ${role}`;

    const label = document.createElement("span");
    label.className = "zen-message-label";
    label.textContent = role === "user" ? "You" : "ZEN";

    const messageContent = document.createElement("div");
    messageContent.className = "zen-message-content";
    messageContent.textContent = content;

    message.append(label, messageContent);
    zenMessages.appendChild(message);

    zenMessages.scrollTop = zenMessages.scrollHeight;
}


// Load conversation history
async function loadConversations() {
    if (!zenConversationList) return;

    zenConversationList.textContent = "Loading conversations...";

    try {
        const response = await fetch(`${ZEN_API_URL}/conversations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not load conversations.");
        }

        zenConversations = result.conversations || [];
        renderZenConversations();

    } catch (error) {
        console.error("ZEN conversations error:", error);
        zenConversationList.textContent = "Unable to load conversations.";
    }
}


// Display conversation history
function renderZenConversations() {
    if (!zenConversationList) return;

    zenConversationList.replaceChildren();

    if (!zenConversations.length) {
        const empty = document.createElement("p");
        empty.textContent = "No conversations yet.";
        zenConversationList.appendChild(empty);
        return;
    }

    zenConversations.forEach(conversation => {
        const wrapper = document.createElement("div");
        wrapper.className = "zen-conversation-row";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "zen-conversation-item";
        openButton.textContent = conversation.title || "New conversation";

        if (conversation._id === currentConversationId) {
            openButton.classList.add("active");
        }

        openButton.addEventListener("click", () => {
            openZenConversation(conversation._id);
        });

        const renameButton = document.createElement("button");
        renameButton.type = "button";
        renameButton.textContent = "Rename";
        renameButton.className = "zen-history-action";

        renameButton.addEventListener("click", () => {
            renameZenConversation(conversation);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "zen-history-action";

        deleteButton.addEventListener("click", () => {
            deleteZenConversation(conversation._id);
        });

        wrapper.append(openButton, renameButton, deleteButton);
        zenConversationList.appendChild(wrapper);
    });
}


// Open an existing conversation
async function openZenConversation(conversationId) {
    try {
        const response = await fetch(
            `${ZEN_API_URL}/conversations/${conversationId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not open conversation.");
        }

        currentConversationId = conversationId;

        const conversation = result.conversation;

        if (zenMessages) {
            zenMessages.replaceChildren();

            (conversation.messages || []).forEach(message => {
                addZenMessage(message.role, message.content);
            });

            if (!conversation.messages?.length) {
                showZenWelcome();
            }
        }

        if (zenMemorySuggestion) {
            zenMemorySuggestion.hidden = true;
            zenMemorySuggestion.replaceChildren();
        }

        renderZenConversations();

    } catch (error) {
        console.error("Opening ZEN conversation error:", error);
        showToast(error.message || "Could not open conversation.");
    }
}


// Show the welcome message
function showZenWelcome() {
    if (!zenMessages) return;

    zenMessages.innerHTML = `
        <div class="zen-welcome">
            <i class="bi bi-stars"></i>
            <h3>Hello! I'm ZEN.</h3>
            <p>What would you like help with today?</p>
        </div>
    `;
}


// Start a new conversation
if (newZenChat) {
    newZenChat.addEventListener("click", () => {
        currentConversationId = null;

        showZenWelcome();

        if (zenMemorySuggestion) {
            zenMemorySuggestion.hidden = true;
            zenMemorySuggestion.replaceChildren();
        }

        if (zenMessageInput) {
            zenMessageInput.value = "";
            zenMessageInput.focus();
        }

        renderZenConversations();
    });
}


// Send a message to ZEN
if (zenChatForm) {
    zenChatForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = zenMessageInput.value.trim();

        if (!message) return;

        addZenMessage("user", message);

        zenMessageInput.value = "";
        zenSendButton.disabled = true;

        const typing = document.createElement("div");
        typing.className = "zen-message assistant";
        typing.textContent = "ZEN is thinking...";
        typing.id = "zenTyping";

        zenMessages.appendChild(typing);
        zenMessages.scrollTop = zenMessages.scrollHeight;

        try {
            const response = await fetch(`${ZEN_API_URL}/chat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    conversationId: currentConversationId,
                    persona: window.ZenPreferences?.getPersona?.() || "neutral"
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "ZEN could not respond.");
            }

            typing.remove();

            currentConversationId = result.conversationId;

            addZenMessage("assistant", result.reply);
            window.dispatchEvent(new Event("ai-usage-updated"));

            renderZenMemorySuggestion(result.memorySuggestion);

            await loadConversations();

        } catch (error) {
            console.error("ZEN chat error:", error);

            typing.remove();

            addZenMessage(
                "assistant",
                error.message || "Sorry, something went wrong. Please try again."
            );

        } finally {
            zenSendButton.disabled = false;
            zenMessageInput.focus();
        }
    });
}


// Approve or reject a memory suggestion
function renderZenMemorySuggestion(suggestion) {
    if (!zenMemorySuggestion) return;

    zenMemorySuggestion.replaceChildren();

    if (!suggestion || !suggestion.content) {
        zenMemorySuggestion.hidden = true;
        return;
    }

    zenMemorySuggestion.hidden = false;

    const heading = document.createElement("strong");
    heading.textContent = "ZEN wants to remember something";

    const content = document.createElement("p");
    content.textContent = suggestion.content;

    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.textContent = "Approve";
    approveButton.className = "tool-launch";

    approveButton.addEventListener("click", async () => {
        try {
            const response = await fetch(
                `${ZEN_API_URL}/memory/suggestions/approve`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ suggestion })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Could not save suggestion.");
            }

            showToast("ZEN memory suggestion approved.");

            zenMemorySuggestion.hidden = true;
            zenMemorySuggestion.replaceChildren();

            await loadMemories();

        } catch (error) {
            console.error("Memory approval error:", error);
            showToast(error.message || "Could not approve memory.");
        }
    });

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.textContent = "Reject";
    rejectButton.className = "tool-launch";

    rejectButton.addEventListener("click", () => {
        zenMemorySuggestion.hidden = true;
        zenMemorySuggestion.replaceChildren();
    });

    zenMemorySuggestion.append(
        heading,
        content,
        approveButton,
        rejectButton
    );
}


// Rename a conversation
async function renameZenConversation(conversation) {
    const newTitle = window.prompt(
        "Enter a new conversation title:",
        conversation.title
    );

    if (newTitle === null || !newTitle.trim()) return;

    try {
        const response = await fetch(
            `${ZEN_API_URL}/conversations/${conversation._id}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: newTitle.trim()
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not rename conversation.");
        }

        showToast("Conversation renamed successfully.");

        await loadConversations();

    } catch (error) {
        console.error("Rename conversation error:", error);
        showToast(error.message || "Could not rename conversation.");
    }
}


// Delete a conversation
async function deleteZenConversation(conversationId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${ZEN_API_URL}/conversations/${conversationId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not delete conversation.");
        }

        if (currentConversationId === conversationId) {
            currentConversationId = null;
            showZenWelcome();
        }

        showToast("Conversation deleted successfully.");

        await loadConversations();

    } catch (error) {
        console.error("Delete conversation error:", error);
        showToast(error.message || "Could not delete conversation.");
    }
}


    // =====================================
    // DISPLAY USER INFORMATION
    // =====================================

    function displayUser() {
        if (!currentUser) return;

        const firstName = currentUser.firstName || "";
        const lastName = currentUser.lastName || "";

        const fullName =
            `${firstName} ${lastName}`.trim() ||
            currentUser.username ||
            "User";
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || fullName.slice(0, 2).toUpperCase();

        if (profileName) {
            profileName.textContent = fullName;
        }

        if (profileAvatar) {
            profileAvatar.textContent = initials;
        }

        const sidebarAccountName = document.getElementById("sidebarAccountName");
        const sidebarAccountRole = document.getElementById("sidebarAccountRole");
        const sidebarAccountAvatar = document.getElementById("sidebarAccountAvatar");
        const profileMenuName = document.getElementById("profileMenuName");
        const profileMenuEmail = document.getElementById("profileMenuEmail");
        const sidebarMenuName = document.getElementById("sidebarMenuName");
        const sidebarMenuEmail = document.getElementById("sidebarMenuEmail");
        if (sidebarAccountName) sidebarAccountName.textContent = fullName;
        if (sidebarAccountRole) sidebarAccountRole.textContent = currentUser.accountType === "individual" ? "Individual" : currentUser.accountType === "business" ? "Business Owner" : "Account";
        if (sidebarAccountAvatar) sidebarAccountAvatar.textContent = initials;
        if (profileMenuName) profileMenuName.textContent = fullName;
        if (profileMenuEmail) profileMenuEmail.textContent = currentUser.email || "";
        if (sidebarMenuName) sidebarMenuName.textContent = fullName;
        if (sidebarMenuEmail) sidebarMenuEmail.textContent = currentUser.email || "";

        if (greetingName) {
            greetingName.textContent = firstName || fullName;
        }

        if (welcomeName) {
            welcomeName.textContent = firstName || fullName;
        }

        if (profileRole) {
    profileRole.textContent =
        currentUser.accountType === "individual"
            ? "Individual"
            : currentUser.accountType === "business"
                ? "Business Owner"
                : "Account";
}

        // Update the page title greeting
        if (greetingText) {
            const hour = new Date().getHours();

            let greeting = "Good evening";

            if (hour < 12) {
                greeting = "Good morning";
            } else if (hour < 17) {
                greeting = "Good afternoon";
            }

            greetingText.textContent = greeting;
        }
    }

        // =====================================
    // PERSONALIZE INDIVIDUAL DASHBOARD
    // =====================================

    function displayPersonalization() {
        if (!currentUser) return;

        const onboarding = currentUser.onboardingProfile;

        if (!onboarding) {
            if (personalRole) personalRole.textContent = "Not set";
            if (personalGoal) personalGoal.textContent = "Not set";
            if (personalExperience) personalExperience.textContent = "Not set";

            if (personalInterests) {
                personalInterests.textContent =
                    "Complete your onboarding to personalize your workspace.";
            }

            return;
        }

        const formatLabel = value => {
            if (!value) return "Not set";

            return value
                .replace(/-/g, " ")
                .replace(/\b\w/g, letter => letter.toUpperCase());
        };

        if (personalRole) {
            personalRole.textContent = formatLabel(onboarding.role);
        }

        if (personalGoal) {
            personalGoal.textContent = formatLabel(onboarding.goal);
        }

        if (personalExperience) {
            personalExperience.textContent =
                formatLabel(onboarding.experience);
        }

        if (personalInterests) {
            const selectedInterest = formatLabel(onboarding.interest);
            const additionalInterests = onboarding.interests?.trim();

            personalInterests.textContent = additionalInterests
                ? `Your interests: ${selectedInterest}. ${additionalInterests}`
                : `Your main interest is ${selectedInterest}.`;
        }
    }
    // =====================================
    // DATE
    // =====================================

    function displayDate() {
        if (!todayDate) return;

        const date = new Date();

        todayDate.textContent = date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    displayDate();

    // =====================================
// SIGN OUT
// =====================================

document.querySelectorAll('[data-action="signout"]').forEach(button => {
    button.addEventListener("click", () => {
        sessionStorage.removeItem("businessGrowthToken");
        sessionStorage.removeItem("businessGrowthUser");

        // window.location.href = "../../auth/login.html";
        window.location.href = "../../auth/login.html";
    });
});

    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    // Close sidebar when a navigation link is selected on mobile
    document.querySelectorAll(".sidebar-nav [data-section]").forEach(item => {
        item.addEventListener("click", () => {
            if (zenSettingsSection && item.dataset.section !== "Settings") {
                zenSettingsSection.hidden = true;
            }
            if (aiAgentPlansSection) {
                aiAgentPlansSection.hidden = item.dataset.section !== "AI Plans";
            }
            if (integrationsSection) {
                integrationsSection.hidden = item.dataset.section !== "Integrations";
            }
            if (sidebar) {
                sidebar.classList.remove("active");
            }
        });
    });

    document.querySelectorAll('[data-section="Settings"]').forEach(item => {
        item.addEventListener("click", event => {
            if (!zenSettingsSection) return;
            event.preventDefault();
            zenSettingsSection.hidden = false;
            zenSettingsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    // =====================================
    // THEME TOGGLE
    // =====================================

    const savedTheme = localStorage.getItem("businessGrowthTheme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");

            const theme = document.body.classList.contains("light-mode")
                ? "light"
                : "dark";

            localStorage.setItem("businessGrowthTheme", theme);
        });
    }

    // =====================================
    // NOTIFICATIONS
    // =====================================

function openNotifications() {
    if (!notificationsPopover) return;

    notificationsPopover.hidden = false;
    notificationsPopover.classList.add("show");

    if (notificationToggle) {
        notificationToggle.setAttribute("aria-expanded", "true");
    }

    if (profilePopover) {
        profilePopover.hidden = true;
        profilePopover.classList.remove("show");
    }

    if (profileToggle) {
        profileToggle.setAttribute("aria-expanded", "false");
    }
}

function closeNotifications() {
    if (!notificationsPopover) return;

    notificationsPopover.classList.remove("show");
    notificationsPopover.hidden = true;

    if (notificationToggle) {
        notificationToggle.setAttribute("aria-expanded", "false");
    }
}

if (notificationToggle) {
    notificationToggle.addEventListener("click", event => {
        event.stopPropagation();

        if (
            notificationsPopover &&
            !notificationsPopover.hidden
        ) {
            closeNotifications();
        } else {
            openNotifications();
        }
    });
}

if (notificationsList) {
    notificationsList.innerHTML = `
        <div class="empty-notifications">
            <p>You're all caught up!</p>
            <small>New notifications will appear here.</small>
        </div>
    `;
}

if (notificationBadge) {
    notificationBadge.hidden = true;
}

if (markRead) {
    markRead.hidden = true;
}


    // function closeNotifications() {
    //     if (notificationsPopover) {
    //         notificationsPopover.classList.remove("show");
    //     }
    // }

    // if (notificationToggle && notificationsPopover) {
    //     notificationToggle.addEventListener("click", event => {
    //         event.stopPropagation();

    //         notificationsPopover.classList.toggle("show");

    //         if (profilePopover) {
    //             profilePopover.classList.remove("show");
    //         }
    //     });
    // }

    // if (notificationsList) {
    //     notificationsList.innerHTML = `
    //         <div class="empty-notifications">
    //             <p>You're all caught up!</p>
    //             <small>New notifications will appear here.</small>
    //         </div>
    //     `;
    // }

    // if (notificationBadge) {
    //     notificationBadge.hidden = true;
    // }

    // if (markRead) {
    //     markRead.hidden = true;

    //     markRead.addEventListener("click", () => {
    //         showToast("All notifications marked as read.");
    //     });
    // }

 
    // =====================================
    // PROFILE DROPDOWN
    // =====================================

    function openProfile() {
        if (!profilePopover) return;

        profilePopover.hidden = false;
        profilePopover.classList.add("show");

        if (profileToggle) {
            profileToggle.setAttribute("aria-expanded", "true");
        }

        closeNotifications();
    }

    function closeProfile() {
        if (!profilePopover) return;

        profilePopover.hidden = true;
        profilePopover.classList.remove("show");

        if (profileToggle) {
            profileToggle.setAttribute("aria-expanded", "false");
        }
    }

    if (profileToggle) {
        profileToggle.addEventListener("click", event => {
            event.stopPropagation();

            if (profilePopover && !profilePopover.hidden) {
                closeProfile();
            } else {
                openProfile();
            }
        });
    }

    const sidebarAccountToggle = document.getElementById("sidebarAccountToggle");
    const sidebarAccountMenu = document.getElementById("sidebarAccountMenu");
    function closeSidebarAccount() {
        if (sidebarAccountMenu) sidebarAccountMenu.hidden = true;
        if (sidebarAccountToggle) sidebarAccountToggle.setAttribute("aria-expanded", "false");
    }
    if (sidebarAccountToggle && sidebarAccountMenu) {
        sidebarAccountToggle.addEventListener("click", event => {
            event.stopPropagation();
            const shouldOpen = sidebarAccountMenu.hidden;
            closeProfile();
            closeNotifications();
            sidebarAccountMenu.hidden = !shouldOpen;
            sidebarAccountToggle.setAttribute("aria-expanded", String(shouldOpen));
        });
        sidebarAccountMenu.addEventListener("click", event => event.stopPropagation());
    }
    sidebarAccountMenu?.querySelector("[data-sidebar-settings]")?.addEventListener("click", closeSidebarAccount);
    document.addEventListener("click", closeSidebarAccount);

       // =====================================
    // CLOSE DROPDOWNS WITH ESCAPE
    // =====================================

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeNotifications();
            closeProfile();
            closeSidebarAccount();

            if (sidebar) {
                sidebar.classList.remove("active");
            }
        }
    });


    // =====================================
    // SIDEBAR SUBMENUS
    // =====================================

    document.querySelectorAll(".nav-expand").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();

            const parent = button.closest(".nav-item");

            if (!parent) return;

            parent.classList.toggle("expanded");
        });
    });

    // =====================================
    // SIDEBAR NAVIGATION
    // =====================================

    const navigationItems = document.querySelectorAll(
        ".sidebar-nav [data-section]"
    );

    navigationItems.forEach(item => {
        item.addEventListener("click", event => {
            const sectionName = item.dataset.section;

            if (!sectionName) return;

            // const target = document.getElementById(sectionName);
            const href = item.getAttribute("href");

const targetId = href && href.startsWith("#")
    ? href.substring(1)
    : sectionName;

const target = document.getElementById(targetId);

            if (target) {
                event.preventDefault();

                if (zenSettingsSection) zenSettingsSection.hidden = target !== zenSettingsSection;
                if (aiAgentPlansSection) aiAgentPlansSection.hidden = target !== aiAgentPlansSection;
                if (integrationsSection) integrationsSection.hidden = target !== integrationsSection;

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                navigationItems.forEach(nav => {
                    nav.classList.remove("active");
                });

                item.classList.add("active");
            } else {
                event.preventDefault();

                showToast(
                    "This section is not available yet. We're working on it."
                );
            }
        });
    });

    // =====================================
    // GLOBAL SEARCH
    // =====================================

    if (globalSearch) {
        globalSearch.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;

            const searchTerm = globalSearch.value
                .trim()
                .toLowerCase();

            if (!searchTerm) return;

            const matchingItem = [...navigationItems].find(item =>
                item.textContent.toLowerCase().includes(searchTerm)
            );

            if (matchingItem) {
                matchingItem.click();
                return;
            }

            const aiTools = document.getElementById("ai-tools");

            if (
                aiTools &&
                ["ai", "assistant", "tools"].some(term =>
                    searchTerm.includes(term)
                )
            ) {
                aiTools.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                return;
            }

            showToast(`No dashboard section found for "${searchTerm}".`);
        });
    }

 // =====================================
// PERSONALIZED AI TOOL RECOMMENDATIONS
// =====================================

function personalizeAITools() {
    if (!currentUser) return;

    const onboarding = currentUser.onboardingProfile;

    if (!onboarding) return;

    const interest = onboarding.interest;

    const recommendedTools = {
        writing: ["writing"],
        coding: ["coding"],
        research: ["research"],
        images: ["images"],
        video: ["video"],
        automation: ["automation"],
        data: ["data"],
        all: [
            "writing",
            "coding",
            "research",
            "learning",
            "images",
            "video",
            "automation",
            "data"
        ]
    };

    const selectedTools = recommendedTools[interest] || [];

    document.querySelectorAll("#toolsGrid [data-tool]").forEach(card => {
        const toolName = card.dataset.tool;

        const isRecommended = selectedTools.includes(toolName);

        card.classList.toggle("recommended-tool", isRecommended);

        // Remove an old badge
        const oldBadge = card.querySelector(".recommendation-badge");

        if (oldBadge) {
            oldBadge.remove();
        }

        if (isRecommended) {
            const badge = document.createElement("span");

            badge.className = "recommendation-badge";
            badge.textContent = "RECOMMENDED FOR YOU";

            Object.assign(badge.style, {
                display: "inline-block",
                width: "fit-content",
                marginTop: "14px",
                padding: "7px 12px",
                borderRadius: "20px",
                background: "#1d4ed8",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: "800",
                letterSpacing: "0.6px"
            });

            card.appendChild(badge);

            card.style.border = "2px solid #3b82f6";
            card.style.boxShadow =
                "0 0 20px rgba(59, 130, 246, 0.25)";
        } else {
            card.style.border = "";
            card.style.boxShadow = "";
        }
    });
}


// =====================================
// AI TOOL LAUNCH BUTTONS
// =====================================


// =====================================
// AI TOOLS LAUNCHER
// =====================================

const toolPrompts = {
    writing: "Act as my AI Writing Assistant. Help me write, rewrite, edit, proofread and summarize content. What would you like me to work on?",

    coding: "Act as my AI Coding Assistant. Help me write code, explain programming concepts, debug errors and build applications. What are we coding today?",

    research: "Act as my AI Research Assistant. Help me investigate topics, organize information and develop well-informed insights. What would you like to research?",

    learning: "Act as my AI Learning Assistant. Teach me difficult topics in simple steps, with examples and practice questions. What would you like to learn?",

    images: "Act as my AI Image Assistant. Help me develop image ideas, write image-generation prompts and plan visual designs. What image would you like to create?",

    video: "Act as my AI Video Assistant. Help me develop video concepts, scripts, storyboards and production plans. What video are we creating?",

    automation: "Act as my AI Automation Assistant. Help me identify repetitive tasks, design workflows and plan business process automation. What would you like to automate?",

    data: "Act as my Data Analysis Assistant. Help me understand datasets, calculate statistics, identify patterns and interpret results. What data would you like to analyse?"
};

document.querySelectorAll("[data-launch]").forEach(button => {

    button.addEventListener("click", () => {

        const toolName = button.dataset.launch;
        const prompt = toolPrompts[toolName];

        if (!prompt) {
            showToast("This AI tool is not available yet.");
            return;
        }

        const messageInput = document.getElementById(
            "zenMessageInput"
        );

        if (!zenWidgetPanel || !messageInput) {
            showToast("ZEN Chat could not be opened.");
            return;
        }

        setZenWidgetOpen(true);

        // Prepare the selected assistant
        messageInput.value = prompt;
        messageInput.focus();

        showToast("Your AI assistant is ready!");
    });

});


    // =====================================
    // CLOSE DROPDOWNS WITH ESCAPE
    // =====================================

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeNotifications();

            if (profilePopover) {
                profilePopover.classList.remove("show");
            }

            if (sidebar) {
                sidebar.classList.remove("active");
            }
        }
    });

    // =====================================
    // INITIALIZE DASHBOARD
    // =====================================

    loadUser();
});
