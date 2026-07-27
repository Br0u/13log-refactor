// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import HomeBackgroundDepth from "../../app/components/HomeBackgroundDepth";

afterEach(() => {
  cleanup();
});

describe("HomeBackgroundDepth", () => {
  it("renders one hidden fallback and three decorative depth layers", () => {
    const { container } = render(<HomeBackgroundDepth />);
    const scene = container.querySelector(".home-depth-background");
    const layers = [...container.querySelectorAll(".home-depth-background__layer")];

    expect(scene).not.toBeNull();
    expect(scene?.getAttribute("aria-hidden")).toBe("true");
    expect(scene?.dataset.parallaxActive).toBe("false");
    expect(layers).toHaveLength(4);
    expect(layers.map((layer) => layer.dataset.depthLayer)).toEqual([
      "fallback",
      "far",
      "middle",
      "front",
    ]);
  });
});
