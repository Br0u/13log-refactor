import { describe, expect, it } from "vitest";
import {
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

  it("returns the center for invalid rect geometry", () => {
    expect(pointerToParallax(10, 20, { left: 0, top: 0, width: 0, height: 10 })).toEqual({ x: 0, y: 0 });
    expect(pointerToParallax(10, 20, { left: Number.NaN, top: 0, width: 10, height: 10 })).toEqual({ x: 0, y: 0 });
  });

  it("maps orientation deltas from a baseline and rotates axes for screen angle", () => {
    const baseline = { beta: 10, gamma: 20 };

    expect(orientationToParallax(16, 23, baseline)).toEqual({ x: 0.25, y: 0.5 });
    expect(orientationToParallax(100, -100, baseline)).toEqual({ x: -1, y: 1 });
    expect(orientationToParallax(16, 23, baseline, 90)).toEqual({ x: 0.5, y: -0.25 });
    expect(orientationToParallax(16, 23, baseline, 180)).toEqual({ x: -0.25, y: -0.5 });
    expect(orientationToParallax(16, 23, baseline, 270)).toEqual({ x: -0.5, y: 0.25 });
  });

  it("returns the center for invalid orientation inputs and invalid range", () => {
    const baseline = { beta: 0, gamma: 0 };

    expect(orientationToParallax(null, 0, baseline)).toEqual({ x: 0, y: 0 });
    expect(orientationToParallax(0, Number.NaN, baseline)).toEqual({ x: 0, y: 0 });
    expect(orientationToParallax(0, 0, { beta: Infinity, gamma: 0 })).toEqual({ x: 0, y: 0 });
    expect(orientationToParallax(0, 0, baseline, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(clampUnit(Number.NaN)).toBe(0);
  });

  it("smooths toward the target by the requested amount", () => {
    expect(smoothParallax({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.2)).toEqual({ x: 0.2, y: -0.2 });
  });
});
