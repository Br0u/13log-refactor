// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AboutGuestbook from "../../components/about/AboutGuestbook";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AboutGuestbook", () => {
  it("renders a private note form without a public guestbook list", () => {
    render(<AboutGuestbook />);

    expect(screen.queryByRole("heading", { name: "留言板" })).toBeNull();
    expect(screen.getByText("可留一言，藏于此间，仅君与我知。若愿有复，请署一信函之所。")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "内容" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "昵称 / 邮箱" })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows the updated private receipt after submit", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AboutGuestbook />);

    fireEvent.change(screen.getByRole("textbox", { name: "昵称 / 邮箱" }), {
      target: { value: "brou@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "内容" }), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "寄出" }));

    expect(await screen.findByText("信至。")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
