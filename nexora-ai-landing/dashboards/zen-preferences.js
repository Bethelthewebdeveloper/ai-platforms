(function () {
    "use strict";

    const STORAGE_KEY = "businessGrowthZenSettings";
    const DEFAULTS = { persona: "neutral", motion: "drift" };
    const VALID_PERSONAS = new Set(["neutral", "male", "female", "gay_man"]);
    const VALID_MOTION = new Set(["drift", "stationary"]);
    let settings = { ...DEFAULTS };

    function readSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            settings = {
                persona: VALID_PERSONAS.has(stored.persona) ? stored.persona : DEFAULTS.persona,
                motion: VALID_MOTION.has(stored.motion) ? stored.motion : DEFAULTS.motion,
            };
        } catch (error) {
            settings = { ...DEFAULTS };
        }
        return { ...settings };
    }

    window.ZenPreferences = {
        getSettings: readSettings,
        getPersona: () => readSettings().persona,
    };

    document.addEventListener("DOMContentLoaded", () => {
        const orb = document.getElementById("zenOrb");
        const widget = document.getElementById("zenWidget");
        const panel = document.getElementById("zenWidgetPanel");
        const form = document.getElementById("zenPreferencesForm");
        const personaSelect = document.getElementById("zenPersona");
        const motionSelect = document.getElementById("zenOrbMotion");
        const status = document.getElementById("zenPreferencesStatus");
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        readSettings();
        if (personaSelect) personaSelect.value = settings.persona;
        if (motionSelect) motionSelect.value = settings.motion;
        if (!orb || !widget) return;

        let motionTimer = null;

        function positionPanel() {
            if (!panel) return;
            const rect = orb.getBoundingClientRect();
            const panelHeight = !panel.hidden
                ? panel.getBoundingClientRect().height
                : Math.min(650, window.innerHeight - 130);
            widget.classList.toggle("zen-widget--left", rect.left > window.innerWidth / 2);
            widget.classList.toggle("zen-widget--top", rect.top < panelHeight + 100);
        }

        function placeOrb(left, top, animate = true) {
            const margin = 16;
            const maxLeft = Math.max(margin, window.innerWidth - orb.offsetWidth - margin);
            const maxTop = Math.max(margin, window.innerHeight - orb.offsetHeight - margin);
            const x = Math.max(margin, Math.min(left, maxLeft));
            const y = Math.max(margin, Math.min(top, maxTop));
            widget.classList.add("zen-widget--positioned");
            widget.style.left = `${x}px`;
            widget.style.top = `${y}px`;
            widget.style.right = "auto";
            widget.style.bottom = "auto";
            widget.classList.toggle("zen-widget--motion-ready", animate);
            positionPanel();
        }

        function stopMotion() {
            clearTimeout(motionTimer);
            motionTimer = null;
        }

        function scheduleMotion() {
            stopMotion();
            if (settings.motion !== "drift" || reducedMotion) return;
            motionTimer = window.setTimeout(() => {
                if (!panel?.hidden) {
                    scheduleMotion();
                    return;
                }
                const maxLeft = Math.max(16, window.innerWidth - orb.offsetWidth - 16);
                const maxTop = Math.max(16, window.innerHeight - orb.offsetHeight - 16);
                const left = 16 + Math.random() * Math.max(0, maxLeft - 16);
                const top = 16 + Math.random() * Math.max(0, maxTop - 16);
                placeOrb(left, top, true);
                scheduleMotion();
            }, 12000 + Math.random() * 6000);
        }

        function applyMotionPreference() {
            if (!widget.classList.contains("zen-widget--positioned")) {
                const rect = orb.getBoundingClientRect();
                placeOrb(rect.left, rect.top, false);
                window.setTimeout(() => widget.classList.add("zen-widget--motion-ready"), 100);
            }
            if (settings.motion === "drift") scheduleMotion();
            else stopMotion();
        }

        applyMotionPreference();
        function updateOrbTitle() {
            orb.title = settings.motion === "drift"
                ? "ZEN moves gently around the screen. Open chat with a click."
                : "ZEN stays in one place. Open chat with a click.";
        }
        updateOrbTitle();
        orb.addEventListener("click", () => {
            stopMotion();
            window.setTimeout(() => {
                if (panel?.hidden) scheduleMotion();
            }, 1500);
        });
        document.getElementById("closeZenChat")?.addEventListener("click", () => {
            window.setTimeout(scheduleMotion, 2000);
        });

        form?.addEventListener("submit", event => {
            event.preventDefault();
            settings = {
                persona: VALID_PERSONAS.has(personaSelect?.value) ? personaSelect.value : DEFAULTS.persona,
                motion: VALID_MOTION.has(motionSelect?.value) ? motionSelect.value : DEFAULTS.motion,
            };
            updateOrbTitle();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
                if (status) status.textContent = "Preferences saved.";
            } catch (error) {
                if (status) status.textContent = "Could not save preferences in this browser.";
            }
            applyMotionPreference();
            window.setTimeout(positionPanel, 100);
        });

        window.addEventListener("resize", () => {
            const rect = orb.getBoundingClientRect();
            placeOrb(rect.left, rect.top, false);
            if (settings.motion === "drift") scheduleMotion();
        });
    });
})();
