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
  it("renders a note form without a public guestbook list", () => {
    render(<AboutGuestbook />);

    expect(screen.queryByRole("heading", { name: "留言板" })).toBeNull();
    expect(screen.getByText("留一言，见字如面。若盼回信，请留下邮箱。")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "内容" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "昵称 / 邮箱" })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("announces the receipt after submit", async () => {
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

    expect(await screen.findByText("信已寄出，谢谢你的留言。")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("preserves a failed draft and allows retry after network and server errors", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Network failed"))
      .mockResolvedValueOnce({ok: false}).mockResolvedValueOnce({ok: true});
    vi.stubGlobal("fetch", fetchMock);
    render(<AboutGuestbook />);
    const content = screen.getByRole("textbox", {name: "内容"});
    fireEvent.change(screen.getByRole("textbox", {name: "昵称 / 邮箱"}), {target: {value: "访客"}});
    fireEvent.change(content, {target: {value: "不要丢失这段留言"}});
    for (let attempt = 0; attempt < 2; attempt++) {
      fireEvent.click(screen.getByRole("button", {name: "寄出"}));
      expect(await screen.findByText("未能寄出，内容已保留，请稍后重试。")).toBeTruthy();
      expect(content.value).toBe("不要丢失这段留言");
      expect(screen.getByRole("button", {name: "寄出"}).disabled).toBe(false);
    }
    fireEvent.click(screen.getByRole("button", {name: "寄出"}));
    expect(await screen.findByText("信已寄出，谢谢你的留言。")).toBeTruthy();
    expect(content.value).toBe("");
  });

});
