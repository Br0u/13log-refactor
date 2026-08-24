// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeAtmosphereLayer from "../../app/components/HomeAtmosphereLayer";

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

describe("HomeAtmosphereLayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("seeds a populated field with shared atmosphere, sakura, and forest-debris variables", () => {
    const { container } = render(<HomeAtmosphereLayer />);
    const layer = container.querySelector(".home-atmosphere-layer");
    const particles = [...container.querySelectorAll(".home-atmosphere-particle")];

    expect(layer).not.toBeNull();
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.dataset.atmosphereState).toBe("running");
    expect(particles.length).toBeGreaterThanOrEqual(40);

    const particle = particles[0];
    expect(particle.style.getPropertyValue("--particle-x")).toMatch(/vw$/);
    expect(particle.style.getPropertyValue("--particle-fall")).toMatch(/vh$/);
    expect(particle.style.getPropertyValue("--particle-drift")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--particle-blur")).toMatch(/px$/);

    expect(particle.style.getPropertyValue("--petal-sway-a")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-sway-b")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-sway-c")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-sway-d")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-rotate-a")).toMatch(/deg$/);
    expect(particle.style.getPropertyValue("--petal-rotate-d")).toMatch(/deg$/);
    expect(particle.style.getPropertyValue("--petal-width")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-length")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--petal-duration")).toMatch(/ms$/);
    expect(particle.style.getPropertyValue("--petal-flutter-duration")).toMatch(/ms$/);
    expect(particle.style.getPropertyValue("--petal-opacity")).not.toBe("");
    expect(particle.style.getPropertyValue("--petal-delay")).toMatch(/^-?\d+ms$/);

    expect(particle.style.getPropertyValue("--debris-y")).toMatch(/vh$/);
    expect(particle.style.getPropertyValue("--debris-drift")).toMatch(/vw$/);
    expect(particle.style.getPropertyValue("--debris-lift")).toMatch(/vh$/);
    expect(particle.style.getPropertyValue("--debris-duration")).toMatch(/ms$/);
    expect(particle.style.getPropertyValue("--debris-delay")).toMatch(/^-?\d+ms$/);
    expect(particle.style.getPropertyValue("--debris-angle")).toMatch(/deg$/);
    expect(particle.style.getPropertyValue("--debris-spin")).toMatch(/deg$/);
    expect(particle.style.getPropertyValue("--debris-width")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--debris-length")).toMatch(/rem$/);
    expect(particle.style.getPropertyValue("--debris-opacity")).not.toBe("");

    particles.forEach((item) => {
      const duration = Number.parseFloat(item.style.getPropertyValue("--debris-duration"));
      const lift = Number.parseFloat(item.style.getPropertyValue("--debris-lift"));
      const opacity = Number.parseFloat(item.style.getPropertyValue("--debris-opacity"));

      expect(duration).toBeGreaterThanOrEqual(8000);
      expect(duration).toBeLessThanOrEqual(14000);
      expect(Math.abs(lift)).toBeLessThanOrEqual(8);
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThanOrEqual(0.36);
    });
    expect(particles.some((item) => (
      Number.parseFloat(item.style.getPropertyValue("--debris-lift")) !== 0
    ))).toBe(true);

    const petalDelays = particles.map((item) => (
      Number.parseFloat(item.style.getPropertyValue("--petal-delay"))
    ));
    const debrisDelays = particles.map((item) => (
      Number.parseFloat(item.style.getPropertyValue("--debris-delay"))
    ));
    expect(petalDelays.every((delay) => delay <= 0)).toBe(true);
    expect(petalDelays.some((delay) => delay < 0)).toBe(true);
    expect(debrisDelays.every((delay) => delay <= 0)).toBe(true);
    expect(debrisDelays.some((delay) => delay < 0)).toBe(true);

    const uniquePositions = new Set(
      particles.map((item) => item.style.getPropertyValue("--particle-x")),
    );
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  it("removes each particle after its animation completes", () => {
    const { container } = render(<HomeAtmosphereLayer />);
    const firstParticle = container.querySelector(".home-atmosphere-particle");

    expect(firstParticle).not.toBeNull();
    act(() => {
      firstParticle.dispatchEvent(new Event("animationend", { bubbles: true }));
    });

    expect(container.contains(firstParticle)).toBe(false);
  });

  it("does not spawn animated particles when reduced motion is requested", () => {
    mockMatchMedia(true);

    const { container } = render(<HomeAtmosphereLayer />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.querySelector(".home-atmosphere-layer")).not.toBeNull();
    expect(container.querySelector(".home-atmosphere-particle")).toBeNull();
  });

  it("stops scheduling particles while the document is hidden and resumes when visible", () => {
    const { container } = render(<HomeAtmosphereLayer />);
    const visibleParticleCount = container.querySelectorAll(".home-atmosphere-particle").length;

    expect(visibleParticleCount).toBeGreaterThanOrEqual(40);
    act(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(3000);
    });

    expect(container.querySelectorAll(".home-atmosphere-particle")).toHaveLength(visibleParticleCount);
    expect(container.querySelector(".home-atmosphere-layer")?.dataset.atmosphereState).toBe("paused");

    act(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(900);
    });

    expect(container.querySelectorAll(".home-atmosphere-particle").length).toBeGreaterThan(visibleParticleCount);
    expect(container.querySelector(".home-atmosphere-layer")?.dataset.atmosphereState).toBe("running");
  });
});
