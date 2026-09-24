// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PixelCat from "../../components/pixel-cat/PixelCat";
import { ACTION_META } from "../../lib/pixel-cat/catalog.mjs";
import { collectCatSurfaces, readCatSurface, pickCatLetter, hideCatLetter } from "../../components/pixel-cat/page-context";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
const rect = (left = 100, top = 300, width = 200, height = 24) => ({ left, top, right: left + width, bottom: top + height, width, height });
let layout;
beforeEach(() => {
  vi.useFakeTimers(); sessionStorage.setItem("13log-cat", "awake"); layout = rect();
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); sessionStorage.clear(); });
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

it("picks one scene from a behavior, lingers, then rests before choosing a different scene", async () => {
  Math.random.mockReturnValue(.99);
  const { container } = render(scene());
  const action = () => container.querySelector(".pixel-cat-layer").dataset.action;
  await advance(16010);
  expect(action()).toBe("magic");
  await advance(8000);
  expect(action()).toBe("magic");
  await advance(9000);
  expect(action()).toBe("idle");
  await advance(45000);
  expect(action()).toBe("idle");
  await advance(20000);
  expect(action()).toBe("astronaut");
  fireEvent.click(screen.getByRole("button", { name: /黑色小猫/ }));
  expect(action()).toBe("idle");
});

it("hides exactly one glyph at paw contact, carries it through the hand poses, and restores it at release", async () => {
  const { container } = render(scene());
  const cat = () => container.querySelector(".pixel-cat-layer");
  await advance(16100);
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
