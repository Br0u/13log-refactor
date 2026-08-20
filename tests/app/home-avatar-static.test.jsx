// @vitest-environment jsdom
import { render } from "@testing-library/react";
import React from "react";
import { expect, it } from "vitest";
import HomeAvatar from "../../app/components/HomeAvatar";

it("renders one non-interactive avatar surface without duplicate images", () => {
  const { container } = render(<HomeAvatar />);
  const avatar = container.querySelector(".profile-avatar");

  expect(avatar?.tagName).toBe("SPAN");
  expect(avatar?.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelectorAll("img")).toHaveLength(0);
  expect(container.querySelector("[tabindex]")).toBeNull();
});
