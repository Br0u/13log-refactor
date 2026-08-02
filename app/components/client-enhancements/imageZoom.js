const IMAGE_SELECTOR = [
  ".post-single .post-content .post-figure__image",
  ".post-single .post-content img",
  ".photo-album-image",
  ".post-preview-card__micro-image",
].join(", ");

export function initImageZoom() {
  const boundImages = new Set();
  let observer = null;
  let overlay = null;
  let previousOverflow = "";
  let previousBodyPosition = "";
  let previousBodyTop = "";
  let previousBodyWidth = "";
  let previousBodyLeft = "";
  let previousBodyRight = "";
  let previousBodyPaddingRight = "";
  let previousHtmlScrollBehavior = "";
  let previousBodyScrollBehavior = "";
  let lockedScrollY = 0;
  let lastActiveElement = null;
  let closeTimer = null;
  let scrollRestoreTimer = null;

  function focusWithoutScroll(element) {
    if (!(element instanceof HTMLElement)) return;
    if (element === document.body || element === document.documentElement) return;

    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    previousOverflow = document.documentElement.style.overflow;
    previousBodyPosition = document.body.style.position;
    previousBodyTop = document.body.style.top;
    previousBodyWidth = document.body.style.width;
    previousBodyLeft = document.body.style.left;
    previousBodyRight = document.body.style.right;
    previousBodyPaddingRight = document.body.style.paddingRight;
    previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    previousBodyScrollBehavior = document.body.style.scrollBehavior;

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : previousBodyPaddingRight;
  }

  function unlockPageScroll() {
    document.documentElement.style.overflow = previousOverflow;
    document.body.style.position = previousBodyPosition;
    document.body.style.top = previousBodyTop;
    document.body.style.width = previousBodyWidth;
    document.body.style.left = previousBodyLeft;
    document.body.style.right = previousBodyRight;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }

  function restoreScrollPosition() {
    if (typeof window.scrollTo !== "function") return;

    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";

    const restore = () => {
      try {
        window.scrollTo(0, lockedScrollY);
      } catch {
        // jsdom does not implement window.scrollTo.
      }
    };

    const restoreBehavior = () => {
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
      document.body.style.scrollBehavior = previousBodyScrollBehavior;
    };

    window.clearTimeout(scrollRestoreTimer);
    restore();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(restore);
      requestAnimationFrame(restoreBehavior);
    } else {
      restoreBehavior();
    }
    scrollRestoreTimer = window.setTimeout(() => {
      restore();
      restoreBehavior();
    }, 80);
  }

  function finalizeClose() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    unlockPageScroll();
    focusWithoutScroll(lastActiveElement);
    restoreScrollPosition();
  }

  function closeOverlay() {
    if (!overlay) return;
    document.removeEventListener("keydown", handleEscape);
    overlay.classList.remove("is-visible");
    overlay.classList.add("is-closing");
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(finalizeClose, 240);
  }

  function handleEscape(event) {
    if (event.key === "Escape") {
      closeOverlay();
    }
  }

  function openOverlay(image) {
    closeOverlay();
    lastActiveElement = document.activeElement;
    lockPageScroll();

    overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", image.getAttribute("alt") || "图片预览");

    const dialog = document.createElement("div");
    dialog.className = "image-lightbox__dialog";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "image-lightbox__close";
    closeButton.setAttribute("aria-label", "关闭图片预览");
    closeButton.textContent = "×";

    const previewImage = document.createElement("img");
    previewImage.className = "image-lightbox__image";
    previewImage.src = image.currentSrc || image.getAttribute("src") || "";
    previewImage.alt = image.getAttribute("alt") || "";

    dialog.appendChild(closeButton);
    dialog.appendChild(previewImage);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", closeOverlay);
    dialog.addEventListener("click", (event) => event.stopPropagation());
    closeButton.addEventListener("click", closeOverlay);
    document.addEventListener("keydown", handleEscape);
    requestAnimationFrame(() => {
      overlay?.classList.add("is-visible");
    });
    focusWithoutScroll(closeButton);
  }

  function bindZoomTarget(image) {
    if (!(image instanceof HTMLImageElement)) return;
    if (boundImages.has(image) || image.dataset.imageZoomBound === "true") return;

    boundImages.add(image);
    image.dataset.imageZoomBound = "true";
    if (!image.hasAttribute("tabindex")) {
      image.setAttribute("tabindex", "0");
    }

    const onClick = () => openOverlay(image);
    const onKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openOverlay(image);
      }
    };

    image.addEventListener("click", onClick);
    image.addEventListener("keydown", onKeyDown);
    image.__imageZoomCleanup = () => {
      image.removeEventListener("click", onClick);
      image.removeEventListener("keydown", onKeyDown);
      delete image.dataset.imageZoomBound;
      delete image.__imageZoomCleanup;
    };
  }

  function bindZoomTargets(root = document) {
    if (root instanceof HTMLImageElement && root.matches(IMAGE_SELECTOR)) {
      bindZoomTarget(root);
    }

    if (typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll(IMAGE_SELECTOR).forEach(bindZoomTarget);
  }

  bindZoomTargets();

  if (typeof MutationObserver !== "undefined" && document.body) {
    observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            bindZoomTargets(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    observer?.disconnect();
    boundImages.forEach((image) => {
      image.__imageZoomCleanup?.();
    });
    document.removeEventListener("keydown", handleEscape);
    window.clearTimeout(closeTimer);
    window.clearTimeout(scrollRestoreTimer);
    finalizeClose();
  };
}
