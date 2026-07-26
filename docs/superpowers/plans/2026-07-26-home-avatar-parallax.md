# Homepage Avatar 2.5D Parallax Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's static avatar image stack with a lightweight, accessible 2.5D parallax scene that preserves the existing day, hover, and night artwork.

**Architecture:** Keep `app/page.js` as a server component and move only avatar interaction into a focused client component. Normalize pointer and orientation inputs through pure math helpers, write motion values directly to CSS custom properties inside `requestAnimationFrame`, and let CSS masks, theme selectors, and media queries control rendering and degradation.

**Tech Stack:** Next.js 15, React 19, TypeScript utility functions, CSS masks/transforms, Vitest, Testing Library, browser-based visual verification.

**Execution workspace:** `/Users/brou/Documents/Project/13log/.worktrees/home-avatar-parallax` on branch `brou/home-avatar-parallax`.

**Design reference:** `docs/superpowers/specs/2026-07-26-home-avatar-parallax-design.md`

---

## File map

- Create `app/components/home-avatar-parallax.ts`: pure, framework-independent input normalization and smoothing.
- Create `app/components/HomeAvatarParallax.tsx`: type-checked avatar markup, pointer/orientation event lifecycle, animation-frame scheduling.
- Create `tests/app/home-avatar-parallax-math.test.ts`: unit coverage for all pure calculations.
- Create `tests/app/home-avatar-parallax.test.jsx`: component rendering, input behavior, permission-free orientation handling, cleanup, and reduced-motion coverage.
- Modify `app/page.js`: mount the client avatar component without converting the page to a client component.
- Modify `app/papermod-custom.css`: layered masks, parallax transforms, day/hover/night visibility, mobile idle motion, and reduced-motion fallback.
- Modify `tests/app/home-page-rain-overlay.test.js`: assert the new component boundary and retained source assets.
- Modify `tests/app/home-page-hero-styles.test.js`: assert the new layered visual contract.
- Modify `tests/components/mobile-surface-styles.test.js`: retain current avatar sizing and verify mobile motion fallback rules.

## Chunk 1: Input model and client runtime

### Task 1: Add deterministic parallax math

**Files:**
- Create: `app/components/home-avatar-parallax.ts`
- Create: `tests/app/home-avatar-parallax-math.test.ts`

- [ ] **Step 1: Write the failing math tests**

Create `tests/app/home-avatar-parallax-math.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  clampUnit,
  orientationToParallax,
  pointerToParallax,
  smoothParallax,
} from "../../app/components/home-avatar-parallax";

describe("homepage avatar parallax math", () => {
  it("maps the avatar center to zero and clamps positions outside its bounds", () => {
    const rect = { left: 10, top: 20, width: 200, height: 100 };

    expect(pointerToParallax(110, 70, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerToParallax(400, -100, rect)).toEqual({ x: 1, y: -1 });
  });

  it("returns a neutral point for unusable pointer geometry", () => {
    expect(pointerToParallax(10, 10, { left: 0, top: 0, width: 0, height: 0 }))
      .toEqual({ x: 0, y: 0 });
  });

  it("normalizes orientation relative to the first valid posture", () => {
    const baseline = { beta: 40, gamma: 5 };

    expect(orientationToParallax(46, 11, baseline, 0, 12)).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(orientationToParallax(80, -40, baseline, 0, 12)).toEqual({
      x: -1,
      y: 1,
    });
  });

  it("rotates relative axes when the screen is in landscape", () => {
    const baseline = { beta: 20, gamma: 10 };

    expect(orientationToParallax(26, 16, baseline, 90, 12)).toEqual({
      x: 0.5,
      y: -0.5,
    });
    expect(orientationToParallax(26, 16, baseline, 180, 12)).toEqual({
      x: -0.5,
      y: -0.5,
    });
    expect(orientationToParallax(26, 16, baseline, 270, 12)).toEqual({
      x: -0.5,
      y: 0.5,
    });
  });

  it("rejects non-finite values and eases toward a target", () => {
    expect(clampUnit(Number.NaN)).toBe(0);
    expect(pointerToParallax(
      Number.NaN,
      2,
      { left: 0, top: 0, width: 10, height: 10 },
    )).toEqual({ x: 0, y: 0 });
    expect(orientationToParallax(null, 2, { beta: 0, gamma: 0 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(orientationToParallax(1, 2, { beta: Number.NaN, gamma: 0 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(orientationToParallax(1, 2, { beta: 0, gamma: 0 }, 0, 0)).toEqual({
      x: 0,
      y: 0,
    });
    expect(smoothParallax({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.2)).toEqual({
      x: 0.2,
      y: -0.2,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify the RED state**

Run:

```bash
npx vitest run tests/app/home-avatar-parallax-math.test.ts
```

Expected: FAIL because `app/components/home-avatar-parallax.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Create `app/components/home-avatar-parallax.ts`:

```ts
export type ParallaxPoint = {
  x: number;
  y: number;
};

export type OrientationBaseline = {
  beta: number;
  gamma: number;
};

type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const PARALLAX_CENTER: ParallaxPoint = Object.freeze({ x: 0, y: 0 });

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

export function pointerToParallax(
  clientX: number,
  clientY: number,
  rect: RectLike,
): ParallaxPoint {
  if (
    !Number.isFinite(clientX)
    || !Number.isFinite(clientY)
    || !Number.isFinite(rect.width)
    || !Number.isFinite(rect.height)
    || rect.width <= 0
    || rect.height <= 0
  ) {
    return { ...PARALLAX_CENTER };
  }

  return {
    x: clampUnit(((clientX - rect.left) / rect.width) * 2 - 1),
    y: clampUnit(((clientY - rect.top) / rect.height) * 2 - 1),
  };
}

export function orientationToParallax(
  beta: number | null,
  gamma: number | null,
  baseline: OrientationBaseline,
  screenAngle = 0,
  range = 12,
): ParallaxPoint {
  if (
    !Number.isFinite(beta)
    || !Number.isFinite(gamma)
    || !Number.isFinite(baseline.beta)
    || !Number.isFinite(baseline.gamma)
    || !Number.isFinite(range)
    || range <= 0
  ) {
    return { ...PARALLAX_CENTER };
  }

  const horizontal = ((gamma as number) - baseline.gamma) / range;
  const vertical = ((beta as number) - baseline.beta) / range;
  const angle = ((screenAngle % 360) + 360) % 360;

  if (angle === 90) {
    return { x: clampUnit(vertical), y: clampUnit(-horizontal) };
  }
  if (angle === 180) {
    return { x: clampUnit(-horizontal), y: clampUnit(-vertical) };
  }
  if (angle === 270) {
    return { x: clampUnit(-vertical), y: clampUnit(horizontal) };
  }

  return { x: clampUnit(horizontal), y: clampUnit(vertical) };
}

export function smoothParallax(
  current: ParallaxPoint,
  target: ParallaxPoint,
  amount = 0.18,
): ParallaxPoint {
  const factor = Math.max(0, Math.min(1, amount));
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run tests/app/home-avatar-parallax-math.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the math boundary**

```bash
git add app/components/home-avatar-parallax.ts tests/app/home-avatar-parallax-math.test.ts
git commit -m "test: define homepage avatar parallax math"
```

### Task 2: Build the client interaction component

**Files:**
- Create: `app/components/HomeAvatarParallax.tsx`
- Create: `tests/app/home-avatar-parallax.test.jsx`

- [ ] **Step 1: Write failing component tests**

Create `tests/app/home-avatar-parallax.test.jsx` with deterministic media-query and animation-frame helpers:

```jsx
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

describe("HomeAvatarParallax", () => {
  beforeEach(() => {
    animationFrames = new Map();
    nextFrameId = 1;
    mockMatchMedia();
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

  it("renders day, hover, and night states from the existing three assets", () => {
    const { container } = render(<HomeAvatarParallax />);
    const states = container.querySelectorAll(".profile-avatar-state");
    const sources = new Set(
      [...container.querySelectorAll("img")].map((image) => image.getAttribute("src")),
    );

    expect(states).toHaveLength(3);
    expect(sources).toEqual(new Set([
      "/images/home/avatar-cats-ink.png",
      "/images/home/avatar-cats-ink-hover.png",
      "/images/home/avatar-cats-ink-night.png",
    ]));
    expect(container.querySelector(".profile-avatar-card")?.getAttribute("aria-label"))
      .toBe("头像");
  });

  it("maps pointer movement to CSS variables and returns to center", () => {
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
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

    fireEvent.pointerMove(scene, {
      clientX: 200,
      clientY: 0,
      pointerType: "mouse",
    });
    act(() => flushAnimationFrames());

    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0.98);
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-y"))).toBeLessThan(-0.98);

    fireEvent.pointerLeave(scene, { pointerType: "mouse" });
    act(() => flushAnimationFrames());

    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-x")))).toBeLessThan(0.02);
    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-y")))).toBeLessThan(0.02);
  });

  it("uses passive orientation events on coarse pointers without requesting permission", () => {
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

  it("uses touch movement when orientation data is unavailable and returns on pointer up", () => {
    mockMatchMedia({ coarse: true });
    vi.stubGlobal("DeviceOrientationEvent", undefined);
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    scene.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    });

    fireEvent.pointerDown(scene, {
      clientX: 150,
      clientY: 50,
      pointerType: "touch",
    });
    fireEvent.pointerMove(scene, {
      clientX: 180,
      clientY: 20,
      pointerType: "touch",
    });
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
    scene.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    });

    fireEvent.pointerDown(scene, {
      clientX: 180,
      clientY: 100,
      pointerType: "touch",
    });
    act(() => flushAnimationFrames());
    fireEvent.pointerCancel(scene, { pointerType: "touch" });
    act(() => flushAnimationFrames());

    expect(Math.abs(Number(scene.style.getPropertyValue("--avatar-parallax-x")))).toBeLessThan(0.02);
  });

  it("ignores invalid orientation fields and keeps touch fallback available", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    scene.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    });

    act(() => {
      dispatchOrientation(null, 5);
      flushAnimationFrames();
    });
    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");

    fireEvent.pointerDown(scene, {
      clientX: 160,
      clientY: 100,
      pointerType: "touch",
    });
    act(() => flushAnimationFrames());
    expect(Number(scene.style.getPropertyValue("--avatar-parallax-x"))).toBeGreaterThan(0);
  });

  it("does not use mouse input on a coarse-only device", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");
    scene.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    });

    fireEvent.pointerMove(scene, {
      clientX: 200,
      clientY: 0,
      pointerType: "mouse",
    });
    act(() => flushAnimationFrames());

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("stays centered while the page is hidden", () => {
    mockMatchMedia({ coarse: true });
    const { container } = render(<HomeAvatarParallax />);
    const scene = container.querySelector(".profile-avatar-scene");

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
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
    scene.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
    });

    fireEvent.pointerMove(scene, {
      clientX: 200,
      clientY: 0,
      pointerType: "mouse",
    });
    act(() => {
      dispatchOrientation(20, 5);
      dispatchOrientation(30, 10);
      flushAnimationFrames();
    });

    expect(scene.style.getPropertyValue("--avatar-parallax-x")).toBe("0.0000");
    expect(scene.style.getPropertyValue("--avatar-parallax-y")).toBe("0.0000");
  });

  it("removes the device orientation listener on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<HomeAvatarParallax />);

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "deviceorientation",
      expect.any(Function),
    );
  });
});
```

- [ ] **Step 2: Run the test and verify the RED state**

Run:

```bash
npx vitest run tests/app/home-avatar-parallax.test.jsx
```

Expected: FAIL because `HomeAvatarParallax.tsx` does not exist.

- [ ] **Step 3: Implement the client component**

Create `app/components/HomeAvatarParallax.tsx`. The implementation must:

```jsx
"use client";

import React from "react";
import { useEffect, useRef } from "react";
import {
  PARALLAX_CENTER,
  orientationToParallax,
  pointerToParallax,
  smoothParallax,
} from "./home-avatar-parallax";
import type {
  OrientationBaseline,
  ParallaxPoint,
} from "./home-avatar-parallax";

type AvatarStateConfig = {
  name: "base" | "hover" | "night";
  src: string;
  width: number;
  height: number;
};

const AVATAR_STATES: AvatarStateConfig[] = [
  {
    name: "base",
    src: "/images/home/avatar-cats-ink.png",
    width: 1536,
    height: 1024,
  },
  {
    name: "hover",
    src: "/images/home/avatar-cats-ink-hover.png",
    width: 1536,
    height: 1024,
  },
  {
    name: "night",
    src: "/images/home/avatar-cats-ink-night.png",
    width: 1254,
    height: 1254,
  },
];

const LAYERS = ["fallback", "background", "middle", "front"] as const;
const EPSILON = 0.002;

function AvatarState({ state }: { state: AvatarStateConfig }) {
  return (
    <div className={`profile-avatar-state profile-avatar-state--${state.name}`}>
      {LAYERS.map((layer) => (
        <img
          alt=""
          aria-hidden="true"
          className={`profile-avatar-layer profile-avatar-layer--${layer}`}
          draggable="false"
          height={state.height}
          key={layer}
          src={state.src}
          width={state.width}
        />
      ))}
    </div>
  );
}

function readScreenAngle() {
  const orientationAngle = window.screen?.orientation?.angle;
  if (Number.isFinite(orientationAngle)) return orientationAngle as number;
  const legacyAngle = (window as Window & { orientation?: number }).orientation;
  return Number.isFinite(legacyAngle) ? legacyAngle as number : 0;
}

export default function HomeAvatarParallax() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const targetRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const orientationBaselineRef = useRef<OrientationBaseline | null>(null);
  const reducedMotionRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const finePointerRef = useRef(false);
  const touchingRef = useRef(false);
  const pageVisibleRef = useRef(true);
  const componentVisibleRef = useRef(true);

  const applyPoint = (point: ParallaxPoint) => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--avatar-parallax-x", point.x.toFixed(4));
    scene.style.setProperty("--avatar-parallax-y", point.y.toFixed(4));
  };

  const animate = () => {
    frameRef.current = null;
    const next = smoothParallax(currentRef.current, targetRef.current, 0.2);
    currentRef.current = next;
    applyPoint(next);

    const distance = Math.max(
      Math.abs(next.x - targetRef.current.x),
      Math.abs(next.y - targetRef.current.y),
    );

    if (distance > EPSILON) {
      frameRef.current = window.requestAnimationFrame(animate);
      return;
    }

    currentRef.current = { ...targetRef.current };
    applyPoint(currentRef.current);
    if (currentRef.current.x === 0 && currentRef.current.y === 0 && sceneRef.current) {
      sceneRef.current.dataset.parallaxActive = "false";
    }
  };

  const queuePoint = (point: ParallaxPoint) => {
    if (
      reducedMotionRef.current
      || !pageVisibleRef.current
      || !componentVisibleRef.current
    ) {
      return;
    }
    targetRef.current = point;
    if (sceneRef.current) sceneRef.current.dataset.parallaxActive = "true";
    if (frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame(animate);
    }
  };

  const resetPoint = (immediate = false) => {
    targetRef.current = { ...PARALLAX_CENTER };
    if (!immediate) {
      queuePoint(targetRef.current);
      return;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    currentRef.current = { ...PARALLAX_CENTER };
    applyPoint(currentRef.current);
    if (sceneRef.current) sceneRef.current.dataset.parallaxActive = "false";
  };

  useEffect(() => {
    const reducedQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const coarseQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)")
      : null;
    const fineQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: fine)")
      : null;

    const syncPreferences = () => {
      reducedMotionRef.current = Boolean(reducedQuery?.matches);
      coarsePointerRef.current = Boolean(coarseQuery?.matches);
      finePointerRef.current = Boolean(fineQuery?.matches);
      if (reducedMotionRef.current) resetPoint(true);
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (
        reducedMotionRef.current
        || !pageVisibleRef.current
        || !componentVisibleRef.current
        || !coarsePointerRef.current
        || touchingRef.current
        || !Number.isFinite(event.beta)
        || !Number.isFinite(event.gamma)
      ) {
        return;
      }

      const beta = event.beta as number;
      const gamma = event.gamma as number;

      if (!orientationBaselineRef.current) {
        orientationBaselineRef.current = {
          beta,
          gamma,
        };
        return;
      }

      queuePoint(orientationToParallax(
        beta,
        gamma,
        orientationBaselineRef.current,
        readScreenAngle(),
      ));
    };

    const onVisibilityChange = () => {
      pageVisibleRef.current = !document.hidden;
      if (!pageVisibleRef.current) resetPoint(true);
    };

    const observer = typeof IntersectionObserver === "function" && sceneRef.current
      ? new IntersectionObserver(([entry]) => {
          componentVisibleRef.current = entry?.isIntersecting ?? true;
          if (!componentVisibleRef.current) resetPoint(true);
        })
      : null;

    pageVisibleRef.current = !document.hidden;
    applyPoint(PARALLAX_CENTER);
    syncPreferences();
    if (sceneRef.current) observer?.observe(sceneRef.current);
    reducedQuery?.addEventListener?.("change", syncPreferences);
    coarseQuery?.addEventListener?.("change", syncPreferences);
    fineQuery?.addEventListener?.("change", syncPreferences);
    window.addEventListener("deviceorientation", onOrientation);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      reducedQuery?.removeEventListener?.("change", syncPreferences);
      coarseQuery?.removeEventListener?.("change", syncPreferences);
      fineQuery?.removeEventListener?.("change", syncPreferences);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      reducedMotionRef.current
      || !pageVisibleRef.current
      || !componentVisibleRef.current
      || (event.pointerType === "mouse" && !finePointerRef.current)
      || (event.pointerType === "touch" && !touchingRef.current)
      || (event.pointerType !== "mouse" && event.pointerType !== "touch")
      || !sceneRef.current
    ) {
      return;
    }
    queuePoint(pointerToParallax(
      event.clientX,
      event.clientY,
      sceneRef.current.getBoundingClientRect(),
    ));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    touchingRef.current = true;
    onPointerMove(event);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    touchingRef.current = false;
    resetPoint();
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") resetPoint();
  };

  return (
    <div className="profile-avatar-card" tabIndex={0} aria-label="头像">
      <div
        aria-hidden="true"
        className="profile-avatar-scene"
        data-parallax-active="false"
        onPointerCancel={onPointerEnd}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        ref={sceneRef}
      >
        <div className="profile-avatar-viewport">
          {AVATAR_STATES.map((state) => (
            <AvatarState key={state.name} state={state} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

Keep event listeners passive by behavior: never call `preventDefault`, never call `DeviceOrientationEvent.requestPermission`, and keep CSS `touch-action: pan-y`.

- [ ] **Step 4: Run component and math tests**

Run:

```bash
npx vitest run tests/app/home-avatar-parallax.test.jsx tests/app/home-avatar-parallax-math.test.ts
```

Expected: 16 tests PASS.

- [ ] **Step 5: Run the type checker**

Run:

```bash
npm run typecheck
```

Expected: PASS. If TypeScript reports `window.orientation` or event-field issues, narrow locally with JSDoc/casts; do not disable checking globally.

- [ ] **Step 6: Commit the client runtime**

```bash
git add app/components/HomeAvatarParallax.tsx tests/app/home-avatar-parallax.test.jsx
git commit -m "feat: add homepage avatar parallax runtime"
```

## Chunk 2: Homepage integration and layered visual states

### Task 3: Mount the client avatar from the server page

**Files:**
- Modify: `app/page.js:1-46`
- Modify: `tests/app/home-page-rain-overlay.test.js:1-44`

- [ ] **Step 1: Update the static markup test first**

In `tests/app/home-page-rain-overlay.test.js`, read both `app/page.js` and `app/components/HomeAvatarParallax.tsx`. Replace assertions for inline image markup with:

```js
expect(source).toContain('import HomeAvatarParallax from "./components/HomeAvatarParallax";');
expect(source).toContain("<HomeAvatarParallax />");
expect(source).not.toContain('className="profile-avatar-card"');

expect(avatarSource).toContain('className="profile-avatar-card"');
expect(avatarSource).toContain('className="profile-avatar-scene"');
expect(avatarSource).toContain("profile-avatar-state--");
expect(avatarSource).toContain('/images/home/avatar-cats-ink.png');
expect(avatarSource).toContain('/images/home/avatar-cats-ink-hover.png');
expect(avatarSource).toContain('/images/home/avatar-cats-ink-night.png');
expect(avatarSource).not.toContain("requestPermission");
```

Keep the existing asset-signature and unrelated homepage-link assertions unchanged.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run tests/app/home-page-rain-overlay.test.js
```

Expected: FAIL because `app/page.js` still contains inline avatar markup.

- [ ] **Step 3: Replace inline markup with the client component**

In `app/page.js`:

```js
import HomeAvatarParallax from "./components/HomeAvatarParallax";
```

Replace lines 19-46 containing `.profile-avatar-card` with:

```jsx
<HomeAvatarParallax />
```

Do not add `"use client"` to `app/page.js`.

- [ ] **Step 4: Verify the page boundary test passes**

Run:

```bash
npx vitest run tests/app/home-page-rain-overlay.test.js
```

Expected: all tests in that file PASS.

- [ ] **Step 5: Commit the page integration**

```bash
git add app/page.js tests/app/home-page-rain-overlay.test.js
git commit -m "refactor: isolate homepage avatar interaction"
```

### Task 4: Replace flat image styles with layered 2.5D masks

**Files:**
- Modify: `app/papermod-custom.css:1007-1126`
- Modify: `app/papermod-custom.css:1458-1468`
- Modify: `tests/app/home-page-hero-styles.test.js:13-48`
- Modify: `tests/components/mobile-surface-styles.test.js:29-35`

- [ ] **Step 1: Write failing style-contract assertions**

Update `tests/app/home-page-hero-styles.test.js` to require:

```js
expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*--avatar-parallax-x:\s*0;[^}]*--avatar-parallax-y:\s*0;/s);
expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*rotateX\(calc\(var\(--avatar-parallax-y\)\s*\*\s*-6deg\)\)[^}]*rotateY\(calc\(var\(--avatar-parallax-x\)\s*\*\s*6deg\)\)/s);
expect(stylesheet).toMatch(/\.profile-avatar-layer--background\s*\{[^}]*mask-image:/s);
expect(stylesheet).toMatch(/\.profile-avatar-layer--middle\s*\{[^}]*var\(--avatar-middle-mask\)/s);
expect(stylesheet).toMatch(/\.profile-avatar-layer--front\s*\{[^}]*var\(--avatar-front-mask\)/s);
expect(stylesheet).toMatch(/\.profile-avatar-state\s*\{[^}]*opacity:\s*0;/s);
expect(stylesheet).toMatch(/\.profile-avatar-state--base\s*\{[^}]*opacity:\s*1;[^}]*--avatar-middle-mask:[^}]*62%\s+58%/s);
expect(stylesheet).toMatch(/\.profile-avatar-state--hover\s*\{[^}]*--avatar-front-mask:[^}]*78%\s+27%/s);
expect(stylesheet).toMatch(/\.profile-avatar-state--night\s*\{[^}]*--avatar-front-mask:[^}]*63%\s+66%/s);
expect(stylesheet).toMatch(/@media\s*\(hover:\s*hover\)\s+and\s+\(pointer:\s*fine\)[\s\S]*\.profile-avatar-card:hover\s+\.profile-avatar-state--base[\s\S]*opacity:\s*0;[\s\S]*\.profile-avatar-card:hover\s+\.profile-avatar-state--hover[\s\S]*opacity:\s*1;/s);
expect(stylesheet).toMatch(/body\.dark\.list:has\(\.profile--rainy-mask\)\s+\.profile-avatar-state--base,[\s\S]*\.profile-avatar-state--hover\s*\{[^}]*opacity:\s*0;[\s\S]*\.profile-avatar-state--night\s*\{[^}]*opacity:\s*1;/s);
expect(stylesheet).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.profile-avatar-layer--fallback[\s\S]*filter:\s*none;/s);
expect(stylesheet).toMatch(/@media\s*\(hover:\s*none\)\s+and\s+\(pointer:\s*coarse\)[\s\S]*\.profile-avatar-scene\[data-parallax-active="false"\][\s\S]*@keyframes\s+profileAvatarBreath/s);
expect(stylesheet).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*\.profile-avatar-scene\s*\{[^}]*width:\s*min\(14\.6rem,\s*70vw\);/s);
```

Remove every assertion tied to the deleted `.profile-avatar-image` rule and its `--base/--hover/--night` variants. Replace the generic image checks with `.profile-avatar-layer` checks for `object-fit`, `pointer-events`, and the mask/transforms above. Keep current sizing, circular crop, no-border, no-shadow, night heading, typography, and both 720px/480px sizing assertions.

Add one mobile assertion in `tests/components/mobile-surface-styles.test.js`:

```js
expect(stylesheet).toMatch(/\.profile-avatar-scene\s*\{[^}]*touch-action:\s*pan-y;/s);
```

- [ ] **Step 2: Run the style tests and verify RED**

Run:

```bash
npx vitest run tests/app/home-page-hero-styles.test.js tests/components/mobile-surface-styles.test.js
```

Expected: FAIL because the new layer classes and motion fallbacks do not exist.

- [ ] **Step 3: Replace the avatar CSS block**

Replace the old `.profile-avatar-image*` rules and hover/night selectors with a single focused block that contains all of the following concrete rules:

```css
.profile-avatar-card {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: -0.22rem;
  outline: none;
  perspective: 48rem;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.profile-avatar-scene {
  --avatar-parallax-x: 0;
  --avatar-parallax-y: 0;
  position: relative;
  width: min(21.5rem, 80vw);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: transparent;
  touch-action: pan-y;
  transform:
    rotateX(calc(var(--avatar-parallax-y) * -6deg))
    rotateY(calc(var(--avatar-parallax-x) * 6deg));
  transform-style: preserve-3d;
  will-change: transform;
}

.profile-avatar-viewport,
.profile-avatar-state,
.profile-avatar-layer {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.profile-avatar-viewport {
  overflow: hidden;
  border-radius: inherit;
}

.profile-avatar-state {
  opacity: 0;
  transition: opacity 0.42s ease;
}

.profile-avatar-state--base {
  opacity: 1;
  --avatar-middle-mask: radial-gradient(ellipse 43% 34% at 62% 58%, #000 46%, rgba(0, 0, 0, 0.94) 58%, transparent 76%);
  --avatar-front-mask: radial-gradient(ellipse 30% 25% at 66% 26%, #000 44%, rgba(0, 0, 0, 0.94) 58%, transparent 76%);
  --avatar-middle-cutout: radial-gradient(ellipse 45% 36% at 62% 58%, transparent 48%, #000 74%);
  --avatar-front-cutout: radial-gradient(ellipse 32% 27% at 66% 26%, transparent 46%, #000 74%);
}

.profile-avatar-state--hover {
  --avatar-middle-mask: radial-gradient(ellipse 45% 35% at 62% 60%, #000 46%, rgba(0, 0, 0, 0.94) 58%, transparent 76%);
  --avatar-front-mask: radial-gradient(ellipse 31% 28% at 78% 27%, #000 44%, rgba(0, 0, 0, 0.94) 58%, transparent 77%);
  --avatar-middle-cutout: radial-gradient(ellipse 47% 37% at 62% 60%, transparent 48%, #000 74%);
  --avatar-front-cutout: radial-gradient(ellipse 33% 30% at 78% 27%, transparent 46%, #000 75%);
}

.profile-avatar-state--night {
  --avatar-middle-mask: radial-gradient(ellipse 46% 38% at 65% 61%, #000 46%, rgba(0, 0, 0, 0.95) 59%, transparent 77%);
  --avatar-front-mask: radial-gradient(ellipse 28% 23% at 63% 66%, #000 43%, rgba(0, 0, 0, 0.95) 58%, transparent 76%);
  --avatar-middle-cutout: radial-gradient(ellipse 48% 40% at 65% 61%, transparent 48%, #000 75%);
  --avatar-front-cutout: radial-gradient(ellipse 30% 25% at 63% 66%, transparent 46%, #000 74%);
}

.profile-avatar-layer {
  object-fit: cover;
  user-select: none;
  pointer-events: none;
  backface-visibility: hidden;
}

.profile-avatar-layer--fallback {
  opacity: 1;
  transform: scale(1.02);
}

.profile-avatar-layer--background,
.profile-avatar-layer--middle,
.profile-avatar-layer--front {
  opacity: 0;
}

@supports ((mask-image: radial-gradient(circle, #000, transparent)) or (-webkit-mask-image: radial-gradient(circle, #000, transparent))) {
  .profile-avatar-layer--fallback {
    filter: blur(0.42rem);
    transform: scale(1.08);
  }

  .profile-avatar-layer--background,
  .profile-avatar-layer--middle,
  .profile-avatar-layer--front {
    opacity: 1;
  }

  .profile-avatar-layer--background {
    -webkit-mask-image: var(--avatar-middle-cutout), var(--avatar-front-cutout);
    -webkit-mask-composite: source-in;
    mask-image: var(--avatar-middle-cutout), var(--avatar-front-cutout);
    mask-composite: intersect;
    transform:
      translate3d(
        calc(var(--avatar-parallax-x) * -2.5px),
        calc(var(--avatar-parallax-y) * -2px),
        0
      )
      scale(1.055);
  }

  .profile-avatar-layer--middle {
    -webkit-mask-image: var(--avatar-middle-mask);
    mask-image: var(--avatar-middle-mask);
    transform:
      translate3d(
        calc(var(--avatar-parallax-x) * 5px),
        calc(var(--avatar-parallax-y) * 4px),
        1rem
      )
      scale(1.035);
  }

  .profile-avatar-layer--front {
    -webkit-mask-image: var(--avatar-front-mask);
    mask-image: var(--avatar-front-mask);
    transform:
      translate3d(
        calc(var(--avatar-parallax-x) * 9px),
        calc(var(--avatar-parallax-y) * 8px),
        2rem
      )
      scale(1.045);
  }
}

@media (hover: hover) and (pointer: fine) {
  .profile-avatar-card:hover,
  .profile-avatar-card:focus-visible {
    transform: translateY(-0.08rem);
  }

  .profile-avatar-card:hover .profile-avatar-state--base,
  .profile-avatar-card:focus-visible .profile-avatar-state--base {
    opacity: 0;
  }

  .profile-avatar-card:hover .profile-avatar-state--hover,
  .profile-avatar-card:focus-visible .profile-avatar-state--hover {
    opacity: 1;
  }
}

body.dark.list:has(.profile--rainy-mask) .profile-avatar-state--base,
body.dark.list:has(.profile--rainy-mask) .profile-avatar-state--hover {
  opacity: 0;
}

body.dark.list:has(.profile--rainy-mask) .profile-avatar-state--night {
  opacity: 1;
}

@media (hover: none) and (pointer: coarse) and (prefers-reduced-motion: no-preference) {
  .profile-avatar-scene[data-parallax-active="false"] .profile-avatar-viewport {
    animation: profileAvatarBreath 5.6s ease-in-out infinite;
  }

  @keyframes profileAvatarBreath {
    0%,
    100% { transform: scale(1); }
    50% { transform: scale(1.004); }
  }
}
```

Preserve the existing `body.dark.list:has(.profile--rainy-mask) .profile-avatar-scene { filter: none; }` rule. Delete old selectors for `.profile-avatar-image--base`, `--hover`, and `--night`.

Inside the existing reduced-motion media query, replace the old image rule with:

```css
.profile-avatar-card,
.profile-avatar-scene,
.profile-avatar-viewport,
.profile-avatar-state,
.profile-avatar-layer {
  animation: none;
  transition: none;
}

.profile-avatar-scene {
  transform: none;
}

.profile-avatar-layer--fallback {
  filter: none;
  transform: none;
}

.profile-avatar-layer--background,
.profile-avatar-layer--middle,
.profile-avatar-layer--front {
  opacity: 0;
}
```

Keep the existing 720px and 480px avatar widths unchanged.

- [ ] **Step 4: Run style, component, and page tests**

Run:

```bash
npx vitest run \
  tests/app/home-page-hero-styles.test.js \
  tests/components/mobile-surface-styles.test.js \
  tests/app/home-avatar-parallax.test.jsx \
  tests/app/home-page-rain-overlay.test.js
```

Expected: all focused tests PASS.

- [ ] **Step 5: Commit the layered visual states**

```bash
git add app/papermod-custom.css tests/app/home-page-hero-styles.test.js tests/components/mobile-surface-styles.test.js
git commit -m "feat: layer homepage avatar depth states"
```

## Chunk 3: Regression and visual acceptance

### Task 5: Run complete engineering verification

**Files:**
- Modify only if a new failure directly traces to the avatar changes.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: at least 95 test files and 477 tests PASS, 0 failures. The clean baseline before implementation was 93 files and 461 tests, and this plan adds 2 files containing 16 tests.

- [ ] **Step 2: Run type checking**

Run:

```bash
npm run typecheck
```

Expected: exit code 0.

- [ ] **Step 3: Run the production build with non-secret local placeholders**

Run:

```bash
DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
SESSION_SECRET=visual-audit-session-secret-32-characters \
RISK_INTERNAL_SECRET=visual-audit-risk-secret-32-characters \
npm run build
```

Expected: Next.js production build completes with exit code 0.

- [ ] **Step 4: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat main...HEAD
```

Expected: no whitespace errors; only the planned avatar files, the TypeScript-extension correction in the approved spec, and this plan document differ from `main`.

### Task 6: Verify real browser behavior

**Files:**
- No source edits unless a browser-observed defect is first captured by a failing regression test.

- [ ] **Step 1: Start the local application**

Run:

```bash
DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
SESSION_SECRET=visual-audit-session-secret-32-characters \
RISK_INTERNAL_SECRET=visual-audit-risk-secret-32-characters \
npm run dev -- -p 3014
```

Expected: Next.js reports the app ready at `http://localhost:3014`.

- [ ] **Step 2: Verify desktop light mode**

Open `http://localhost:3014/` using the Browser skill. Confirm:

- No runtime or hydration errors.
- The avatar remains circular and the original day image is visually intact at rest.
- Moving across the avatar produces a smooth, bounded depth response.
- Hover changes to the existing expression artwork without a hard image jump.
- Leaving the avatar returns smoothly to center.

- [ ] **Step 3: Verify desktop dark mode**

Switch the existing theme control to dark mode. Confirm:

- Only the night state is visible.
- Pointer parallax remains bounded.
- No day/hover layer flashes through during movement.

- [ ] **Step 4: Verify mobile light and dark modes**

Use a mobile viewport around 390×844. Confirm:

- No sensor permission prompt appears.
- Touching and moving within the avatar produces bounded parallax without blocking vertical page scroll.
- Releasing the touch returns the scene to center.
- The idle breathing effect is barely visible and stops during interaction.
- Light and dark states stay within the existing mobile avatar size.
- If browser sensor emulation or a real Android device is available, send permission-free relative orientation data and confirm the scene responds without a prompt. Otherwise report real-device orientation as unverified rather than claiming it passed.

- [ ] **Step 5: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce`. Confirm:

- The avatar remains a sharp static image.
- Pointer, touch, orientation, and idle breathing do not move it.
- Day/hover/night visibility still follows the current theme rules.

- [ ] **Step 6: Stop the local server and record evidence**

Stop only the process started in Step 1. Record the tested viewport/theme combinations in the final execution summary. If screenshots are useful, store them under ignored `.playwright-cli/home-avatar-parallax/`; do not commit generated screenshots.

- [ ] **Step 7: Capture any browser-observed defect in a failing regression test**

Only if browser verification exposed a real defect, add the smallest regression test to the relevant existing avatar test file.

```bash
npx vitest run \
  tests/app/home-avatar-parallax.test.jsx \
  tests/app/home-avatar-parallax-math.test.ts \
  tests/app/home-page-hero-styles.test.js \
  tests/app/home-page-rain-overlay.test.js \
  tests/app/home-page-rain-overlay-styles.test.js \
  tests/components/mobile-surface-styles.test.js
```

Expected: the new regression assertion FAILS for the browser-observed reason. If browser verification found no defect, skip Steps 7-12 and do not create an empty commit.

- [ ] **Step 8: Implement the minimal browser-observed fix**

Modify only the source file directly responsible for the failing regression. Do not broaden the feature.

- [ ] **Step 9: Re-run focused and complete verification after the fix**

Run:

```bash
npx vitest run \
  tests/app/home-avatar-parallax.test.jsx \
  tests/app/home-avatar-parallax-math.test.ts \
  tests/app/home-page-hero-styles.test.js \
  tests/app/home-page-rain-overlay.test.js \
  tests/app/home-page-rain-overlay-styles.test.js \
  tests/components/mobile-surface-styles.test.js
npm test
npm run typecheck
DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid \
SESSION_SECRET=visual-audit-session-secret-32-characters \
RISK_INTERNAL_SECRET=visual-audit-risk-secret-32-characters \
npm run build
```

Expected: focused tests, at least 95 files/478 complete tests after the added browser regression, type checking, and the production build all PASS.

- [ ] **Step 10: Re-run the exact browser scenario after the fix**

Restart the local application with the same Step 1 command, repeat the exact viewport, theme, input, and motion-preference scenario that exposed the defect, and confirm the symptom is gone. Stop only that restarted process afterward.

Expected: both the regression test and the original browser scenario PASS.

- [ ] **Step 11: Inspect and stage only the browser fix**

Run:

```bash
git status --short
git diff --check
git add \
  app/page.js \
  app/components/HomeAvatarParallax.tsx \
  app/components/home-avatar-parallax.ts \
  app/papermod-custom.css \
  tests/app/home-avatar-parallax.test.jsx \
  tests/app/home-avatar-parallax-math.test.ts \
  tests/app/home-page-hero-styles.test.js \
  tests/app/home-page-rain-overlay.test.js \
  tests/app/home-page-rain-overlay-styles.test.js \
  tests/components/mobile-surface-styles.test.js
git diff --cached --check
```

Expected: the staged diff contains only the regression test and its minimal avatar fix.

- [ ] **Step 12: Commit the verified browser correction**

```bash
git commit -m "fix: harden homepage avatar parallax fallback"
```

## Final completion checklist

- [ ] All new behavior was introduced test-first with observed RED states.
- [ ] Focused tests pass.
- [ ] Complete test suite passes.
- [ ] Type checking passes.
- [ ] Production build passes.
- [ ] Desktop light/dark visual checks pass.
- [ ] Mobile light/dark touch checks pass with no permission prompt.
- [ ] Reduced-motion check passes.
- [ ] No unrelated user files were staged or committed.
- [ ] Final branch status and commit list are reported accurately.
