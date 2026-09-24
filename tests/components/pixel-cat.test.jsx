// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PixelCat from "../../components/pixel-cat/PixelCat";
import CatGallery from "../../components/pixel-cat/CatGallery";
import { ACTION_META, ACTIONS } from "../../lib/pixel-cat/catalog.mjs";
import HomeAvatar from "../../app/components/HomeAvatar";
import { collectPageContext } from "../../components/pixel-cat/page-context";

const route = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));
beforeEach(() => {
  route.path = "/"; sessionStorage.clear(); vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ available: false, proactiveSeconds: 0 }) }));
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", callback => setTimeout(() => callback(Date.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", timer => clearTimeout(timer));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const scene = () => <><a data-cat-logo href="/">13log</a><HomeAvatar /><PixelCat /></>;
const advance = async ms => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

it("summons once, returns through the home door, then stays dismissed after navigation", async () => {
  const { container, rerender } = render(scene());
  fireEvent.click(screen.getByRole("button", { name: "叫小猫出门" }));
  fireEvent.click(screen.getByRole("button", { name: "叫小猫出门" }));
  expect(container.querySelectorAll(".pixel-cat-actor")).toHaveLength(1);
  expect(container.querySelector(".pixel-cat-layer").dataset.phase).toBe("entering");
  await advance(5000);
  expect(container.querySelector(".pixel-cat-layer").dataset.phase).toBe("active");
  const bubble = screen.getByRole("region", { name: "和小猫聊天" });
  expect(bubble.textContent).not.toMatch(/小黑|13LOG|AI 回复|当前为本地陪伴/);
  fireEvent.click(screen.getByRole("button", { name: "回家" }));
  await advance(8000);
  expect(container.querySelector(".pixel-cat-layer")).toBeNull();
  expect(sessionStorage.getItem("13log-cat")).toBe("asleep");
  route.path = "/about"; rerender(scene());
  expect(container.querySelector(".pixel-cat-layer")).toBeNull();
});

it("persists across routes, uses the logo to return, and cancels entrance on admin navigation", async () => {
  const { container, rerender } = render(scene());
  fireEvent.click(screen.getByRole("button", { name: "叫小猫出门" }));
  await advance(5000);
  route.path = "/about"; rerender(scene());
  expect(container.querySelector(".pixel-cat-layer").dataset.phase).toBe("active");
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.click(screen.getByRole("button", { name: "回家" }));
  await advance(2800);
  expect(container.querySelector(".pixel-cat-door")).toBeNull();
  await advance(6000);
  expect(container.querySelector(".pixel-cat-layer")).toBeNull();
  route.path = "/"; rerender(scene());
  fireEvent.click(screen.getByRole("button", { name: "叫小猫出门" }));
  route.path = "/admin/cat"; rerender(scene());
  await advance(7000);
  expect(container.querySelector(".pixel-cat-layer")).toBeNull();
});

it("keeps local companionship usable without AI", async () => {
  sessionStorage.setItem("13log-cat", "awake");
  render(scene()); await advance(10);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "对小猫说" }), { target: { value: "你好" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(screen.getByRole("status").textContent).toContain("我先陪你逛逛");
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it("supports multiline drafts and IME composition without accidental sends", async () => {
  sessionStorage.setItem("13log-cat", "awake");
  render(scene()); await advance(10);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  const input = screen.getByRole("textbox", { name: "对小猫说" });
  expect(input.tagName).toBe("TEXTAREA");
  fireEvent.change(input, { target: { value: "今天\n想聊点什么" } });
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  expect(screen.getByRole("status").textContent).toContain("喵，我出来啦");
  expect(input.value).toBe("今天\n想聊点什么");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input.value).toBe("");
  expect(screen.getByRole("status").textContent).toContain("我先陪你逛逛");
  expect(screen.queryByText("今天\n想聊点什么")).toBeNull();
  expect(screen.getAllByRole("region", { name: "和小猫聊天" })).toHaveLength(1);
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "和小猫聊天" })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /黑色小猫/ }));
});

it("executes a jump command immediately without an AI request", async () => {
  sessionStorage.setItem("13log-cat", "awake");
  const { container } = render(scene()); await advance(10);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "对小猫说" }), { target: { value: "跳一下" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("crouch");
  await advance(450);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("air");
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it.each([["玩手机", "phone"], ["吃面条", "noodles"], ["玩毛线球", "yarn"]])("plays the %s scene locally and returns to idle", async (message, id) => {
  sessionStorage.setItem("13log-cat", "awake");
  const { container } = render(scene()); await advance(10);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "对小猫说" }), { target: { value: message } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe(id);
  await advance(8000);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe(id);
  await advance(ACTION_META[id].duration + ACTION_META[id].cycle * 2 - 8000 + 10);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it("previews the new scenes, steps their frames, and still exposes the original actions", () => {
  const { container } = render(<CatGallery />);
  expect(container.querySelectorAll(".cat-action-grid button")).toHaveLength(24);
  fireEvent.click(screen.getByRole("button", { name: "吃面条 noodles" }));
  const sprite = () => container.querySelector(".cat-stage .pixel-cat-sprite");
  expect(sprite().style.getPropertyValue("--sprite-row")).toBe(String(ACTIONS.findIndex(item => item.id === "noodles")));
  fireEvent.click(screen.getByRole("button", { name: "逐帧查看" }));
  fireEvent.click(screen.getByRole("button", { name: "逐帧查看" }));
  expect(sprite().style.backgroundPositionX).toBe("-192px");
  fireEvent.click(screen.getByRole("button", { name: "全部素材 · 96" }));
  expect(container.querySelectorAll(".cat-action-grid button")).toHaveLength(96);
  expect(screen.getByRole("button", { name: "呼吸 idle" })).toBeTruthy();
});

it("displays streamed speech early, keeps casual context small, and can stop generation", async () => {
  sessionStorage.setItem("13log-cat", "awake");
  const visualViewport = Object.assign(new EventTarget(), { width: 390, height: 844, offsetTop: 0, offsetLeft: 0 });
  vi.stubGlobal("visualViewport", visualViewport);
  let controller, signal;
  fetch.mockImplementation(async (_url, options) => {
    if (options?.method !== "POST") return { ok: true, json: async () => ({ available: true, proactiveSeconds: 0 }) };
    signal = options.signal;
    expect(JSON.parse(options.body).context.excerpt).toBe("");
    return new Response(new ReadableStream({ start(value) { controller = value; signal.addEventListener("abort", () => controller.error(new Error("aborted")), { once: true }); } }), { headers: { "content-type": "text/event-stream" } });
  });
  render(scene()); await advance(10);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "对小猫说" }), { target: { value: "你好" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  await advance(1);
  await act(async () => { controller.enqueue(new TextEncoder().encode('data: {"type":"text","say":"喵，你好"}\n\n')); });
  expect(screen.getByRole("status").textContent).toBe("喵，你好");
  expect(screen.getByRole("button", { name: "停止回答" })).toBeTruthy();
  act(() => { visualViewport.height = 360; visualViewport.offsetTop = 50; visualViewport.dispatchEvent(new Event("resize")); });
  fireEvent.resize(window);
  expect(signal.aborted).toBe(false);
  expect(screen.getByRole("region", { name: "和小猫聊天" }).style.maxHeight).toBe("336px");
  fireEvent.click(screen.getByRole("button", { name: "收起聊天" }));
  await act(async () => { controller.enqueue(new TextEncoder().encode('data: {"type":"text","say":"喵，你好呀"}\n\n')); });
  expect(screen.queryByRole("region", { name: "和小猫聊天" })).toBeNull();
  fireEvent.pointerDown(screen.getByRole("button", { name: /黑色小猫/ }), { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(screen.getByRole("button", { name: /黑色小猫/ }), { pointerId: 1, clientX: 10, clientY: 10 });
  expect(signal.aborted).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.click(screen.getByRole("button", { name: "停止回答" }));
  await advance(1);
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole("status").textContent).toBe("喵，你好呀");
  expect(screen.queryByRole("button", { name: "停止回答" })).toBeNull();
});

it("cancels a doorway transition when scrolling moves its anchor", async () => {
  const { container } = render(scene());
  fireEvent.click(screen.getByRole("button", { name: "叫小猫出门" }));
  fireEvent.scroll(window);
  await advance(20);
  expect(container.querySelector(".pixel-cat-door")).toBeNull();
  expect(container.querySelector(".pixel-cat-layer").dataset.phase).toBe("active");
  await advance(5000);
  expect(container.querySelector(".pixel-cat-door")).toBeNull();
});

it("only collects public reading content and excludes forms and comments", () => {
  render(<main id="main-content"><h1>Public title</h1><p>Public body</p><form>private draft<input defaultValue="secret" /></form><section className="post-interactions">visitor comment</section><div data-cat-private>private section</div></main>);
  const { context } = collectPageContext("/");
  expect(context.excerpt).toContain("Public body");
  expect(context.excerpt).not.toMatch(/secret|private|visitor comment/);
});
