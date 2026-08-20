// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import * as ClientEnhancementsModule from "../../app/components/ClientEnhancements";

describe("skip link", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("moves keyboard focus to the main content", () => {
    document.body.innerHTML = `
      <a class="skip-link" href="#main-content">跳到主要内容</a>
      <main id="main-content" tabindex="-1">内容</main>
    `;
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));

    const initAnchorSmoothScroll = ClientEnhancementsModule.initAnchorSmoothScroll;
    expect(typeof initAnchorSmoothScroll).toBe("function");
    if (!initAnchorSmoothScroll) return;

    const cleanup = initAnchorSmoothScroll();
    document.querySelector(".skip-link").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(document.activeElement).toBe(document.getElementById("main-content"));
    cleanup();
  });
});
