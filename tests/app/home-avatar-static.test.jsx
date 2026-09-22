// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { expect, it, vi } from "vitest";
import HomeAvatar from "../../app/components/HomeAvatar";

it("renders one accessible summon button without duplicate images", () => {
  const { container } = render(<HomeAvatar />);
  const avatar = container.querySelector(".profile-avatar");

  expect(avatar?.tagName).toBe("BUTTON");
  expect(avatar?.getAttribute("aria-label")).toBe("叫小猫出门");
  expect(container.querySelectorAll("img")).toHaveLength(0);
  const summoned = vi.fn();
  window.addEventListener("pixel-cat:summon", summoned);
  fireEvent.click(avatar);
  expect(summoned).toHaveBeenCalledTimes(1);
  window.removeEventListener("pixel-cat:summon", summoned);
});
