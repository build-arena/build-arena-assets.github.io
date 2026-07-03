(function () {
  const media = window.matchMedia("(max-width: 700px)");
  let currentMode = "preview";
  let lastPhase = "";
  let textPhaseScrollToken = 0;

  function getLayout() {
    return document.querySelector(".layout.split");
  }

  function getLeftPane(layout) {
    return layout ? layout.querySelector(".left-pane") : null;
  }

  function getActivePhase() {
    const active = document.querySelector(".phase-btn.active");
    return (active?.dataset?.phase || active?.textContent || "").trim().toLowerCase();
  }

  function getStepCountLabel() {
    const counter = document.querySelector("#step-counter")?.textContent || "";
    const match = counter.match(/\d+\s*\/\s*(\d+)/);
    return match ? `Back to Build - ${match[1]} steps` : "Back to Build";
  }

  function isTextPhase(phase) {
    return phase === "plan" || phase === "draft";
  }

  function setTextPhaseState(layout, phase, enabled) {
    layout.classList.toggle("mobile-text-phase", enabled);
    layout.classList.toggle("mobile-plan-phase", enabled && phase === "plan");
    layout.classList.toggle("mobile-draft-phase", enabled && phase === "draft");
  }

  function scrollTextPhase(layout, phase) {
    textPhaseScrollToken += 1;
    const token = textPhaseScrollToken;

    window.setTimeout(() => {
      if (token !== textPhaseScrollToken || !layout.classList.contains("mobile-text-phase")) return;

      const stream = layout.querySelector(".conversation-stream");
      if (!stream) return;

      let target = null;
      if (phase === "draft") {
        const cards = Array.from(stream.querySelectorAll(".stream-card, .bubble"));
        target = cards.find((card) => /Drafter|Draft Result/i.test(card.textContent || ""));
      }

      if (target) {
        const top =
          stream.scrollTop +
          target.getBoundingClientRect().top -
          stream.getBoundingClientRect().top -
          10;
        stream.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      } else {
        stream.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 180);
  }

  function setMode(layout, mode) {
    currentMode = mode === "log" ? "log" : "preview";
    layout.classList.toggle("mobile-preview-mode", currentMode === "preview");
    layout.classList.toggle("mobile-log-mode", currentMode === "log");
    updateBar(layout);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      if (currentMode === "log") {
        window.setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 120);
      }
    });
  }

  function updateBar(layout) {
    const bar = layout.querySelector(".mobile-build-mode-bar");
    if (!bar) return;
    const previewButton = bar.querySelector("[data-mobile-mode='preview']");
    const logButton = bar.querySelector("[data-mobile-mode='log']");
    if (previewButton) {
      previewButton.classList.toggle("active", currentMode === "preview");
      previewButton.setAttribute("aria-pressed", String(currentMode === "preview"));
    }
    if (logButton) {
      logButton.textContent = getStepCountLabel();
      logButton.classList.toggle("active", currentMode === "log");
      logButton.setAttribute("aria-pressed", String(currentMode === "log"));
    }
  }

  function ensureBar(layout) {
    const leftPane = getLeftPane(layout);
    if (!leftPane) return;
    let bar = leftPane.querySelector(".mobile-build-mode-bar");
    if (bar) {
      updateBar(layout);
      return;
    }

    bar = document.createElement("div");
    bar.className = "mobile-build-mode-bar";
    bar.setAttribute("aria-label", "Mobile Build view mode");
    bar.innerHTML = `
      <button type="button" data-mobile-mode="preview">Preview</button>
      <button type="button" data-mobile-mode="log">${getStepCountLabel()}</button>
    `;
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mobile-mode]");
      if (!button) return;
      setMode(layout, button.dataset.mobileMode);
    });
    leftPane.prepend(bar);
    updateBar(layout);
  }

  function disableBuildEnhancement(layout) {
    if (!layout) return;
    layout.classList.remove("mobile-build-enhanced", "mobile-preview-mode", "mobile-log-mode");
    const bar = layout.querySelector(".mobile-build-mode-bar");
    if (bar) bar.remove();
  }

  function refresh() {
    const layout = getLayout();
    if (!layout) return;

    const phase = getActivePhase();
    const shouldEnhance = media.matches && phase === "build";
    const shouldUseTextPhase = media.matches && isTextPhase(phase);

    if (!shouldEnhance) {
      disableBuildEnhancement(layout);
    }

    setTextPhaseState(layout, phase, shouldUseTextPhase);

    if (shouldUseTextPhase && lastPhase !== phase) {
      scrollTextPhase(layout, phase);
      window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }

    if (!shouldEnhance) {
      lastPhase = phase;
      return;
    }

    setTextPhaseState(layout, phase, false);
    layout.classList.add("mobile-build-enhanced");
    ensureBar(layout);

    if (lastPhase !== "build") {
      currentMode = "log";
    }

    setMode(layout, currentMode);
    lastPhase = phase;
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(refresh);
  });

  function start() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "value", "disabled"],
    });
    media.addEventListener?.("change", refresh);
    document.addEventListener("click", () => window.setTimeout(refresh, 0), true);
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
