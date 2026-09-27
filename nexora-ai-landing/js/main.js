/**
 * Nexora AI — concept landing page interactions
 * Frontend only. No backend, no stored waitlist.
 */
(function () {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const drawer = document.getElementById("mobile-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  function setDrawer(open) {
    if (!drawer || !toggle) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    if (backdrop) backdrop.classList.toggle("hidden", !open);
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setDrawer(!drawer.classList.contains("is-open"));
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      setDrawer(false);
    });
  }

  document.querySelectorAll("[data-nav-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      setDrawer(false);
    });
  });

  window.addEventListener("scroll", function () {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  /* Scroll reveal — fail open so content never stays hidden */
  const reveals = document.querySelectorAll(".reveal");
  function revealAll() {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "80px 0px 80px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    window.setTimeout(revealAll, 1600);
  } else {
    revealAll();
  }

  /* Tool cards — expand detail (prototype interaction only) */
  document.querySelectorAll("[data-tool-card]").forEach(function (card) {
    const button = card.querySelector("[data-tool-toggle]");
    const detail = card.querySelector("[data-tool-detail]");
    if (!button || !detail) return;

    button.addEventListener("click", function () {
      const open = detail.classList.toggle("hidden") === false;
      card.classList.toggle("is-active", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? "Hide concept" : "View concept";
    });
  });

  /* Early access form — client-side only */
  const form = document.getElementById("early-access-form");
  const success = document.getElementById("form-success");
  const errorBox = document.getElementById("form-error");

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errorBox) errorBox.classList.add("hidden");

      const name = form.querySelector("#name");
      const email = form.querySelector("#email");
      const userType = form.querySelector("#user-type");

      if (!name.value.trim()) {
        showError("Please enter your name.");
        name.focus();
        return;
      }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showError("Please enter a valid email address.");
        email.focus();
        return;
      }
      if (!userType.value) {
        showError("Please select whether you are joining as an individual or a business.");
        userType.focus();
        return;
      }

      form.classList.add("hidden");
      if (success) {
        success.classList.remove("hidden");
        success.focus();
      }
    });
  }
})();
