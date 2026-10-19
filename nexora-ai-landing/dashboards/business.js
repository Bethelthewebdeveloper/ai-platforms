document.addEventListener("DOMContentLoaded", function () {
    const userNameElement = document.getElementById("userName");
    const greetingElement = document.getElementById("greeting");

    const userName = localStorage.getItem("userName");

    if (userName) {
        userNameElement.textContent = userName;
    } else {
        userNameElement.textContent = "User";
    }

    const hour = new Date().getHours();

    if (hour < 12) {
        greetingElement.textContent = "Good morning";
    } else if (hour < 17) {
        greetingElement.textContent = "Good afternoon";
    } else {
        greetingElement.textContent = "Good evening";
    }
});

document.addEventListener("DOMContentLoaded", function () {
  const notificationToggle = document.getElementById("notificationToggle");
  const notificationsPopover = document.getElementById("notificationsPopover");
  const markReadButton = document.getElementById("markRead");
  const notificationDot = document.querySelector(".notification-dot");
  const notificationItems = document.querySelectorAll(".notification-item");
  const dropdownWrap = notificationToggle?.closest(".dropdown-wrap");

  if (
    !notificationToggle ||
    !notificationsPopover ||
    !markReadButton ||
    !notificationDot ||
    !dropdownWrap
  ) {
    return;
  }

  notificationToggle.addEventListener("click", function (event) {
    event.stopPropagation();

    const isOpen = !notificationsPopover.hidden;

    notificationsPopover.hidden = isOpen;
    notificationToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!dropdownWrap.contains(event.target)) {
      notificationsPopover.hidden = true;
      notificationToggle.setAttribute("aria-expanded", "false");
    }
  });

  
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      notificationsPopover.hidden = true;
      notificationToggle.setAttribute("aria-expanded", "false");
      notificationToggle.focus();
    }
  });

  markReadButton.addEventListener("click", function () {
    notificationDot.textContent = "";
    notificationDot.hidden = true;

    notificationItems.forEach(function (item) {
      item.classList.add("is-read");
    });

    markReadButton.textContent = "All caught up!";
    markReadButton.disabled = true;
  });

  function updateNotificationCount() {
    const unreadCount = document.querySelectorAll(
      ".notification-item:not(.is-read)"
    ).length;

    notificationDot.textContent = unreadCount > 99 ? "99+" : unreadCount;
    notificationDot.hidden = unreadCount === 0;

    markReadButton.textContent = "Mark all read";
    markReadButton.disabled = unreadCount === 0;
  }

  updateNotificationCount();
});