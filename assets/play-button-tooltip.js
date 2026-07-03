(function () {
  const TIP_TEXT = "Switch to Build mode to enable playback.";
  let tooltip = null;
  let activeButton = null;
  let hideTimer = 0;

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.className = "play-disabled-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = TIP_TEXT;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function getPlayButtonAt(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    const button = target?.closest?.("#play-btn");
    return button && button.disabled ? button : null;
  }

  function positionTooltip(button) {
    const tip = ensureTooltip();
    const rect = button.getBoundingClientRect();
    tip.classList.add("visible");

    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

    let top = rect.top - tipRect.height - 10;
    if (top < 8) {
      top = rect.bottom + 10;
      tip.classList.add("below");
    } else {
      tip.classList.remove("below");
    }

    const arrowLeft = rect.left + rect.width / 2 - left - 5;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    tip.style.setProperty("--tip-arrow-left", `${Math.round(arrowLeft)}px`);
  }

  function show(button) {
    window.clearTimeout(hideTimer);
    activeButton = button;
    positionTooltip(button);
  }

  function hideSoon(delay = 80) {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      activeButton = null;
      tooltip?.classList.remove("visible");
    }, delay);
  }

  document.addEventListener("mousemove", (event) => {
    const button = getPlayButtonAt(event.clientX, event.clientY);
    if (button) {
      show(button);
      return;
    }
    if (activeButton) hideSoon();
  });

  document.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    const button = getPlayButtonAt(touch.clientX, touch.clientY);
    if (!button) return;
    show(button);
    hideSoon(1800);
  }, { passive: true });

  window.addEventListener("scroll", () => hideSoon(0), true);
  window.addEventListener("resize", () => {
    if (activeButton?.isConnected && activeButton.disabled) {
      positionTooltip(activeButton);
    } else {
      hideSoon(0);
    }
  });
})();
