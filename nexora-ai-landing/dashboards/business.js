"use strict";

document.addEventListener("DOMContentLoaded", function () {


    const todayDate = document.getElementById("todayDate");

    if (todayDate) {
        todayDate.textContent = new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }



    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");

    const navLinks = document.querySelectorAll(
        ".side-nav [data-section]"
    );

    const sectionNames = [
        "Dashboard",
        "AI Tools",
        "CRM",
        "Customers",
        "Deals",
        "Company",
        "Team & Roles",
        "Integrations",
        "Business Management",
        "Projects",
        "Tasks",
        "Calendar",
        "Reports",
        "Settings",
        "Help & Support",
        "My Profile"
    ];


    function showToast(message) {

        let toast = document.getElementById("dashboardToast");

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

        toast.hideTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);

    }



    window.showDashboardToast = showToast;


    function showDashboardSection(sectionName) {

        if (!sectionNames.includes(sectionName)) {
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

            const sectionTargets = {
                "AI Tools": "ai-tools",
                "Deals": "deals",
                "Customers": "customers",
                "Tasks": "tasks",
                "Reports": "reports"
            };

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
                    " section selected. This section is not available yet."
                );

            }

        }


        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove("open");

            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
            }
        }

    }


    navLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const sectionName = link.dataset.section;

            if (!sectionName) {
                return;
            }

            event.preventDefault();


            // Expand or collapse navigation groups.

            if (link.classList.contains("nav-expand")) {

                const submenu = link.nextElementSibling;

                if (submenu && submenu.classList.contains("sub-nav")) {

                    const isExpanded =
                        link.getAttribute("aria-expanded") === "true";

                    link.setAttribute(
                        "aria-expanded",
                        String(!isExpanded)
                    );

                    submenu.hidden = isExpanded;

                    submenu.classList.toggle(
                        "open",
                        !isExpanded
                    );

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



    const themeToggle = document.getElementById("themeToggle");

    const themeIcon = themeToggle
        ? themeToggle.querySelector("i")
        : null;


    function applyTheme(theme) {

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
                isLight
                    ? "Switch to dark mode"
                    : "Switch to light mode"
            );

        }


        try {

            localStorage.setItem(
                "businessGrowthTheme",
                theme
            );

        } catch (error) {

            // Theme still works if browser storage is unavailable.

        }

    }


    let savedTheme = "dark";

    try {

        savedTheme =
            localStorage.getItem("businessGrowthTheme") || "dark";

    } catch (error) {

        // Dark mode is the default.

    }


    applyTheme(savedTheme);


    if (themeToggle) {

        themeToggle.addEventListener("click", function () {

            const isLight =
                document.body.classList.contains("light-mode");

            applyTheme(isLight ? "dark" : "light");

        });

    }



    const notificationToggle =
        document.getElementById("notificationToggle");

    const notificationsPopover =
        document.getElementById("notificationsPopover");

    const markRead = document.getElementById("markRead");

    const notificationDot =
        document.querySelector(".notification-dot");


    function closeNotifications() {

        if (notificationsPopover) {
            notificationsPopover.hidden = true;
        }

        if (notificationToggle) {

            notificationToggle.setAttribute(
                "aria-expanded",
                "false"
            );

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


        notificationsPopover.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();
            }
        );

    }


    if (markRead) {

        markRead.addEventListener("click", function () {

            document.querySelectorAll(".notification-item").forEach(
                function (item) {
                    item.classList.add("read");
                }
            );


            if (notificationDot) {
                notificationDot.hidden = true;
            }


            closeNotifications();

            showToast("All notifications marked as read.");

        });

    }



    const profileToggle = document.getElementById("profileToggle");

    const profilePopover = document.getElementById("profilePopover");


    function closeProfile() {

        if (profilePopover) {
            profilePopover.hidden = true;
        }

        if (profileToggle) {

            profileToggle.setAttribute(
                "aria-expanded",
                "false"
            );

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


        profilePopover.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();
            }
        );

    }


    document.addEventListener("click", function () {

        closeNotifications();
        closeProfile();

    });



    const globalSearch = document.getElementById("globalSearch");


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

        }

    });


    if (globalSearch) {

        globalSearch.addEventListener("keydown", function (event) {

            if (event.key !== "Enter") {
                return;
            }

            const query = globalSearch.value.trim().toLowerCase();

            if (!query) {
                return;
            }

            const searchableSections = {
                "dashboard": "Dashboard",
                "ai": "AI Tools",
                "assistant": "AI Tools",
                "crm": "CRM",
                "customer": "Customers",
                "deal": "Deals",
                "company": "Company",
                "team": "Team & Roles",
                "integration": "Integrations",
                "project": "Projects",
                "task": "Tasks",
                "calendar": "Calendar",
                "report": "Reports",
                "setting": "Settings",
                "help": "Help & Support",
                "profile": "My Profile"
            };

            const matchedKey = Object.keys(searchableSections).find(
                function (key) {
                    return key.includes(query) || query.includes(key);
                }
            );

            if (matchedKey) {

                event.preventDefault();

                showDashboardSection(
                    searchableSections[matchedKey]
                );

            } else {

                showToast("No matching dashboard section found.");

            }

        });

    }



    const revenueData = {

        7: {
            total: 12480,
            growth: 18.4,
            labels: [
                "Mon", "Tue", "Wed", "Thu",
                "Fri", "Sat", "Sun"
            ],
            values: [
                1200, 1800, 1500, 2200,
                1700, 2400, 1680
            ]
        },

        30: {
            total: 48650,
            growth: 22.6,
            labels: [
                "Week 1",
                "Week 2",
                "Week 3",
                "Week 4"
            ],
            values: [
                9500, 11200, 12450, 15500
            ]
        },

        90: {
            total: 138900,
            growth: 31.2,
            labels: [
                "Month 1",
                "Month 2",
                "Month 3"
            ],
            values: [
                38500, 45200, 55200
            ]
        }

    };



    window.revenueData = revenueData;


    const quickActionsData = [

        {
            title: "AI Tools",
            description: "Generate content, ideas & more",
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


    const tasksData = [];


    window.tasksData = tasksData;



    document.querySelectorAll("[data-action]").forEach(
        function (button) {

            button.addEventListener("click", function (event) {

                const action = button.dataset.action;

                if (
                    action === "ai-tools" ||
                    action === "view-deals"
                ) {
                    return;
                }


                event.preventDefault();


                const actionMessages = {

                    "add-customer":
                        "Customer registration is not connected yet.",

                    "create-deal":
                        "Deal creation is not connected yet.",

                    "schedule-meeting":
                        "Meeting scheduling is not connected yet.",

                    "view-reports":
                        "Reports are not connected yet."

                };


                if (actionMessages[action]) {

                    showToast(actionMessages[action]);

                }

            });

        }
    );



    const assistantForm =
        document.getElementById("assistantForm");

    const assistantInput =
        document.getElementById("assistantInput");

    const assistantChat =
        document.getElementById("assistantChat");

    const assistantStatus =
        document.getElementById("assistantStatus");


    function addAssistantMessage(message, sender) {

        if (!assistantChat) {
            return null;
        }


        const bubble = document.createElement("div");

        bubble.classList.add(
            sender === "user"
                ? "user-bubble"
                : "assistant-bubble"
        );

        bubble.textContent = message;

        assistantChat.appendChild(bubble);

        assistantChat.scrollTop =
            assistantChat.scrollHeight;


        return bubble;

    }


    function sendAssistantMessage(message) {

        const cleanMessage = message.trim();

        if (
            !cleanMessage ||
            !assistantInput ||
            !assistantForm ||
            !assistantChat
        ) {
            return;
        }


        addAssistantMessage(cleanMessage, "user");

        assistantInput.value = "";



        const suggestions =
            assistantChat.querySelector(".suggestion-list");

        if (suggestions) {
            suggestions.remove();
        }


        addAssistantMessage(
            "Your message has been received. BusinessGrowth's " +
            "AI service has not been connected yet. Once a secure " +
            "AI backend is configured, I will be able to help you " +
            "with business questions and analysis.",
            "assistant"
        );


        if (assistantStatus) {

            assistantStatus.textContent =
                "Demo mode · Live AI responses are not connected.";

        }

    }


    if (assistantForm && assistantInput && assistantChat) {

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


    document.querySelectorAll(".suggestion-btn").forEach(
        function (button) {

            button.addEventListener("click", function () {

                if (!assistantInput || !assistantForm) {
                    return;
                }

                assistantInput.value =
                    button.textContent.trim();

                assistantForm.requestSubmit();

            });

        }
    );


    document.querySelectorAll(
        ".suggestion-list li:not(:has(.suggestion-btn))"
    ).forEach(function (item) {

        item.style.cursor = "pointer";

        item.addEventListener("click", function () {

            if (!assistantInput || !assistantForm) {
                return;
            }

            assistantInput.value = item.textContent.trim();

            assistantForm.requestSubmit();

        });

    });



    document.querySelectorAll(
        '[data-action="ai-tools"]'
    ).forEach(function (button) {

        button.addEventListener("click", function () {

            const aiSection =
                document.getElementById("ai-tools");

            if (aiSection) {

                aiSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                if (assistantInput) {

                    setTimeout(function () {
                        assistantInput.focus();
                    }, 400);

                }

            } else {

                showToast("The AI Tools section could not be found.");

            }

        });

    });

    const viewAllDeals =
        document.getElementById("viewAllDeals");


    if (viewAllDeals) {

        viewAllDeals.addEventListener("click", function () {

            const dealsSection =
                document.getElementById("deals");

            if (dealsSection) {

                dealsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                showToast(
                    "You're viewing the Recent Deals section."
                );

            }

        });

    }



    console.log(
        "BusinessGrowth dashboard initialized successfully."
    );

});

const dealsData = [];


window.dealsData = dealsData;

const dealList = document.getElementById("dealList");

const viewAllDeals = document.getElementById("viewAllDeals");

function formatDealAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount);
}


function formatDealDate(dateString) {
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


function createDealCard(deal) {
  const item = document.createElement("div");

  item.className = "deal-item";
  item.dataset.dealId = deal.id;

  const avatar = document.createElement("span");

  avatar.className = "deal-avatar";

  if (deal.avatarColor) {
    avatar.classList.add(deal.avatarColor);
  }

  avatar.textContent = deal.company.trim().charAt(0).toUpperCase();

  const info = document.createElement("div");

  info.className = "deal-info";

  const company = document.createElement("strong");

  company.textContent = deal.company;

  const amount = document.createElement("span");

  amount.textContent = formatDealAmount(deal.amount);

  info.append(company, amount);


  const status = document.createElement("span");

  status.className = "deal-status";

  const normalizedStatus = deal.status.toLowerCase();

  const statusClasses = {
    won: "won",
    "in progress": "progress",
    proposal: "proposal",
    lost: "lost"
  };

  status.classList.add(
    statusClasses[normalizedStatus] || "proposal"
  );

  status.textContent = deal.status;


  const date = document.createElement("time");

  date.dateTime = deal.date;

  date.textContent = formatDealDate(deal.date);


  item.append(avatar, info, status, date);

  return item;
}

function renderDeals(deals) {
  if (!dealList) {
    return;
  }

  dealList.replaceChildren();


  if (!Array.isArray(deals) || deals.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "deals-empty";

    emptyMessage.textContent =
      "No deals yet. Your business opportunities will appear here.";

    dealList.appendChild(emptyMessage);

    return;
  }


  const sortedDeals = [...deals].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });


  sortedDeals.forEach((deal) => {
    dealList.appendChild(createDealCard(deal));
  });
}



renderDeals(dealsData);


if (viewAllDeals) {
  viewAllDeals.addEventListener("click", function () {

    if (typeof window.showDashboardToast === "function") {
      window.showDashboardToast(
        "Your full Deals page has not been connected yet."
      );
    }
  });
}

function renderNotifications() {
  if (
    !notificationBadge ||
    !notificationsList ||
    !markReadButton
  ) {
    return;
  }

  // Count only unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // Update the notification badge
  notificationBadge.hidden = unreadCount === 0;

  if (unreadCount > 0) {
    notificationBadge.textContent =
      unreadCount > 99 ? "99+" : unreadCount;

    notificationToggle?.setAttribute(
      "aria-label",
      // ${unreadCount}, unreadnotifications,
    );
  } else {
    notificationBadge.textContent = "";

    notificationToggle?.setAttribute(
      "aria-label",
      "Notifications",
    );
  }

  // Show "Mark all read" only when unread notifications exist
  markReadButton.hidden = unreadCount === 0;

  // Show empty state only when there are no notifications at all
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="notifications-empty">
        <i class="bi bi-bell-slash"></i>
        <strong>No notifications yet</strong>
        <p>New notifications will appear here.</p>
      </div>
    `;

    return;
  }

  // Display both read and unread notifications
  notificationsList.innerHTML = notifications
    .map((notification) => {
      const timeText = formatNotificationTime(notification.time);

      return `
        <div class="notification-item ${
          notification.read ? "is-read" : "is-unread"
        }">
          <span class="notification-icon ${escapeNotificationText(
            notification.color,
          )}">
            <i class="bi ${escapeNotificationText(notification.icon)}"></i>
          </span>

          <div class="notification-content">
            <strong>
              ${escapeNotificationText(notification.title)}
            </strong>

            <p>
              ${escapeNotificationText(notification.description)}
            </p>

            <small>${timeText}</small>

            ${
              notification.read
                ? '<span class="read-status">Read</span>'
                : '<span class="unread-status">New</span>'
            }
          </div>
        </div>
      `;
    })
    .join("");
}