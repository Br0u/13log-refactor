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

type AvatarStateConfig = {
  name: "base" | "hover" | "night";
  src: string;
  width: number;
  height: number;
};

type LegacyOrientationWindow = Window & {
  orientation?: number;
};

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

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
          draggable={false}
          height={state.height}
          key={layer}
          src={state.src}
          width={state.width}
        />
      ))}
    </div>
  );
}

function readScreenAngle(): number {
  const orientationAngle = window.screen?.orientation?.angle;
  if (Number.isFinite(orientationAngle)) {
    return orientationAngle as number;
  }

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

export default function HomeAvatarParallax() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const targetRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const orientationBaselineRef = useRef<OrientationBaseline | null>(null);
  const reducedMotionRef = useRef<boolean>(false);
  const coarsePointerRef = useRef<boolean>(false);
  const finePointerRef = useRef<boolean>(false);
  const activeTouchPointersRef = useRef<Set<number>>(new Set());
  const pageVisibleRef = useRef<boolean>(true);
  const componentVisibleRef = useRef<boolean>(true);

  const applyPoint = (point: ParallaxPoint): void => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.style.setProperty("--avatar-parallax-x", point.x.toFixed(4));
    scene.style.setProperty("--avatar-parallax-y", point.y.toFixed(4));
  };

  const animate = (): void => {
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

    const syncPreferences = (): void => {
      reducedMotionRef.current = Boolean(reducedQuery?.matches);
      coarsePointerRef.current = Boolean(coarseQuery?.matches);
      finePointerRef.current = Boolean(fineQuery?.matches);
      if (reducedMotionRef.current) resetPoint(true);
    };

    const onOrientation = (event: DeviceOrientationEvent): void => {
      if (
        reducedMotionRef.current
        || !pageVisibleRef.current
        || !componentVisibleRef.current
        || !coarsePointerRef.current
        || activeTouchPointersRef.current.size > 0
        || !Number.isFinite(event.beta)
        || !Number.isFinite(event.gamma)
      ) {
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
      activeTouchPointersRef.current.clear();
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
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (
      reducedMotionRef.current
      || !pageVisibleRef.current
      || !componentVisibleRef.current
      || (event.pointerType === "mouse" && !finePointerRef.current)
      || (
        event.pointerType === "touch"
        && !activeTouchPointersRef.current.has(event.pointerId)
      )
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

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== "touch") return;

    activeTouchPointersRef.current.add(event.pointerId);
    onPointerMove(event);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== "touch") return;

    const endedActiveTouch = activeTouchPointersRef.current.delete(event.pointerId);
    if (endedActiveTouch && activeTouchPointersRef.current.size === 0) {
      resetPoint();
    }
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "mouse") resetPoint();
  };

  return (
    <div aria-label="头像" className="profile-avatar-card" tabIndex={0}>
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
