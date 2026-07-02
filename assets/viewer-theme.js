(function () {
  const lightBackground = [0.9647, 0.9765, 0.9922, 1];

  function patchClearColor({ contextPrototype }) {
    const originalClearColor = contextPrototype.clearColor;

    contextPrototype.clearColor = function (red, green, blue, alpha) {
      if (red === 0 && green === 0 && blue === 0) {
        return originalClearColor.call(this, ...lightBackground);
      }

      return originalClearColor.call(this, red, green, blue, alpha);
    };
  }

  function scrollActiveBuildMessage({ behavior }) {
    const activeCard = document.querySelector("#conversation-stream .stream-card.step-active");

    if (activeCard === null) {
      return;
    }

    activeCard.scrollIntoView({ behavior, block: "center", inline: "nearest" });
  }

  function getToolName({ card }) {
    return card.querySelector(".tool-name")?.textContent?.trim().toLowerCase() ?? "";
  }

  function isBuildMutationTool({ card }) {
    const toolName = getToolName({ card });

    if (toolName.length === 0) {
      return false;
    }

    return ![
      "get block details",
      "query blocks",
      "query block",
      "inspect",
      "measure",
    ].includes(toolName);
  }

  function jumpToStep({ zeroBasedStep }) {
    const slider = document.querySelector("#step-slider");

    if (!(slider instanceof HTMLInputElement)) {
      return;
    }

    slider.value = String(zeroBasedStep);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function ensureJumpButton({ card, step }) {
    const bubble = card.querySelector(".bubble");

    if (bubble === null || bubble.querySelector(".jump-btn") !== null) {
      return;
    }

    const button = document.createElement("button");
    button.className = "jump-btn";
    button.type = "button";
    button.dataset.step = String(step - 1);
    button.textContent = `Jump to Step ${step}`;
    button.addEventListener("click", () => {
      jumpToStep({ zeroBasedStep: step - 1 });
    });
    bubble.appendChild(button);
  }

  function assignBuildStepTargets({ streamContainer }) {
    let currentStep = 0;
    const cards = Array.from(streamContainer.querySelectorAll(".stream-card"));
    let pendingMutationStep = null;

    for (const card of cards) {
      if (card.classList.contains("stream-tool-call")) {
        if (isBuildMutationTool({ card })) {
          currentStep += 1;
          pendingMutationStep = currentStep;
          card.dataset.step = String(currentStep);
          ensureJumpButton({ card, step: currentStep });
        } else {
          pendingMutationStep = null;
        }
        continue;
      }

      if (card.classList.contains("stream-tool-feedback") && pendingMutationStep !== null) {
        card.dataset.step = String(pendingMutationStep);
        ensureJumpButton({ card, step: pendingMutationStep });
        pendingMutationStep = null;
      }
    }
  }

  function initializeBuildAutoScroll() {
    const streamContainer = document.querySelector("#conversation-stream");
    const playButton = document.querySelector("#play-btn");

    if (streamContainer === null) {
      return false;
    }

    assignBuildStepTargets({ streamContainer });

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === "childList")) {
        assignBuildStepTargets({ streamContainer });
      }

      const hasActiveStepChange = mutations.some((mutation) => {
        if (mutation.type !== "attributes" || mutation.attributeName !== "class") {
          return false;
        }

        return mutation.target instanceof Element && mutation.target.classList.contains("step-active");
      });

      if (hasActiveStepChange) {
        scrollActiveBuildMessage({ behavior: "smooth" });
      }
    });

    observer.observe(streamContainer, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });

    playButton?.addEventListener("click", () => {
      assignBuildStepTargets({ streamContainer });
      window.setTimeout(() => {
        scrollActiveBuildMessage({ behavior: "smooth" });
      }, 0);
    });

    return true;
  }

  function initializeBuildAutoScrollWhenReady() {
    if (initializeBuildAutoScroll()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (initializeBuildAutoScroll()) {
        observer.disconnect();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  patchClearColor({ contextPrototype: WebGLRenderingContext.prototype });
  patchClearColor({ contextPrototype: WebGL2RenderingContext.prototype });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeBuildAutoScrollWhenReady);
  } else {
    initializeBuildAutoScrollWhenReady();
  }
})();
