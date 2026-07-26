import { describe, expect, it } from "vitest";
import {
  PARALLAX_CENTER,
  clampUnit,
  orientationToParallax,
  pointerToParallax,
  smoothParallax,
} from "../../app/components/home-avatar-parallax";

describe("home avatar parallax math", () => {
  it("maps pointer positions relative to a rect center and clamps outside its bounds", () => {
    const rect = { left: 10, top: 20, width: 100, height: 80 };

    expect(pointerToParallax(60, 60, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerToParallax(300, -100, rect)).toEqual({ x: 1, y: -1 });
  });

  it("returns a fresh center for invalid pointer inputs and rect geometry", () => {
    const validRect = { left: 0, top: 0, width: 10, height: 10 };
    const invalidCases = [
      [Number.NaN, 5, validRect],
      [5, Infinity, validRect],
      [5, 5, { ...validRect, left: Number.NaN }],
      [5, 5, { ...validRect, top: Infinity }],
      [5, 5, { ...validRect, width: Number.NaN }],
      [5, 5, { ...validRect, height: Infinity }],
      [5, 5, { ...validRect, width: 0 }],
      [5, 5, { ...validRect, width: -1 }],
      [5, 5, { ...validRect, height: 0 }],
      [5, 5, { ...validRect, height: -1 }],
    ] as const;

    for (const [clientX, clientY, rect] of invalidCases) {
      const result = pointerToParallax(clientX, clientY, rect);
      expect(result).toEqual({ x: 0, y: 0 });
      expect(result).not.toBe(PARALLAX_CENTER);
    }
  });

  it("maps orientation deltas from a baseline and rotates axes for screen angle", () => {
    const baseline = { beta: 10, gamma: 20 };

    expect(orientationToParallax(16, 23, baseline)).toEqual({ x: 0.25, y: 0.5 });
    expect(orientationToParallax(100, -100, baseline)).toEqual({ x: -1, y: 1 });
    expect(orientationToParallax(16, 23, baseline, 90)).toEqual({ x: 0.5, y: -0.25 });
    expect(orientationToParallax(16, 23, baseline, 180)).toEqual({ x: -0.25, y: -0.5 });
    expect(orientationToParallax(16, 23, baseline, 270)).toEqual({ x: -0.5, y: 0.25 });
    expect(orientationToParallax(16, 23, baseline, -90)).toEqual({ x: -0.5, y: 0.25 });
    expect(orientationToParallax(16, 23, baseline, 450)).toEqual({ x: 0.5, y: -0.25 });
  });

  it("returns a fresh center for invalid orientation inputs and invalid range", () => {
    const baseline = { beta: 0, gamma: 0 };
    const invalidCases = [
      [null, 0, baseline, 12],
      [0, null, baseline, 12],
      [Number.NaN, 0, baseline, 12],
      [0, Infinity, baseline, 12],
      [0, 0, { beta: Number.NaN, gamma: 0 }, 12],
      [0, 0, { beta: 0, gamma: -Infinity }, 12],
      [0, 0, baseline, Number.NaN],
      [0, 0, baseline, Infinity],
      [0, 0, baseline, 0],
      [0, 0, baseline, -1],
    ] as const;

    for (const [beta, gamma, orientationBaseline, range] of invalidCases) {
      const result = orientationToParallax(beta, gamma, orientationBaseline, 0, range);
      expect(result).toEqual({ x: 0, y: 0 });
      expect(result).not.toBe(PARALLAX_CENTER);
    }
    const invalidAngleResult = orientationToParallax(0, 0, baseline, Number.NaN);
    expect(invalidAngleResult).toEqual({ x: 0, y: 0 });
    expect(invalidAngleResult).not.toBe(PARALLAX_CENTER);
    expect(clampUnit(Number.NaN)).toBe(0);
  });

  it("smooths toward the target with finite values and a clamped amount", () => {
    expect(smoothParallax({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.2)).toEqual({ x: 0.2, y: -0.2 });
    expect(smoothParallax({ x: 0.25, y: -0.25 }, { x: 1, y: -1 }, -1)).toEqual({ x: 0.25, y: -0.25 });
    expect(smoothParallax({ x: 0.25, y: -0.25 }, { x: 1, y: -1 }, 2)).toEqual({ x: 1, y: -1 });
  });

  it("normalizes non-finite smoothing values without emitting NaN", () => {
    expect(smoothParallax({ x: 0, y: 0 }, { x: 1, y: -1 }, Number.NaN)).toEqual({ x: 0.18, y: -0.18 });
    expect(smoothParallax({ x: Number.NaN, y: Infinity }, { x: 1, y: -1 }, 0.2)).toEqual({ x: 0.2, y: -0.2 });
    expect(smoothParallax({ x: 1, y: -1 }, { x: Number.NaN, y: -Infinity }, 0.2)).toEqual({ x: 0.8, y: -0.8 });
  });
});
