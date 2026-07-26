// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeAvatarParallax from "../../app/components/HomeAvatarParallax";

let animationFrames;
let nextFrameId;

function mockMatchMedia({ reduced = false, coarse = false, fine = !coarse } = {}) {
  vi.stubGlobal("matchMedia", vi.fn((query) => ({
    matches: query.includes("prefers-reduced-motion")
      ? reduced
      : query.includes("pointer: coarse")
        ? coarse
        : fine,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

function flushAnimationFrames(limit = 120) {
  let count = 0;
  while (animationFrames.size && count < limit) {
    const current = [...animationFrames.entries()];
    animationFrames.clear();
    current.forEach(([, callback]) => callback(performance.now()));
    count += 1;
  }
}

function dispatchOrientation(beta, gamma) {
  const event = new Event("deviceorientation");
  Object.defineProperties(event, {
    beta: { value: beta },
    gamma: { value: gamma },
  });
  window.dispatchEvent(event);
}

function mockRect(scene) {
  scene.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 200,
    height: 200,
    right: 200,
    bottom: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

describe("HomeAvatarParallax", () => {
  beforeEach(() => {
    animationFrames = new Map();
    nextFrameId = 1;
    mockMatchMedia();
    vi.stubGlobal("PointerEvent", class PointerEvent extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        Object.defineProperty(this, "pointerType", {
          value: init.pointerType ?? "",
        });
      }
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      animationFrames.set(id, callback);
      return id;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id) => {
      animationFrames.delete(id);
    }));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the scene, states, and existing three assets", () => {
    const { container } = render(<HomeAvatarParallax />);
    const states = container.querySelectorAll(".profile-avatar-state");
    const sources = new Set(
      [...container.querySelectorAll("img")].map((image) => image.getAttribute("src")),
    );

    expect(container.querySelector(".profile-avatar-card")?.getAttribute("aria-label"))
      .toBe("头像");
    expect(container.querySelector(".profile-avatar-scene")).not.toBeNull();
    expect(states).toHaveLength(3);
    expect(sources).toEqual(new Set([
      "/images/home/avatar-cats-ink.png",
      "/images/home/avatar-cats-ink-hover.png",
      "/images/home/avatar-cats-ink-night.png",
    ]));
  });

  it("maps fine-pointer movement to CSS variables and returns to center", () => {
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerMove(scene, { clientX: 200, clientY: 0, pointerType: "mouse" });
    act(() => flushAnimationFrames());

    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0.98);
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-y"))).toBeLessThan(-0.98);

    fireEvent.pointerLeave(scene, { pointerType: "mouse" });
    act(() => flushAnimationFrames());

    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-x")))).toBeLessThan(0.02);
    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-y")))).toBeLessThan(0.02);
  });

  it("uses permission-free orientation on coarse pointers", () => {
    mockMatchMedia({ coarse: true });
    const requestPermission = vi.fn();
    vi.stubGlobal("DeviceOrientationEvent", { requestPermission });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");

    act(() => {
      dispatchOrientation(40, 5);
      dispatchOrientation(46, 11);
      flushAnimationFrames();
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0);
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-y"))).toBeGreaterThan(0);
  });

  it("uses touch movement when orientation is unavailable and returns on pointer up", () => {
    mockMatchMedia({ coarse: true });
    vi.stubGlobal("DeviceOrientationEvent", undefined);
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerDown(scene, { clientX: 150, clientY: 50, pointerType: "touch" });
    fireEvent.pointerMove(scene, { clientX: 180, clientY: 20, pointerType: "touch" });
    act(() => flushAnimationFrames());

    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0);
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-y"))).toBeLessThan(0);

    fireEvent.pointerUp(scene, { pointerType: "touch" });
    act(() => flushAnimationFrames());

    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-x")))).toBeLessThan(0.02);
    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-y")))).toBeLessThan(0.02);
  });

  it("returns touch input to center when the pointer is cancelled", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerDown(scene, { clientX: 180, clientY: 100, pointerType: "touch" });
    act(() => flushAnimationFrames());
    fireEvent.pointerCancel(scene, { pointerType: "touch" });
    act(() => flushAnimationFrames());

    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-x")))).toBeLessThan(0.02);
  });

  it("ignores invalid orientation fields while preserving touch fallback", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    act(() => {
      dispatchOrientation(null, 5);
      flushAnimationFrames();
    });
    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");

    fireEvent.pointerDown(scene, { clientX: 160, clientY: 100, pointerType: "touch" });
    act(() => flushAnimationFrames());
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0);
  });

  it("rejects mouse input on a coarse-only device", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerMove(scene, { clientX: 200, clientY: 0, pointerType: "mouse" });
    act(() => flushAnimationFrames());

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("stays centered while the page is hidden", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      dispatchOrientation(40, 5);
      dispatchOrientation(46, 11);
      flushAnimationFrames();
    });

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("stays centered while the avatar is outside the viewport", () => {
    let observerCallback;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
    });
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");

    act(() => {
      observerCallback([{ isIntersecting: false }]);
      dispatchOrientation(40, 5);
      dispatchOrientation(46, 11);
      flushAnimationFrames();
    });

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("ignores all motion input when reduced motion is requested", () => {
    mockMatchMedia({ reduced: true, coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerMove(scene, { clientX: 200, clientY: 0, pointerType: "mouse" });
    act(() => {
      dispatchOrientation(20, 5);
      dispatchOrientation(30, 10);
      flushAnimationFrames();
    });

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("removes listeners, cancels a pending frame, and disconnects the observer on unmount", () => {
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      disconnect = disconnect;
    });
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { container, unmount } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    mockRect(scene);

    fireEvent.pointerMove(scene, { clientX: 200, clientY: 0, pointerType: "mouse" });
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("deviceorientation", expect.any(Function));
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
