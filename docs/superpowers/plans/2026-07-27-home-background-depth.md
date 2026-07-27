# Homepage Background Depth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved balanced 2.5D depth effect to the homepage background while preserving the existing ink artwork, avatar parallax, rain layer, themes, layout, and accessibility fallbacks.

**Architecture:** Render one fixed, decorative client component behind the existing rain and profile content. The component reuses the existing parallax math, writes normalized pointer/orientation values into CSS custom properties, and lets CSS duplicate the current background asset into fallback, far, middle, and front layers with soft masks. Existing body backgrounds remain untouched as the final fallback.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS masks/transforms, Vitest, Testing Library

---

**Reference design:** `docs/superpowers/specs/2026-07-27-home-background-depth-design.md`

## File map

- Create `app/components/HomeBackgroundDepth.tsx`: render the four decorative layers and own pointer/orientation lifecycle.
- Modify `app/page.js`: mount the background component before the rain layer.
- Modify `app/papermod-custom.css`: define balanced layer masks, theme assets, responsive tuning, and reduced-motion fallback.
- Create `tests/app/home-background-depth.test.jsx`: test component structure, pointer/orientation behavior, suspension, and cleanup.
- Create `tests/app/home-background-depth-styles.test.js`: lock the layer stack, approved visual parameters, assets, and fallbacks.
- Modify `tests/app/home-page-rain-overlay.test.js`: verify page integration and background/rain/content order.

## Chunk 1: Test-driven implementation

### Task 1: Mount a semantic-free static depth scene

**Files:**

- Create: `app/components/HomeBackgroundDepth.tsx`
- Modify: `app/page.js:1-20`
- Create: `tests/app/home-background-depth.test.jsx`
- Modify: `tests/app/home-page-rain-overlay.test.js:1-24`

- [ ] **Step 1: Write the failing component structure test**

Create `tests/app/home-background-depth.test.jsx` with the initial structural contract:

```jsx
// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import HomeBackgroundDepth from "../../app/components/HomeBackgroundDepth";

afterEach(() => {
  cleanup();
});

describe("HomeBackgroundDepth", () => {
  it("renders one hidden fallback and three decorative depth layers", () => {
    const { container } = render(<HomeBackgroundDepth />);
    const scene = container.querySelector(".home-depth-background");
    const layers = [...container.querySelectorAll(".home-depth-background__layer")];

    expect(scene).not.toBeNull();
    expect(scene?.getAttribute("aria-hidden")).toBe("true");
    expect(scene?.dataset.parallaxActive).toBe("false");
    expect(layers).toHaveLength(4);
    expect(layers.map((layer) => layer.dataset.depthLayer)).toEqual([
      "fallback",
      "far",
      "middle",
      "front",
    ]);
  });
});
```

- [ ] **Step 2: Extend the homepage source test with the required layer order**

In `tests/app/home-page-rain-overlay.test.js`, read `app/components/HomeBackgroundDepth.tsx` next to the existing page, rain, and avatar sources. Add assertions:

```js
expect(source).toContain(
  'import HomeBackgroundDepth from "./components/HomeBackgroundDepth";',
);
expect(source).toContain("<HomeBackgroundDepth />");
expect(source.indexOf("<HomeBackgroundDepth />")).toBeLessThan(
  source.indexOf("<HomeRainLayer />"),
);
expect(backgroundSource).toContain('"use client"');
expect(backgroundSource).not.toContain("requestPermission");
```

Use `backgroundSource` for the new component source. Do not weaken the existing rain and avatar assertions.

- [ ] **Step 3: Run the two tests and verify the missing module failure**

Run:

```bash
npx vitest run tests/app/home-background-depth.test.jsx tests/app/home-page-rain-overlay.test.js
```

Expected: FAIL because `app/components/HomeBackgroundDepth.tsx` does not exist and the page does not import it.

- [ ] **Step 4: Add the minimal static component**

Create `app/components/HomeBackgroundDepth.tsx`:

```tsx
"use client";

import React, { useRef } from "react";

const LAYERS = ["fallback", "far", "middle", "front"] as const;

export default function HomeBackgroundDepth() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      aria-hidden="true"
      className="home-depth-background"
      data-parallax-active="false"
      ref={sceneRef}
    >
      {LAYERS.map((layer) => (
        <div
          className={`home-depth-background__layer home-depth-background__layer--${layer}`}
          data-depth-layer={layer}
          key={layer}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Mount the component before the rain**

In `app/page.js`, add:

```js
import HomeBackgroundDepth from "./components/HomeBackgroundDepth";
```

Then render it as the first child of the homepage section:

```jsx
<section className="profile profile--rainy-mask">
  <HomeBackgroundDepth />
  <HomeRainLayer />
  <div className="profile_inner">
```

- [ ] **Step 6: Run the tests and verify the static contract passes**

Run:

```bash
npx vitest run tests/app/home-background-depth.test.jsx tests/app/home-page-rain-overlay.test.js
```

Expected: PASS for both files.

- [ ] **Step 7: Commit the static scene**

```bash
git add app/components/HomeBackgroundDepth.tsx app/page.js tests/app/home-background-depth.test.jsx tests/app/home-page-rain-overlay.test.js
git commit -m "feat: scaffold homepage background depth"
```

### Task 2: Add viewport pointer and device-orientation control

**Files:**

- Modify: `app/components/HomeBackgroundDepth.tsx`
- Modify: `tests/app/home-background-depth.test.jsx`
- Reuse without modification: `app/components/home-avatar-parallax.ts`

- [ ] **Step 1: Add deterministic browser mocks to the component test**

Add imports for `act`, `fireEvent`, `beforeEach`, and `vi`. Add local `animationFrames`, `nextFrameId`, `mediaState`, `mediaListeners`, `mediaQueries`, and `intersectionObserver` variables. Use these complete helpers:

```jsx
function mockMatchMedia(query) {
  const mediaQuery = {
    get matches() {
      return Boolean(mediaState[query]);
    },
    media: query,
    onchange: null,
    addEventListener: vi.fn((type, listener) => {
      if (type === "change") mediaListeners.get(query)?.add(listener);
    }),
    removeEventListener: vi.fn((type, listener) => {
      if (type === "change") mediaListeners.get(query)?.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  mediaQueries.set(query, mediaQuery);
  return mediaQuery;
}

function flushAnimationFrames(limit = 80) {
  act(() => {
    for (let step = 0; step < limit && animationFrames.size > 0; step += 1) {
      const pending = [...animationFrames.entries()];
      animationFrames.clear();
      pending.forEach(([, callback]) => callback(performance.now()));
    }
  });
}

function setDocumentHidden(hidden) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
}

function changeMediaQuery(query, matches) {
  mediaState[query] = matches;
  act(() => {
    mediaListeners.get(query)?.forEach((listener) => listener({ matches, media: query }));
  });
}

function dispatchOrientation(beta, gamma) {
  const event = new Event("deviceorientation");
  Object.defineProperties(event, {
    beta: { value: beta },
    gamma: { value: gamma },
  });
  window.dispatchEvent(event);
}

function mockScreenOrientation(initialAngle = 0) {
  let angle = initialAngle;
  const orientation = new EventTarget();
  Object.defineProperty(orientation, "angle", {
    configurable: true,
    get: () => angle,
  });
  Object.defineProperty(window.screen, "orientation", {
    configurable: true,
    value: orientation,
  });
  const addEventListener = vi.spyOn(orientation, "addEventListener");
  const removeEventListener = vi.spyOn(orientation, "removeEventListener");

  return {
    addEventListener,
    removeEventListener,
    rotate(nextAngle) {
      angle = nextAngle;
      orientation.dispatchEvent(new Event("change"));
    },
  };
}
```

Use this setup:

```jsx
beforeEach(() => {
  animationFrames = new Map();
  nextFrameId = 1;
  mediaState = {
    "(prefers-reduced-motion: reduce)": false,
    "(pointer: coarse)": false,
    "(pointer: fine)": true,
  };
  mediaListeners = new Map(Object.keys(mediaState).map((query) => [query, new Set()]));
  mediaQueries = new Map();
  intersectionObserver = null;

  vi.stubGlobal("matchMedia", vi.fn((query) => mockMatchMedia(query)));
  vi.stubGlobal("PointerEvent", class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      Object.defineProperty(this, "pointerType", {
        value: init.pointerType ?? "",
      });
      Object.defineProperty(this, "pointerId", {
        value: init.pointerId ?? 0,
      });
    }
  });
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      animationFrames.set(id, callback);
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id) => animationFrames.delete(id)),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function IntersectionObserver(callback) {
      intersectionObserver = {
        callback,
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      intersectionObserver.observe = this.observe;
      intersectionObserver.disconnect = this.disconnect;
    }),
  );
  setDocumentHidden(false);
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});

afterEach(() => {
  cleanup();
  delete window.screen.orientation;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

- [ ] **Step 2: Write failing pointer, reset, reduced-motion, and orientation tests**

Add these behaviors to `tests/app/home-background-depth.test.jsx`:

```jsx
it("maps a fine-pointer viewport move into smoothed CSS variables", () => {
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 0,
    pointerType: "mouse",
  });
  flushAnimationFrames();

  expect(Number(scene.style.getPropertyValue("--home-depth-x"))).toBeCloseTo(1, 3);
  expect(Number(scene.style.getPropertyValue("--home-depth-y"))).toBeCloseTo(-1, 3);
  expect(scene.dataset.parallaxActive).toBe("true");
});

it.each([
  ["center", 500, 400, 0, 0],
  ["right", 1000, 400, 1, 0],
  ["left", 0, 400, -1, 0],
  ["top", 500, 0, 0, -1],
  ["bottom", 500, 800, 0, 1],
])("maps the fine-pointer %s position", (_label, clientX, clientY, expectedX, expectedY) => {
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, { clientX, clientY, pointerType: "mouse" });
  flushAnimationFrames();

  expect(Number(scene.style.getPropertyValue("--home-depth-x"))).toBeCloseTo(expectedX, 3);
  expect(Number(scene.style.getPropertyValue("--home-depth-y"))).toBeCloseTo(expectedY, 3);
});

it("returns smoothly to center when the window loses focus", () => {
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 800,
    pointerType: "mouse",
  });
  flushAnimationFrames();
  fireEvent.blur(window);
  expect(scene.dataset.parallaxActive).toBe("true");
  flushAnimationFrames();

  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.style.getPropertyValue("--home-depth-y")).toBe("0.0000");
  expect(scene.dataset.parallaxActive).toBe("false");
});

it("returns smoothly to center when the pointer leaves the document", () => {
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 800,
    pointerType: "mouse",
  });
  flushAnimationFrames();
  fireEvent.mouseLeave(document);
  flushAnimationFrames();

  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.style.getPropertyValue("--home-depth-y")).toBe("0.0000");
});

it("stays centered when reduced motion is requested", () => {
  mediaState["(prefers-reduced-motion: reduce)"] = true;
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 0,
    pointerType: "mouse",
  });
  flushAnimationFrames();

  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.style.getPropertyValue("--home-depth-y")).toBe("0.0000");
});

it("keeps viewport center at zero and does not register pointer input on coarse-only devices", () => {
  mediaState["(pointer: fine)"] = false;
  mediaState["(pointer: coarse)"] = true;
  const addWindowListener = vi.spyOn(window, "addEventListener");
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 500,
    clientY: 400,
    pointerType: "mouse",
  });
  flushAnimationFrames();

  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.style.getPropertyValue("--home-depth-y")).toBe("0.0000");
  expect(addWindowListener).not.toHaveBeenCalledWith(
    "pointermove",
    expect.any(Function),
    expect.anything(),
  );
});

it("updates the pointer subscription when media-query capabilities change", () => {
  mediaState["(pointer: fine)"] = false;
  mediaState["(pointer: coarse)"] = true;
  const addWindowListener = vi.spyOn(window, "addEventListener");
  const removeWindowListener = vi.spyOn(window, "removeEventListener");
  render(<HomeBackgroundDepth />);

  changeMediaQuery("(pointer: fine)", true);
  expect(addWindowListener).toHaveBeenCalledWith(
    "pointermove",
    expect.any(Function),
    { passive: true },
  );

  changeMediaQuery("(prefers-reduced-motion: reduce)", true);
  expect(removeWindowListener).toHaveBeenCalledWith(
    "pointermove",
    expect.any(Function),
  );
});

it("calibrates the first coarse-pointer orientation event", () => {
  mediaState["(pointer: fine)"] = false;
  mediaState["(pointer: coarse)"] = true;
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  dispatchOrientation(20, 10);
  dispatchOrientation(8, 22);
  flushAnimationFrames();

  expect(Number(scene.style.getPropertyValue("--home-depth-x"))).toBeCloseTo(1, 3);
  expect(Number(scene.style.getPropertyValue("--home-depth-y"))).toBeCloseTo(-1, 3);
});

it("recenters and clears calibration on invalid data and screen rotation", () => {
  mediaState["(pointer: fine)"] = false;
  mediaState["(pointer: coarse)"] = true;
  const screenOrientation = mockScreenOrientation();
  const { container } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  dispatchOrientation(20, 10);
  dispatchOrientation(8, 22);
  flushAnimationFrames();
  expect(Number(scene.style.getPropertyValue("--home-depth-x"))).toBeCloseTo(1, 3);

  dispatchOrientation(null, 22);
  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  dispatchOrientation(40, 15);
  flushAnimationFrames();
  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");

  dispatchOrientation(46, 21);
  flushAnimationFrames();
  expect(Number(scene.style.getPropertyValue("--home-depth-x"))).toBeGreaterThan(0);
  act(() => screenOrientation.rotate(90));
  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
});

it("suspends when the scene leaves the viewport and disconnects the observer", () => {
  const { container, unmount } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 800,
    pointerType: "mouse",
  });
  flushAnimationFrames();
  act(() => intersectionObserver.callback([{ isIntersecting: false }]));

  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.dataset.parallaxActive).toBe("false");
  unmount();
  expect(intersectionObserver.disconnect).toHaveBeenCalledOnce();
});

it("cancels pending frames when hidden and removes every listener on unmount", () => {
  const removeWindowListener = vi.spyOn(window, "removeEventListener");
  const removeDocumentListener = vi.spyOn(document, "removeEventListener");
  const screenOrientation = mockScreenOrientation();
  const { container, unmount } = render(<HomeBackgroundDepth />);
  const scene = container.querySelector(".home-depth-background");

  fireEvent.pointerMove(window, {
    clientX: 1000,
    clientY: 800,
    pointerType: "mouse",
  });
  expect(animationFrames.size).toBeGreaterThan(0);
  setDocumentHidden(true);
  fireEvent(document, new Event("visibilitychange"));

  expect(animationFrames.size).toBe(0);
  expect(scene.style.getPropertyValue("--home-depth-x")).toBe("0.0000");
  expect(scene.dataset.parallaxActive).toBe("false");
  unmount();
  expect(removeWindowListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
  expect(removeWindowListener).toHaveBeenCalledWith("deviceorientation", expect.any(Function));
  expect(removeWindowListener).toHaveBeenCalledWith("blur", expect.any(Function));
  expect(removeDocumentListener).toHaveBeenCalledWith(
    "mouseleave",
    expect.any(Function),
  );
  expect(removeDocumentListener).toHaveBeenCalledWith(
    "visibilitychange",
    expect.any(Function),
  );
  expect(screenOrientation.removeEventListener).toHaveBeenCalledWith(
    "change",
    expect.any(Function),
  );
  for (const mediaQuery of mediaQueries.values()) {
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  }
});
```

- [ ] **Step 3: Run the component test and verify interaction failures**

Run:

```bash
npx vitest run tests/app/home-background-depth.test.jsx
```

Expected: structural test passes; interaction tests fail because the static component does not register input or update CSS variables.

- [ ] **Step 4: Implement the complete controller**

Replace `app/components/HomeBackgroundDepth.tsx` with:

```tsx
"use client";

import React, { useEffect, useRef } from "react";
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

type LegacyOrientationWindow = Window & {
  orientation?: number;
};

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

const LAYERS = ["fallback", "far", "middle", "front"] as const;
const EPSILON = 0.002;

function readScreenAngle(): number {
  const orientationAngle = window.screen?.orientation?.angle;
  if (Number.isFinite(orientationAngle)) return orientationAngle as number;

  const legacyAngle = (window as LegacyOrientationWindow).orientation;
  return Number.isFinite(legacyAngle) ? legacyAngle as number : 0;
}

function subscribeMediaQuery(
  query: MediaQueryList | null,
  listener: MediaQueryChangeListener,
): () => void {
  if (!query) return () => {};

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  if (typeof query.addListener === "function") {
    query.addListener(listener);
    return () => query.removeListener(listener);
  }

  return () => {};
}

export default function HomeBackgroundDepth() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const targetRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const orientationBaselineRef = useRef<OrientationBaseline | null>(null);
  const reducedMotionRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const finePointerRef = useRef(false);
  const pageVisibleRef = useRef(true);
  const componentVisibleRef = useRef(true);

  const applyPoint = (point: ParallaxPoint): void => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.style.setProperty("--home-depth-x", point.x.toFixed(4));
    scene.style.setProperty("--home-depth-y", point.y.toFixed(4));
  };

  const animate = (): void => {
    frameRef.current = null;
    const next = smoothParallax(currentRef.current, targetRef.current, 0.14);
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

  const queuePoint = (point: ParallaxPoint): void => {
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

  const resetPoint = (immediate = false): void => {
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

    let pointerListenerAttached = false;

    const onPointerMove = (event: PointerEvent): void => {
      if (
        reducedMotionRef.current
        || !pageVisibleRef.current
        || !componentVisibleRef.current
        || !finePointerRef.current
        || event.pointerType !== "mouse"
      ) {
        return;
      }

      queuePoint(pointerToParallax(event.clientX, event.clientY, {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    const syncPointerSubscription = (): void => {
      const shouldListen = finePointerRef.current && !reducedMotionRef.current;
      if (shouldListen && !pointerListenerAttached) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        pointerListenerAttached = true;
      } else if (!shouldListen && pointerListenerAttached) {
        window.removeEventListener("pointermove", onPointerMove);
        pointerListenerAttached = false;
      }
    };

    const syncPreferences = (): void => {
      reducedMotionRef.current = Boolean(reducedQuery?.matches);
      coarsePointerRef.current = Boolean(coarseQuery?.matches);
      finePointerRef.current = Boolean(fineQuery?.matches);
      syncPointerSubscription();
      if (reducedMotionRef.current) resetPoint(true);
    };

    const onOrientation = (event: DeviceOrientationEvent): void => {
      if (
        reducedMotionRef.current
        || !pageVisibleRef.current
        || !componentVisibleRef.current
        || !coarsePointerRef.current
        || finePointerRef.current
      ) {
        return;
      }

      if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) {
        orientationBaselineRef.current = null;
        resetPoint(true);
        return;
      }

      const beta = event.beta as number;
      const gamma = event.gamma as number;
      if (!orientationBaselineRef.current) {
        orientationBaselineRef.current = { beta, gamma };
        return;
      }

      queuePoint(orientationToParallax(
        beta,
        gamma,
        orientationBaselineRef.current,
        readScreenAngle(),
      ));
    };

    const suspendInput = (): void => {
      orientationBaselineRef.current = null;
      resetPoint(true);
    };

    const onVisibilityChange = (): void => {
      pageVisibleRef.current = !document.hidden;
      if (!pageVisibleRef.current) suspendInput();
    };

    const onScreenOrientationChange = (): void => {
      orientationBaselineRef.current = null;
      resetPoint(true);
    };

    const onDocumentLeave = (): void => {
      resetPoint();
    };

    const onWindowBlur = (): void => {
      orientationBaselineRef.current = null;
      resetPoint();
    };

    const observer = typeof IntersectionObserver === "function" && sceneRef.current
      ? new IntersectionObserver(([entry]) => {
          componentVisibleRef.current = entry?.isIntersecting ?? true;
          if (!componentVisibleRef.current) suspendInput();
        })
      : null;

    pageVisibleRef.current = !document.hidden;
    applyPoint(PARALLAX_CENTER);
    syncPreferences();
    if (sceneRef.current) observer?.observe(sceneRef.current);

    const unsubscribeReduced = subscribeMediaQuery(reducedQuery, syncPreferences);
    const unsubscribeCoarse = subscribeMediaQuery(coarseQuery, syncPreferences);
    const unsubscribeFine = subscribeMediaQuery(fineQuery, syncPreferences);
    const screenOrientation = window.screen?.orientation;
    const usesScreenOrientation = typeof screenOrientation?.addEventListener === "function";

    if (usesScreenOrientation) {
      screenOrientation.addEventListener("change", onScreenOrientationChange);
    } else {
      window.addEventListener("orientationchange", onScreenOrientationChange);
    }
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("mouseleave", onDocumentLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unsubscribeReduced();
      unsubscribeCoarse();
      unsubscribeFine();
      if (usesScreenOrientation) {
        screenOrientation.removeEventListener("change", onScreenOrientationChange);
      } else {
        window.removeEventListener("orientationchange", onScreenOrientationChange);
      }
      if (pointerListenerAttached) {
        window.removeEventListener("pointermove", onPointerMove);
        pointerListenerAttached = false;
      }
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("mouseleave", onDocumentLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="home-depth-background"
      data-parallax-active="false"
      ref={sceneRef}
    >
      {LAYERS.map((layer) => (
        <div
          className={`home-depth-background__layer home-depth-background__layer--${layer}`}
          data-depth-layer={layer}
          key={layer}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run the interaction tests and fix only contract mismatches**

Run:

```bash
npx vitest run tests/app/home-background-depth.test.jsx tests/app/home-avatar-parallax-math.test.ts
```

Expected: PASS. If an event-construction difference in jsdom prevents `pointerType`, fix the test event construction; do not remove the production fine-pointer or pointer-type guards.

- [ ] **Step 6: Run type checking**

Run:

```bash
npm run typecheck
```

Expected: both TypeScript checks exit successfully.

- [ ] **Step 7: Commit the controller**

```bash
git add app/components/HomeBackgroundDepth.tsx tests/app/home-background-depth.test.jsx
git commit -m "feat: control homepage background depth"
```

## Chunk 2: Visual layer and acceptance

### Task 3: Add balanced masks, themes, and responsive fallbacks

**Files:**

- Modify: `app/papermod-custom.css:856-1005,5665-5680`
- Create: `tests/app/home-background-depth-styles.test.js`
- Modify: `tests/app/home-page-rain-overlay-styles.test.js`
- Modify: `tests/components/mobile-surface-styles.test.js`

- [ ] **Step 1: Write the failing style contract**

Create `tests/app/home-background-depth-styles.test.js`:

```js
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app/papermod-custom.css"),
  "utf8",
);

describe("homepage background depth styles", () => {
  it("keeps the depth scene behind rain and content", () => {
    expect(stylesheet).toMatch(
      /\.home-depth-background\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*0;[^}]*pointer-events:\s*none;/s,
    );
    expect(stylesheet).toMatch(/\.home-rain-layer\s*\{[^}]*z-index:\s*2;/s);
    expect(stylesheet).toMatch(
      /\.profile--rainy-mask \.profile_inner\s*\{[^}]*z-index:\s*3;/s,
    );
  });

  it("uses the approved balanced depth parameters", () => {
    expect(stylesheet).toContain("--home-depth-far-blur: 1.8px");
    expect(stylesheet).toContain("--home-depth-middle-blur: 0.55px");
    expect(stylesheet).toMatch(
      /home-depth-background__layer--far[\s\S]*--home-depth-x\) \* -2\.5px/,
    );
    expect(stylesheet).toMatch(
      /home-depth-background__layer--middle[\s\S]*--home-depth-x\) \* 7px/,
    );
    expect(stylesheet).toMatch(
      /home-depth-background__layer--front[\s\S]*--home-depth-x\) \* 12px/,
    );
    expect(stylesheet).toMatch(/--home-depth-y\) \* -1\.8px/);
    expect(stylesheet).toMatch(/--home-depth-y\) \* 5px/);
    expect(stylesheet).toMatch(/--home-depth-y\) \* 9px/);
    expect(stylesheet).toContain("--home-depth-layer-scale: 1.045");
  });

  it("uses PNG fallbacks plus the existing day, night, and mobile image sets", () => {
    expect(stylesheet).toMatch(
      /\.home-depth-background__layer\s*\{[\s\S]*background-image:\s*url\("\/images\/backgrounds\/home-ink-landscape\.png"\);[\s\S]*home-ink-landscape\.webp/,
    );
    expect(stylesheet).toMatch(
      /body\.dark\.list:has\(\.profile--rainy-mask\) \.home-depth-background__layer\s*\{[\s\S]*background-image:\s*url\("\/images\/backgrounds\/home-night-ink-bg\.png"\);[\s\S]*home-night-ink-bg\.webp/,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*\.home-depth-background__layer\s*\{[\s\S]*background-image:\s*url\("\/images\/backgrounds\/home-mobile-ink-bg\.png"\);[\s\S]*home-mobile-ink-bg\.webp/,
    );
  });

  it("limits mobile movement and keeps separate day and night masks", () => {
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*--home-depth-layer-scale:\s*1\.035/,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*--home-depth-x\) \* 5px[\s\S]*--home-depth-y\) \* 4px/,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*--home-depth-x\) \* 8px[\s\S]*--home-depth-y\) \* 6px/,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*\.home-depth-background\s*\{[^}]*transparent 24%[^}]*transparent 27%/s,
    );
    expect(stylesheet).toMatch(
      /@media \(max-width: 960px\)[\s\S]*body\.dark\.list:has\(\.profile--rainy-mask\) \.home-depth-background\s*\{[^}]*transparent 26%[^}]*transparent 29%/s,
    );
  });

  it("keeps a complete fallback and freezes movement for reduced motion", () => {
    expect(stylesheet).toMatch(
      /\.home-depth-background__layer--fallback\s*\{[^}]*opacity:\s*1;/s,
    );
    expect(stylesheet).toMatch(
      /@supports[\s\S]*\.home-depth-background__layer--fallback\s*\{[^}]*opacity:\s*0;/s,
    );
    expect(stylesheet).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.home-depth-background__layer\s*\{[^}]*transform:[^}]*!important;/s,
    );
    expect(stylesheet).toMatch(
      /\.home-depth-background\s*\{[^}]*background:\s*transparent;/s,
    );
  });
});
```

In the existing rain style test, add one assertion that `.home-depth-background` is `z-index: 0` while preserving the existing rain `z-index: 2` and content `z-index: 3` assertions. In `tests/components/mobile-surface-styles.test.js`, add assertions for the mobile depth asset without deleting the existing body-background fallback checks.

- [ ] **Step 2: Run the style tests and verify they fail**

Run:

```bash
npx vitest run tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay-styles.test.js tests/components/mobile-surface-styles.test.js
```

Expected: FAIL because no `.home-depth-background` styles exist.

- [ ] **Step 3: Add the depth CSS immediately before `.home-rain-layer`**

Insert this block after `.profile--rainy-mask .profile_inner` and before `.home-rain-layer`:

```css
.home-depth-background {
  --home-depth-x: 0;
  --home-depth-y: 0;
  --home-depth-layer-scale: 1.045;
  --home-depth-far-blur: 1.8px;
  --home-depth-middle-blur: 0.55px;
  --home-depth-middle-mask:
    linear-gradient(to bottom, transparent 18%, rgba(0, 0, 0, 0.36) 42%, #000 68%);
  --home-depth-front-mask:
    radial-gradient(ellipse 52% 76% at 0% 68%, #000 36%, transparent 74%),
    radial-gradient(ellipse 50% 72% at 100% 72%, #000 34%, transparent 72%),
    linear-gradient(to top, #000 0%, transparent 30%);
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: transparent;
  contain: paint;
}

.home-depth-background::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background:
    linear-gradient(rgba(247, 243, 235, 0.18), rgba(247, 243, 235, 0.18)),
    radial-gradient(ellipse at center, transparent 42%, rgba(54, 46, 36, 0.045) 100%);
}

.home-depth-background__layer {
  position: absolute;
  inset: -4vmax;
  display: block;
  background-image: url("/images/backgrounds/home-ink-landscape.png");
  background-image:
    image-set(
      url("/images/backgrounds/home-ink-landscape.webp") type("image/webp"),
      url("/images/backgrounds/home-ink-landscape.png") type("image/png")
    );
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  backface-visibility: hidden;
}

.home-depth-background__layer--fallback {
  z-index: 0;
  opacity: 1;
  transform: scale(var(--home-depth-layer-scale));
}

.home-depth-background__layer--far,
.home-depth-background__layer--middle,
.home-depth-background__layer--front {
  opacity: 0;
}

@supports ((mask-image: linear-gradient(#000, transparent)) or (-webkit-mask-image: linear-gradient(#000, transparent))) {
  .home-depth-background__layer--fallback {
    opacity: 0;
  }

  .home-depth-background__layer--far,
  .home-depth-background__layer--middle,
  .home-depth-background__layer--front {
    opacity: 1;
    will-change: transform;
  }

  .home-depth-background__layer--far {
    z-index: 1;
    filter: blur(var(--home-depth-far-blur)) saturate(0.94);
    transform:
      translate3d(
        calc(var(--home-depth-x) * -2.5px),
        calc(var(--home-depth-y) * -1.8px),
        0
      )
      scale(var(--home-depth-layer-scale));
  }

  .home-depth-background__layer--middle {
    z-index: 2;
    -webkit-mask-image: var(--home-depth-middle-mask);
    mask-image: var(--home-depth-middle-mask);
    filter: blur(var(--home-depth-middle-blur));
    transform:
      translate3d(
        calc(var(--home-depth-x) * 7px),
        calc(var(--home-depth-y) * 5px),
        0
      )
      scale(var(--home-depth-layer-scale));
  }

  .home-depth-background__layer--front {
    z-index: 3;
    -webkit-mask-image: var(--home-depth-front-mask);
    mask-image: var(--home-depth-front-mask);
    transform:
      translate3d(
        calc(var(--home-depth-x) * 12px),
        calc(var(--home-depth-y) * 9px),
        0
      )
      scale(var(--home-depth-layer-scale));
  }
}

body.dark.list:has(.profile--rainy-mask) .home-depth-background {
  --home-depth-middle-mask:
    linear-gradient(to bottom, transparent 20%, rgba(0, 0, 0, 0.38) 45%, #000 70%);
  --home-depth-front-mask:
    radial-gradient(ellipse 54% 78% at 0% 70%, #000 38%, transparent 75%),
    radial-gradient(ellipse 52% 74% at 100% 74%, #000 36%, transparent 73%),
    linear-gradient(to top, #000 0%, transparent 31%);
}

body.dark.list:has(.profile--rainy-mask) .home-depth-background__layer {
  background-image: url("/images/backgrounds/home-night-ink-bg.png");
  background-image:
    image-set(
      url("/images/backgrounds/home-night-ink-bg.webp") type("image/webp"),
      url("/images/backgrounds/home-night-ink-bg.png") type("image/png")
    );
}

body.dark.list:has(.profile--rainy-mask) .home-depth-background::after {
  background:
    linear-gradient(rgba(3, 8, 18, 0.18), rgba(3, 8, 18, 0.2)),
    radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.12) 100%);
}
```

Inside the existing `@media (max-width: 960px)` block, after the homepage body background rule, add:

```css
.home-depth-background {
  --home-depth-layer-scale: 1.035;
  --home-depth-middle-mask:
    linear-gradient(to bottom, transparent 24%, rgba(0, 0, 0, 0.34) 48%, #000 72%);
  --home-depth-front-mask:
    radial-gradient(ellipse 58% 74% at 0% 72%, #000 34%, transparent 74%),
    radial-gradient(ellipse 56% 72% at 100% 74%, #000 32%, transparent 72%),
    linear-gradient(to top, #000 0%, transparent 27%);
}

.home-depth-background__layer {
  inset: -3vmax;
  background-image: url("/images/backgrounds/home-mobile-ink-bg.png");
  background-image:
    image-set(
      url("/images/backgrounds/home-mobile-ink-bg.webp") type("image/webp"),
      url("/images/backgrounds/home-mobile-ink-bg.png") type("image/png")
    );
  background-position: center top;
}

.home-depth-background__layer--middle {
  transform:
    translate3d(
      calc(var(--home-depth-x) * 5px),
      calc(var(--home-depth-y) * 4px),
      0
    )
    scale(var(--home-depth-layer-scale));
}

.home-depth-background__layer--front {
  transform:
    translate3d(
      calc(var(--home-depth-x) * 8px),
      calc(var(--home-depth-y) * 6px),
      0
    )
    scale(var(--home-depth-layer-scale));
}

body.dark.list:has(.profile--rainy-mask) .home-depth-background {
  --home-depth-middle-mask:
    linear-gradient(to bottom, transparent 26%, rgba(0, 0, 0, 0.38) 50%, #000 74%);
  --home-depth-front-mask:
    radial-gradient(ellipse 60% 76% at 0% 73%, #000 36%, transparent 75%),
    radial-gradient(ellipse 58% 74% at 100% 75%, #000 34%, transparent 73%),
    linear-gradient(to top, #000 0%, transparent 29%);
}

body.dark.list:has(.profile--rainy-mask) .home-depth-background__layer {
  background-image: url("/images/backgrounds/home-night-ink-bg.png");
  background-image:
    image-set(
      url("/images/backgrounds/home-night-ink-bg.webp") type("image/webp"),
      url("/images/backgrounds/home-night-ink-bg.png") type("image/png")
    );
}
```

Extend the existing reduced-motion block:

```css
@media (prefers-reduced-motion: reduce) {
  .home-depth-background__layer {
    transform: scale(var(--home-depth-layer-scale)) !important;
    will-change: auto !important;
  }
}
```

- [ ] **Step 4: Run all homepage depth, rain, avatar, and mobile style tests**

Run:

```bash
npx vitest run tests/app/home-background-depth.test.jsx tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay.test.js tests/app/home-page-rain-overlay-styles.test.js tests/app/home-avatar-parallax.test.jsx tests/app/home-avatar-parallax-math.test.ts tests/app/home-page-hero-styles.test.js tests/components/mobile-surface-styles.test.js
```

Expected: PASS for all listed files.

- [ ] **Step 5: Check the stylesheet diff for accidental scope widening**

Run:

```bash
git diff --check
git diff -- app/papermod-custom.css tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay-styles.test.js tests/components/mobile-surface-styles.test.js
```

Expected: no whitespace errors; changes are limited to homepage depth styles and their tests.

- [ ] **Step 6: Commit the visual layer**

```bash
git add app/papermod-custom.css tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay-styles.test.js tests/components/mobile-surface-styles.test.js
git commit -m "feat: style balanced homepage background depth"
```

### Task 4: Run release gates and browser acceptance

**Files:**

- Verify only; modify the implementation or tests only when a concrete failure is reproduced.
- Write screenshots only to uniquely named files under `output/playwright/`; do not delete or overwrite existing output.

- [ ] **Step 1: Run the complete checked-in release gate**

Run:

```bash
npm run typecheck
npm test
```

Expected: type checking passes and all non-database Vitest files pass.

- [ ] **Step 2: Run the production build with deliberately unreachable database URLs**

Run:

```bash
DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid SESSION_SECRET=home-depth-build-session-secret-32-characters RISK_INTERNAL_SECRET=home-depth-build-risk-secret-32-characters npm run build
```

Expected: production build succeeds using the existing public-content fallbacks. Do not report real PostgreSQL integration as tested.

- [ ] **Step 3: Start a dedicated local preview**

Run in a persistent terminal:

```bash
npm run dev -- -p 3014
```

Expected: Next.js reports Ready on `http://localhost:3014`.

- [ ] **Step 4: Verify the page responds before visual inspection**

Run:

```bash
curl --noproxy '*' -I http://localhost:3014/
```

Expected: HTTP 200.

- [ ] **Step 5: Use `@playwright` for desktop and mobile visual acceptance**

Choose the current local timestamp to seconds as a run label, for example `20260727-153012`. Capture these screenshots with that actual run label so repeated execution never overwrites existing output:

- `output/playwright/home-depth-light-1440-[run-label].png`
- `output/playwright/home-depth-dark-1440-[run-label].png`
- `output/playwright/home-depth-light-846-[run-label].png`
- `output/playwright/home-depth-dark-846-[run-label].png`
- `output/playwright/home-depth-light-390-[run-label].png`
- `output/playwright/home-depth-dark-390-[run-label].png`

For each viewport:

1. Confirm the correct day/night asset and crop.
2. Move the pointer slowly and then rapidly between all four corners on fine-pointer viewports.
3. Confirm no exposed background edge, duplicated hard contour, mask seam, content movement, or loss of text contrast.
4. Toggle the site theme and confirm the layer stack switches without remount artifacts.
5. Emulate `prefers-reduced-motion: reduce` and confirm the background stays static while retaining the depth blur.
6. Switch tabs, return to the page, blur/refocus the window, and confirm the scene recenters without a jump.
7. At 390px, test with no device-orientation events and confirm the static depth remains complete.
8. Inspect the browser console after interaction and require zero new errors or unhandled warnings.

Expected: the approved B strength is visible but quieter than the avatar movement; rain remains above the background and below content.

- [ ] **Step 6: Fix only reproduced visual defects and rerun the narrow gate**

If a seam, crop, or contrast defect is visible, adjust only the relevant mask, scale, position, or tint in `app/papermod-custom.css`. Add or update the matching style assertion, then run:

```bash
npx vitest run tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay-styles.test.js tests/components/mobile-surface-styles.test.js
npm run typecheck
npm test
DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid SESSION_SECRET=home-depth-build-session-secret-32-characters RISK_INTERNAL_SECRET=home-depth-build-risk-secret-32-characters npm run build
```

Repeat the affected viewport and theme checks from Step 5 after the change and save new screenshots with a new timestamp run label.

Expected: targeted tests, full tests, type checking, production build, and the repeated visual check all pass. If no defect is reproduced, make no change and create no extra commit.

- [ ] **Step 7: Commit any verified visual correction**

Only when Step 6 changed tracked files:

```bash
git add app/papermod-custom.css tests/app/home-background-depth-styles.test.js tests/app/home-page-rain-overlay-styles.test.js tests/components/mobile-surface-styles.test.js
git commit -m "fix: tune homepage background depth masks"
```

- [ ] **Step 8: Verify final repository state**

Run:

```bash
git diff --check
git status --short --branch
git log --oneline --decorate -5
```

Expected: no tracked implementation changes remain unstaged. Preserve the pre-existing untracked codebase-hardening documents, `output/`, and `tests/lib/public-photos.test 2.js`.

- [ ] **Step 9: Stop the dedicated local preview**

Stop only the preview process started in Step 3 with `Ctrl-C` in its persistent terminal.

Expected: port `3014` is released and no unrelated process is stopped.
