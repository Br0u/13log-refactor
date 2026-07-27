// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeBackgroundDepth from "../../app/components/HomeBackgroundDepth";

const viewport = { width: 1000, height: 800 };
let animationFrames;
let nextAnimationFrame;
let mediaQueries;
let observers;
let screenOrientation;
let screenOrientationListeners;
let hidden = false;
let originalMatchMedia;
let originalPointerEvent;
let originalRequestAnimationFrame;
let originalCancelAnimationFrame;
let originalScreenOrientation;
let originalScreenWidth;
let originalScreenHeight;
let originalHiddenDescriptor;
let originalIntersectionObserver;

class TestPointerEvent extends MouseEvent {
  constructor(type, options = {}) {
    super(type, options);
    Object.defineProperties(this, {
      pointerId: { value: options.pointerId ?? 1 },
      pointerType: { value: options.pointerType ?? "mouse" },
    });
  }
}

class TestIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    observers.push(this);
  }
}

function getMedia(query) {
  if (!mediaQueries.has(query)) {
    const listeners = new Set();
    mediaQueries.set(query, {
      matches: false,
      listeners,
      addEventListener: vi.fn((type, listener) => type === "change" && listeners.add(listener)),
      removeEventListener: vi.fn((type, listener) => type === "change" && listeners.delete(listener)),
      addListener: vi.fn((listener) => listeners.add(listener)),
      removeListener: vi.fn((listener) => listeners.delete(listener)),
    });
  }
  return mediaQueries.get(query);
}

function setMedia(query, matches) {
  const media = getMedia(query);
  media.matches = matches;
  media.listeners.forEach((listener) => listener({ matches, media: query }));
}

function flushAnimationFrames(limit = 160) {
  for (let index = 0; index < limit && animationFrames.size; index += 1) {
    const frames = [...animationFrames.values()];
    animationFrames.clear();
    frames.forEach((callback) => callback(index));
  }
}

function flushNextAnimationFrame() {
  const nextFrame = animationFrames.entries().next().value;
  if (!nextFrame) {
    return;
  }
  const [id, callback] = nextFrame;
  animationFrames.delete(id);
  callback(0);
}

function dispatchPointer(clientX, clientY, pointerType = "mouse") {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX,
        clientY,
        pointerId: 1,
        pointerType,
      }),
    );
  });
}

function dispatchOrientation(beta, gamma) {
  const event = new Event("deviceorientation");
  Object.defineProperties(event, {
    beta: { value: beta },
    gamma: { value: gamma },
  });
  act(() => window.dispatchEvent(event));
}

function point(scene) {
  return {
    x: Number(scene.style.getPropertyValue("--home-depth-x")),
    y: Number(scene.style.getPropertyValue("--home-depth-y")),
  };
}

function expectPoint(scene, expected) {
  expect(point(scene).x).toBeCloseTo(expected.x, 4);
  expect(point(scene).y).toBeCloseTo(expected.y, 4);
}

function renderScene() {
  const result = render(<HomeBackgroundDepth />);
  return { ...result, scene: result.container.querySelector(".home-depth-background") };
}

beforeEach(() => {
  animationFrames = new Map();
  nextAnimationFrame = 1;
  mediaQueries = new Map();
  observers = [];
  hidden = false;
  originalMatchMedia = window.matchMedia;
  originalPointerEvent = window.PointerEvent;
  originalRequestAnimationFrame = window.requestAnimationFrame;
  originalCancelAnimationFrame = window.cancelAnimationFrame;
  originalScreenOrientation = window.screen.orientation;
  originalScreenWidth = window.innerWidth;
  originalScreenHeight = window.innerHeight;
  originalHiddenDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
  originalIntersectionObserver = window.IntersectionObserver;

  Object.defineProperty(window, "innerWidth", { configurable: true, value: viewport.width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: viewport.height });
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  window.PointerEvent = TestPointerEvent;
  window.requestAnimationFrame = vi.fn((callback) => {
    const id = nextAnimationFrame++;
    animationFrames.set(id, callback);
    return id;
  });
  window.cancelAnimationFrame = vi.fn((id) => animationFrames.delete(id));
  window.matchMedia = vi.fn((query) => {
    return getMedia(query);
  });
  screenOrientationListeners = new Set();
  screenOrientation = {
    angle: 0,
    addEventListener: vi.fn((type, listener) => type === "change" && screenOrientationListeners.add(listener)),
    removeEventListener: vi.fn((type, listener) => type === "change" && screenOrientationListeners.delete(listener)),
  };
  Object.defineProperty(window.screen, "orientation", { configurable: true, value: screenOrientation });
  window.IntersectionObserver = TestIntersectionObserver;
});

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  window.PointerEvent = originalPointerEvent;
  window.requestAnimationFrame = originalRequestAnimationFrame;
  window.cancelAnimationFrame = originalCancelAnimationFrame;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalScreenWidth });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: originalScreenHeight });
  Object.defineProperty(window.screen, "orientation", { configurable: true, value: originalScreenOrientation });
  window.IntersectionObserver = originalIntersectionObserver;
  if (originalHiddenDescriptor) {
    Object.defineProperty(document, "hidden", originalHiddenDescriptor);
  }
});

describe("HomeBackgroundDepth", () => {
  it("renders one hidden fallback and three decorative depth layers", () => {
    const { container } = render(<HomeBackgroundDepth />);
    const scene = container.querySelector(".home-depth-background");
    const layers = [...container.querySelectorAll(".home-depth-background__layer")];
    const directChildren = scene ? [...scene.children] : [];
    const layerNames = ["fallback", "far", "middle", "front"];

    expect(scene).not.toBeNull();
    expect(scene?.getAttribute("aria-hidden")).toBe("true");
    expect(scene?.dataset.parallaxActive).toBe("false");
    expect(layers).toHaveLength(4);
    expect(layers).toEqual(directChildren);
    expect(layers.map((layer) => layer.dataset.depthLayer)).toEqual(layerNames);
    layers.forEach((layer, index) => {
      expect(layer.classList.contains("home-depth-background__layer")).toBe(true);
      expect(layer.classList.contains(`home-depth-background__layer--${layerNames[index]}`)).toBe(true);
    });
  });

  it("moves to the top-right viewport corner with a fine mouse pointer", () => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();

    dispatchPointer(1000, 0);
    expect(scene.dataset.parallaxActive).toBe("true");
    const activeChanges = [];
    const observer = new MutationObserver((records) => activeChanges.push(...records));
    observer.observe(scene, { attributes: true, attributeFilter: ["data-parallax-active"] });
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 1, y: -1 });
    expect(scene.dataset.parallaxActive).toBe("true");
    expect([...activeChanges, ...observer.takeRecords()]).toHaveLength(0);
    observer.disconnect();
  });

  it.each([
    ["center", 500, 400, { x: 0, y: 0 }],
    ["right", 1000, 400, { x: 1, y: 0 }],
    ["left", 0, 400, { x: -1, y: 0 }],
    ["top", 500, 0, { x: 0, y: -1 }],
    ["bottom", 500, 800, { x: 0, y: 1 }],
  ])("maps fine pointer %s viewport position", (_name, clientX, clientY, expected) => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();

    dispatchPointer(clientX, clientY);
    act(() => flushAnimationFrames());

    expectPoint(scene, expected);
  });

  it("returns smoothly to center after a window blur", () => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    act(() => window.dispatchEvent(new Event("blur")));
    expect(scene.dataset.parallaxActive).toBe("true");
    expect(point(scene).x).toBeGreaterThan(0);
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 0, y: 0 });
    expect(scene.dataset.parallaxActive).toBe("false");
  });

  it("returns smoothly to center after document mouseleave", () => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    act(() => document.dispatchEvent(new MouseEvent("mouseleave")));
    expect(scene.dataset.parallaxActive).toBe("true");
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 0, y: 0 });
    expect(scene.dataset.parallaxActive).toBe("false");
  });

  it("keeps the fallback centered when reduced motion starts enabled", () => {
    setMedia("(prefers-reduced-motion: reduce)", true);
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();

    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 0, y: 0 });
    expect(scene.dataset.parallaxActive).toBe("false");
  });

  it("does not attach mouse movement on a coarse-only device", () => {
    setMedia("(pointer: coarse)", true);
    const addEventListener = vi.spyOn(window, "addEventListener");
    const { scene } = renderScene();

    expect(addEventListener.mock.calls.some(([type]) => type === "pointermove")).toBe(false);
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 0, y: 0 });
    addEventListener.mockRestore();
  });

  it("updates pointer input as media capabilities change", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { scene } = renderScene();

    setMedia("(pointer: fine)", true);
    expect(addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function), {
      passive: true,
    });
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 1, y: -1 });

    setMedia("(prefers-reduced-motion: reduce)", true);
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
    dispatchPointer(0, 800);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0, y: 0 });
    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("recenters and swaps listeners when fine input changes to coarse", () => {
    setMedia("(pointer: fine)", true);
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { scene } = renderScene();
    const pointerRegistration = addEventListener.mock.calls.find(([type]) => type === "pointermove");

    expect(pointerRegistration?.[2]).toEqual({ passive: true });
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 1, y: -1 });

    setMedia("(pointer: coarse)", true);
    setMedia("(pointer: fine)", false);

    expectPoint(scene, { x: 0, y: 0 });
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", pointerRegistration[1]);
    expect(addEventListener.mock.calls.some(([type]) => type === "deviceorientation")).toBe(true);
    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("recenters and swaps listeners when coarse input changes to fine", () => {
    setMedia("(pointer: coarse)", true);
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { scene } = renderScene();
    const orientationRegistration = addEventListener.mock.calls.find(
      ([type]) => type === "deviceorientation",
    );
    dispatchOrientation(10, 5);
    dispatchOrientation(16, 11);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0.5, y: 0.5 });

    setMedia("(pointer: fine)", true);

    expectPoint(scene, { x: 0, y: 0 });
    expect(removeEventListener).toHaveBeenCalledWith(
      "deviceorientation",
      orientationRegistration[1],
    );
    expect(addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function), {
      passive: true,
    });
    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("recenters and detaches movement when fine input changes to none", () => {
    setMedia("(pointer: fine)", true);
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { scene } = renderScene();
    const pointerRegistration = addEventListener.mock.calls.find(([type]) => type === "pointermove");
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    setMedia("(pointer: fine)", false);

    expectPoint(scene, { x: 0, y: 0 });
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", pointerRegistration[1]);
    expect(addEventListener.mock.calls.filter(([type]) => type === "deviceorientation")).toHaveLength(
      0,
    );
    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("coalesces pointer bursts and ignores repeated settled input until an animation frame", () => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();
    const setProperty = vi.spyOn(scene.style, "setProperty");

    dispatchPointer(900, 100);
    dispatchPointer(1000, 0);
    dispatchPointer(1000, 0);

    expect(setProperty).not.toHaveBeenCalled();
    expect(animationFrames.size).toBe(1);
    act(() => flushNextAnimationFrame());
    expect(setProperty).toHaveBeenCalledTimes(2);
    expect(animationFrames.size).toBe(1);
    act(() => flushAnimationFrames());

    setProperty.mockClear();
    dispatchPointer(1000, 0);
    expect(setProperty).not.toHaveBeenCalled();
    expect(animationFrames.size).toBe(0);
    setProperty.mockRestore();
  });

  it("stays centered and static when matchMedia is unavailable", () => {
    window.matchMedia = undefined;

    const { scene } = renderScene();
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());

    expectPoint(scene, { x: 0, y: 0 });
    expect(scene.dataset.parallaxActive).toBe("false");
    expect(animationFrames.size).toBe(0);
  });

  it("calibrates then maps coarse-only device orientation", () => {
    setMedia("(pointer: coarse)", true);
    const { scene } = renderScene();

    dispatchOrientation(10, 5);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0, y: 0 });

    dispatchOrientation(16, 11);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0.5, y: 0.5 });
  });

  it("recenters invalid orientation and screen rotation until it recalibrates", () => {
    setMedia("(pointer: coarse)", true);
    const { scene } = renderScene();
    dispatchOrientation(10, 5);
    dispatchOrientation(16, 11);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0.5, y: 0.5 });

    dispatchOrientation(null, 11);
    expectPoint(scene, { x: 0, y: 0 });
    dispatchOrientation(16, 11);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0, y: 0 });

    dispatchOrientation(22, 17);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 0.5, y: 0.5 });
    act(() => screenOrientationListeners.forEach((listener) => listener(new Event("change"))));
    expectPoint(scene, { x: 0, y: 0 });
  });

  it("immediately recenters when the component stops intersecting and disconnects on unmount", () => {
    setMedia("(pointer: fine)", true);
    const { scene, unmount } = renderScene();
    dispatchPointer(1000, 0);
    act(() => flushAnimationFrames());
    expectPoint(scene, { x: 1, y: -1 });

    act(() => observers[0].callback([{ isIntersecting: false }]));
    expectPoint(scene, { x: 0, y: 0 });
    unmount();
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
  });

  it("cancels pending animation frames and recenters while the page is hidden", () => {
    setMedia("(pointer: fine)", true);
    const { scene } = renderScene();
    dispatchPointer(1000, 0);
    expect(animationFrames.size).toBeGreaterThan(0);

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(animationFrames.size).toBe(0);
    expectPoint(scene, { x: 0, y: 0 });
  });

  it("removes every runtime listener and observer on unmount", () => {
    setMedia("(pointer: coarse)", true);
    const addWindowListener = vi.spyOn(window, "addEventListener");
    const removeWindowListener = vi.spyOn(window, "removeEventListener");
    const removeDocumentListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderScene();
    const orientationRegistration = addWindowListener.mock.calls.find(
      ([type]) => type === "deviceorientation",
    );

    unmount();

    expect(removeWindowListener).toHaveBeenCalledWith("blur", expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith(
      "deviceorientation",
      orientationRegistration[1],
    );
    expect(removeDocumentListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));
    expect(removeDocumentListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(screenOrientation.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    [...mediaQueries.values()].forEach((media) => {
      expect(media.listeners.size).toBe(0);
    });
    addWindowListener.mockRestore();
    removeWindowListener.mockRestore();
    removeDocumentListener.mockRestore();
  });
});
