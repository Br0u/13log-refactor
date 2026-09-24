// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PixelCat from "../../components/pixel-cat/PixelCat";
import { LIFE_KEY, createLife, beginLife } from "../../lib/pixel-cat/life.mjs";
import { ACTION_META } from "../../lib/pixel-cat/catalog.mjs";
import { collectCatSurfaces, readCatSurface, pickCatLetter, hideCatLetter } from "../../components/pixel-cat/page-context";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
const rect = (left = 100, top = 300, width = 200, height = 24) => ({ left, top, right: left + width, bottom: top + height, width, height });
let layout;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 24, 16, 0)); localStorage.clear(); sessionStorage.setItem("13log-cat", "awake"); layout = rect();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ available: false, proactiveSeconds: 0 }) }));
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("CSS", { highlights: new Map() });
  vi.stubGlobal("Highlight", class { constructor(range) { this.range = range; } });
  vi.spyOn(Math, "random").mockReturnValue(0);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function () {
    if (this.classList.contains("pixel-cat-actor")) {
      const [, x, y] = this.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
      return rect(Number(x), Number(y), 96, 96);
    }
    return layout;
  });
  vi.spyOn(document, "createRange").mockImplementation(() => {
    let start = 0, end = 0;
    return {
      selectNodeContents() {}, setStart(_node, value) { start = value; }, setEnd(_node, value) { end = value; },
      getClientRects: () => [layout, rect(layout.left, layout.top + 28)],
      getBoundingClientRect: () => rect(layout.left + start * 16, layout.top, (end - start) * 16),
    };
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); sessionStorage.clear(); localStorage.clear(); });
const advance = async ms => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const until = async predicate => {
  for (let time = 0; time < 10000 && !predicate(); time += 70) await advance(70);
  expect(predicate()).toBeTruthy();
};
const send = text => {
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
};
const scene = () => <><main id="main-content"><p>公开文字</p></main><PixelCat /></>;

it("spends sustained quiet periods during ten minutes instead of chaining scenes", async () => {
  const { container } = render(scene());
  let restingSeconds = 0;
  const poses = new Set();
  for (let second = 0; second < 600; second += 8) {
    await advance(8000);
    const pose = container.querySelector(".pixel-cat-layer").dataset.action;
    poses.add(pose);
    if (["perch", "read", "lie", "sleep"].includes(pose)) restingSeconds += 8;
  }
  expect(restingSeconds).toBeGreaterThan(300);
  expect(poses.size).toBeGreaterThan(1);
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it("keeps nighttime sleep across reload and responds immediately when called", async () => {
  vi.setSystemTime(new Date(2026, 8, 24, 23, 0));
  const first = render(scene());
  await advance(17000);
  expect(first.container.querySelector(".pixel-cat-layer").dataset.action).toBe("sleep");
  const untilTime = JSON.parse(localStorage.getItem(LIFE_KEY)).activity.until;
  await advance(40000); cleanup();
  const resumed = render(scene()); await advance(10);
  expect(resumed.container.querySelector(".pixel-cat-layer").dataset.action).toBe("sleep");
  expect(JSON.parse(localStorage.getItem(LIFE_KEY)).activity.until).toBe(untilTime);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  expect(resumed.container.querySelector(".pixel-cat-layer").dataset.action).toBe("yawn");
  expect(screen.getByRole("textbox")).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "你在干什么" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(screen.getByRole("status").textContent).toContain("睡觉");
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it("remembers a completed meal after reload without storing page text or replaying it", async () => {
  const first = render(scene());
  send("吃面条"); await advance(13000);
  expect(first.container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
  const saved = JSON.parse(localStorage.getItem(LIFE_KEY));
  expect(saved.lastMeal).toBeGreaterThan(0);
  expect(localStorage.getItem(LIFE_KEY)).not.toContain("公开文字");
  cleanup(); const resumed = render(scene()); await advance(17000);
  expect(resumed.container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
  expect(JSON.parse(localStorage.getItem(LIFE_KEY)).lastMeal).toBe(saved.lastMeal);
});

it("holds a stable resting intention through scrolling and pauses exploration while typing", async () => {
  localStorage.setItem(LIFE_KEY, JSON.stringify(beginLife(createLife(), "read", 180000)));
  const { container } = render(<><main id="main-content"><p>公开文字</p><input aria-label="草稿" /></main><PixelCat /></>);
  const deadline = JSON.parse(localStorage.getItem(LIFE_KEY)).activity.until;
  fireEvent.scroll(window); await advance(15000);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("read");
  expect(JSON.parse(localStorage.getItem(LIFE_KEY)).activity.until).toBe(deadline);
  act(() => screen.getByRole("textbox", { name: "草稿" }).focus());
  const position = container.querySelector(".pixel-cat-actor").style.transform;
  fireEvent.scroll(window); await advance(120000);
  expect(container.querySelector(".pixel-cat-actor").style.transform).toBe(position);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
});

it("includes remembered life facts in chat, while AI cannot take over meals or movement", async () => {
  fetch.mockImplementation(async (_url, options) => ({ ok: true, json: async () => options?.method === "POST"
    ? { say: "刚吃过面，现在陪你。", actions: [{ type: "toast" }, { type: "walk_to", target: "cat-target-0" }] }
    : { available: true, proactiveSeconds: 0 } }));
  const { container } = render(scene()); await advance(1);
  send("吃面条"); await advance(13000);
  send("今天怎么样？"); await advance(1);
  const request = JSON.parse(fetch.mock.calls.find(([, options]) => options?.method === "POST")[1].body);
  expect(request.life).toMatchObject({ hunger: "full", recent: { action: "noodles", completed: true } });
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
  expect(screen.getByRole("status").textContent).toBe("刚吃过面，现在陪你。");
});

it("shares a completed life event once without sending article text", async () => {
  fetch.mockImplementation(async (_url, options) => ({ ok: true, json: async () => options?.method === "POST"
    ? { say: "吃饱啦。", actions: [] } : { available: true, proactiveSeconds: 60 } }));
  render(scene()); await advance(1);
  send("吃面条"); await advance(50000);
  const posts = fetch.mock.calls.filter(([, options]) => options?.method === "POST");
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0][1].body)).toMatchObject({ proactive: true,
    context: { excerpt: "", selection: "", anchors: [] }, life: { recent: { action: "noodles", completed: true } } });
  expect(screen.getByRole("status").textContent).toBe("吃饱啦。");
  fireEvent.click(screen.getByRole("button", { name: "收起聊天" })); await advance(120000);
  expect(fetch.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
});

it("uses rendered public lines and images, excludes private/covered content, and only picks letters beneath the feet", () => {
  const { container } = render(<main id="main-content"><p>公开文字</p><img alt="窗台" /><img alt="" /><form><p>草稿</p></form><p data-cat-private>秘密</p><p contentEditable suppressContentEditableWarning>输入</p><p hidden>隐藏</p><section className="post-interactions"><p>评论</p></section></main>);
  const shelves = collectCatSurfaces();
  expect(shelves.map(item => item.kind)).toEqual(["text", "text", "image"]);
  expect(shelves[1].rect.top).toBe(328);
  const glyph = pickCatLetter(shelves[0], { x: 44, y: 220 });
  expect(glyph.text).toBe("公"); expect(glyph.rect.left).toBe(100);
  expect(pickCatLetter(shelves[0], { x: 500, y: 220 })).toBeNull();
  expect(pickCatLetter(shelves[0], { x: 44, y: 100 })).toBeNull();
  const before = container.innerHTML;
  const release = hideCatLetter(glyph);
  expect(CSS.highlights.get("pixel-cat-held-letter").range).toBe(glyph.range);
  expect(container.innerHTML).toBe(before);
  release(); expect(CSS.highlights.size).toBe(0);
  shelves[0].node.textContent = "新文字"; expect(readCatSurface(shelves[0])).toBeNull();
  shelves[0].node.textContent = shelves[0].text;
  container.querySelector("form").append(shelves[0].node); expect(readCatSurface(shelves[0])).toBeNull();
  const image = shelves[2]; image.element.remove(); expect(readCatSurface(image)).toBeNull();
  Object.defineProperty(document, "elementsFromPoint", { configurable: true, value: () => [document.body] });
  try { expect(collectCatSurfaces()).toEqual([]); }
  finally { delete document.elementsFromPoint; }
});

it("keeps grapheme clusters intact", () => {
  render(<main id="main-content"><p>é</p></main>);
  expect(pickCatLetter(collectCatSurfaces()[0], { x: 52, y: 220 }).text).toBe("é");
});

it("chooses one afternoon scene, lingers, and rests before a different kind of activity", async () => {
  Math.random.mockReturnValue(.99);
  const { container } = render(scene());
  const action = () => container.querySelector(".pixel-cat-layer").dataset.action;
  await advance(16010);
  expect(action()).toBe("snowglobe");
  await advance(8000);
  expect(action()).toBe("snowglobe");
  await advance(9000);
  expect(action()).toBe("idle");
  await advance(45000);
  expect(action()).toBe("idle");
  await advance(20000);
  expect(action()).not.toBe("snowglobe");
  expect(JSON.parse(localStorage.getItem(LIFE_KEY)).recent.at(-1).action).toBe("lick");
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  expect(action()).toBe("idle");
});

it("hides exactly one glyph at paw contact, carries it through the hand poses, and restores it at release", async () => {
  const { container } = render(scene());
  const cat = () => container.querySelector(".pixel-cat-layer");
  send("抓个字");
  await until(() => cat().dataset.action === "letter_reach");
  expect(CSS.highlights.size).toBe(0);
  expect(container.querySelector(".pixel-cat-letter")).toBeNull();
  await until(() => CSS.highlights.size === 1);
  expect(cat().dataset.action).toBe("letter_reach");
  expect(container.querySelector(".pixel-cat-letter").textContent).toBe("文");
  expect(container.querySelector(".pixel-cat-letter").style.transform).toBe("translate(24px, 80px) rotate(0deg)");
  const source = CSS.highlights.get("pixel-cat-held-letter").range.getBoundingClientRect();
  const catRect = container.querySelector(".pixel-cat-actor").getBoundingClientRect();
  expect(catRect.left + 32).toBe(source.left + source.width / 2);
  expect(catRect.top + 80).toBe(source.top);
  expect(container.querySelector("main p").textContent).toBe("公开文字");
  await until(() => cat().dataset.action === "letter_play");
  expect(CSS.highlights.size).toBe(1);
  await until(() => cat().dataset.action === "letter_return");
  expect(CSS.highlights.size).toBe(1);
  await until(() => CSS.highlights.size === 0);
  expect(cat().dataset.action).toBe("letter_return");
  await until(() => cat().dataset.action === "perch");
  expect(container.querySelector(".pixel-cat-letter")).toBeNull();
  expect(fetch.mock.calls.every(([, options]) => options?.method !== "POST")).toBe(true);
});

it("automatically climbs after scrolling, continues through more scroll events, and lands on current content", async () => {
  const { container } = render(scene());
  send("抓个字");
  await until(() => container.querySelector(".pixel-cat-layer").dataset.action === "perch");
  const actor = container.querySelector(".pixel-cat-actor");
  const original = actor.style.transform;
  layout = rect(100, 340); fireEvent.scroll(window); await advance(100);
  expect(actor.style.transform).toBe(original);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("climb_grip");
  await advance(500);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("climb_down");
  expect(actor.style.transform).not.toBe(original);
  layout = rect(100, 380); fireEvent.scroll(window); await advance(100);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("climb_down");
  await until(() => container.querySelector(".pixel-cat-layer").dataset.action === "perch");
  expect(actor.getBoundingClientRect().top).toBe(layout.top - 80);
  container.querySelector("main p").remove();
  await until(() => container.querySelector(".pixel-cat-layer").dataset.action === "sit");
  expect(actor.getBoundingClientRect().bottom).toBe(window.innerHeight);
});

it.each(["scroll", "chat", "unmount"])("restores a held glyph on %s without leaving a missing character", async interruption => {
  const { container, unmount } = render(scene());
  send("抓个字"); await until(() => CSS.highlights.size === 1);
  const position = container.querySelector(".pixel-cat-actor").style.transform;
  if (interruption === "scroll") { layout = rect(100, 100); fireEvent.scroll(window); await advance(100); }
  if (interruption === "chat") fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  if (interruption === "unmount") unmount();
  expect(CSS.highlights.size).toBe(0);
  expect(container.querySelector(".pixel-cat-letter")).toBeNull();
  if (interruption !== "unmount") expect(container.querySelector(".pixel-cat-actor").style.transform).toBe(position);
});

it("cancels pending scroll movement when chat opens", async () => {
  const { container } = render(scene());
  const position = container.querySelector(".pixel-cat-actor").style.transform;
  fireEvent.scroll(window); await advance(100);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  await advance(1800);
  expect(container.querySelector(".pixel-cat-actor").style.transform).toBe(position);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
});

it("moves in grip-and-pull strides for whole sprite cycles and cancels the animation when interrupted", async () => {
  const { container } = render(scene());
  const actor = container.querySelector(".pixel-cat-actor");
  let reject;
  const animation = { finished: new Promise((_, no) => { reject = no; }), cancel: vi.fn(() => reject(new Error("cancelled"))) };
  actor.animate = vi.fn(() => animation);
  fireEvent.scroll(window); await advance(100);
  const grip = actor.querySelector(".pixel-cat-sprite");
  await advance(500);
  const [frames, options] = actor.animate.mock.calls[0];
  const action = container.querySelector(".pixel-cat-layer").dataset.action;
  expect(options.duration % ACTION_META[action].cycle).toBe(0);
  expect(frames.length).toBeGreaterThan(8);
  const y = frames.map(frame => Number(frame.transform.match(/, ([-\d.]+)px/)[1]));
  const steps = y.slice(1).map((value, index) => Math.abs(value - y[index]));
  // A gentle pull must not turn into the old stop-and-lurch motion.
  const average = steps.reduce((sum, value) => sum + value, 0) / steps.length;
  expect(Math.max(...steps)).toBeGreaterThan(Math.min(...steps));
  expect(Math.max(...steps)).toBeLessThanOrEqual(average * 1.5 + 1);
  expect(Math.min(...steps)).toBeGreaterThanOrEqual(average * .4 - 1);
  const x = frames.map(frame => Number(frame.transform.match(/translate\(([-\d.]+)px/)[1]));
  const distance = Math.hypot(x.at(-1) - x[0], y.at(-1) - y[0]);
  expect(distance / (options.duration / ACTION_META[action].cycle)).toBeLessThanOrEqual(80);
  expect(y.every((value, index) => index === 0 || value <= y[index - 1])).toBe(true);
  expect(actor.querySelector(".pixel-cat-sprite")).not.toBe(grip);
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ })); await advance(0);
  expect(animation.cancel).toHaveBeenCalled();
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
});

it("respects quiet and reduced motion", async () => {
  const { container } = render(scene());
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  fireEvent.click(screen.getByRole("button", { name: "安静一会儿" }));
  fireEvent.click(screen.getByRole("button", { name: "收起聊天" }));
  fireEvent.scroll(window);
  await advance(20000);
  expect(container.querySelector(".pixel-cat-layer").dataset.action).toBe("sit");
  cleanup(); matchMedia.mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} });
  const reduced = render(scene()); fireEvent.scroll(window); await advance(24000);
  expect(reduced.container.querySelector(".pixel-cat-layer").dataset.action).toBe("idle");
  expect(CSS.highlights.size).toBe(0);
});
