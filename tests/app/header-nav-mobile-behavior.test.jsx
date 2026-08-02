// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts",
}));

vi.mock("next/link", () => ({
  default: function MockLink({ children, href, prefetch: _prefetch, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

import HeaderNav from "../../app/components/HeaderNav";

function setScrollY(value) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
}

function installMatchMedia({ mobile = true, reducedMotion = false } = {}) {
  vi.stubGlobal("matchMedia", vi.fn((query) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : mobile,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

describe("HeaderNav mobile visibility", () => {
  let animationFrames;

  beforeEach(() => {
    installMatchMedia();
    setScrollY(0);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 844,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2400,
    });
    animationFrames = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("fades out while scrolling down and returns while scrolling up", () => {
    const { container } = render(<HeaderNav />);
    const menu = container.querySelector("#menu");
    const scrim = container.querySelector(".mobile-nav-scrim");

    expect(menu?.dataset.mobileNavState).toBe("visible");
    expect(scrim?.dataset.mobileNavState).toBe("visible");

    act(() => {
      setScrollY(220);
      fireEvent.scroll(window);
      animationFrames.shift()?.(0);
    });

    expect(menu?.dataset.mobileNavState).toBe("hidden");
    expect(scrim?.dataset.mobileNavState).toBe("hidden");

    act(() => {
      setScrollY(180);
      fireEvent.scroll(window);
      animationFrames.shift()?.(0);
    });

    expect(menu?.dataset.mobileNavState).toBe("visible");
    expect(scrim?.dataset.mobileNavState).toBe("visible");
  });

  it("keeps the navigation visible for reduced-motion users", () => {
    installMatchMedia({ reducedMotion: true });
    const { container } = render(<HeaderNav />);
    const menu = container.querySelector("#menu");

    act(() => {
      setScrollY(300);
      fireEvent.scroll(window);
      animationFrames.shift()?.(0);
    });

    expect(menu?.dataset.mobileNavState).toBe("visible");
  });

  it("accumulates small scroll steps before changing visibility", () => {
    setScrollY(120);
    const { container } = render(<HeaderNav />);
    const menu = container.querySelector("#menu");

    act(() => {
      for (const nextScrollY of [130, 140, 150]) {
        setScrollY(nextScrollY);
        fireEvent.scroll(window);
        animationFrames.shift()?.(0);
      }
    });

    expect(menu?.dataset.mobileNavState).toBe("hidden");

    act(() => {
      for (const nextScrollY of [144, 138]) {
        setScrollY(nextScrollY);
        fireEvent.scroll(window);
        animationFrames.shift()?.(0);
      }
    });

    expect(menu?.dataset.mobileNavState).toBe("visible");
  });
});
