// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeRainLayer from "../../app/components/HomeRainLayer";

function mockMatchMedia(matches = false) {
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

describe("HomeRainLayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("spawns individual rain drops with randomized motion variables", () => {
    const { container } = render(<HomeRainLayer />);

    expect(container.querySelector(".home-rain-layer")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    const drops = [...container.querySelectorAll(".home-rain-drop")];
    expect(drops.length).toBeGreaterThanOrEqual(3);
    expect(drops[0].style.getPropertyValue("--rain-x")).toMatch(/vw$/);
    expect(drops[0].style.getPropertyValue("--rain-fall")).toMatch(/vh$/);
    expect(drops[0].style.getPropertyValue("--rain-drift")).toMatch(/rem$/);
    expect(drops[0].style.animationDuration).toMatch(/ms$/);

    const uniquePositions = new Set(drops.map((drop) => drop.style.getPropertyValue("--rain-x")));
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  it("removes each drop after its own falling animation completes", () => {
    const { container } = render(<HomeRainLayer />);

    act(() => {
      vi.advanceTimersByTime(900);
    });

    const firstDrop = container.querySelector(".home-rain-drop");
    expect(firstDrop).not.toBeNull();

    act(() => {
      firstDrop.dispatchEvent(new Event("animationend", { bubbles: true }));
    });

    expect(container.contains(firstDrop)).toBe(false);
  });

  it("does not spawn animated drops when reduced motion is requested", () => {
    mockMatchMedia(true);

    const { container } = render(<HomeRainLayer />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.querySelector(".home-rain-layer")).not.toBeNull();
    expect(container.querySelector(".home-rain-drop")).toBeNull();
  });
});
