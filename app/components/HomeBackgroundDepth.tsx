"use client";

import React, { useEffect, useRef } from "react";
import {
  PARALLAX_CENTER,
  orientationToParallax,
  pointerToParallax,
  smoothParallax,
  type OrientationBaseline,
  type ParallaxPoint,
} from "./home-avatar-parallax";

const LAYERS = ["fallback", "far", "middle", "front"] as const;
const SMOOTH_AMOUNT = 0.14;
const EPSILON = 0.002;
type InputMode = "fine" | "coarse" | "none" | "disabled";

function isCentered(point: ParallaxPoint): boolean {
  return Math.abs(point.x) <= EPSILON && Math.abs(point.y) <= EPSILON;
}

function samePoint(first: ParallaxPoint, second: ParallaxPoint): boolean {
  return Math.abs(first.x - second.x) <= EPSILON && Math.abs(first.y - second.y) <= EPSILON;
}

function subscribeMediaQuery(query: MediaQueryList | null, listener: () => void) {
  if (!query) {
    return () => undefined;
  }

  if (
    typeof query.addEventListener === "function" &&
    typeof query.removeEventListener === "function"
  ) {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  if (typeof query.addListener === "function" && typeof query.removeListener === "function") {
    query.addListener(listener);
    return () => query.removeListener(listener);
  }

  return () => undefined;
}

export default function HomeBackgroundDepth() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const currentPointRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const targetPointRef = useRef<ParallaxPoint>({ ...PARALLAX_CENTER });
  const animationFrameRef = useRef<number | null>(null);
  const orientationBaselineRef = useRef<OrientationBaseline | null>(null);
  const reducedMotionRef = useRef(false);
  const finePointerRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const pageVisibleRef = useRef(true);
  const componentVisibleRef = useRef(true);

  useEffect(() => {
    const matchMedia =
      typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : null;
    const finePointerQuery = matchMedia?.("(pointer: fine)") ?? null;
    const coarsePointerQuery = matchMedia?.("(pointer: coarse)") ?? null;
    const reducedMotionQuery = matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    let pointerAttached = false;
    let orientationAttached = false;
    let effectiveMode: InputMode | null = null;

    const applyPoint = (point: ParallaxPoint) => {
      const scene = sceneRef.current;
      if (!scene) {
        return;
      }

      scene.style.setProperty("--home-depth-x", point.x.toFixed(4));
      scene.style.setProperty("--home-depth-y", point.y.toFixed(4));
    };

    const setActive = (active: boolean) => {
      const scene = sceneRef.current;
      if (!scene) {
        return;
      }

      const nextActive = String(active);
      if (scene.dataset.parallaxActive !== nextActive) {
        scene.dataset.parallaxActive = nextActive;
      }
    };

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const immediatelyCenter = () => {
      cancelAnimation();
      currentPointRef.current = { ...PARALLAX_CENTER };
      targetPointRef.current = { ...PARALLAX_CENTER };
      applyPoint(PARALLAX_CENTER);
      setActive(false);
    };

    const canAcceptInput = () =>
      !reducedMotionRef.current && pageVisibleRef.current && componentVisibleRef.current;

    const finishAtTarget = (target: ParallaxPoint) => {
      currentPointRef.current = { ...target };
      applyPoint(target);
      if (isCentered(target)) {
        setActive(false);
      }
    };

    const animate = () => {
      animationFrameRef.current = null;
      if (!canAcceptInput()) {
        immediatelyCenter();
        return;
      }

      const current = currentPointRef.current;
      const target = targetPointRef.current;
      if (samePoint(current, target)) {
        finishAtTarget(target);
        return;
      }

      const next = smoothParallax(current, target, SMOOTH_AMOUNT);
      if (samePoint(next, target)) {
        finishAtTarget(target);
        return;
      }

      currentPointRef.current = next;
      applyPoint(next);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    const targetPoint = (point: ParallaxPoint) => {
      if (!canAcceptInput()) {
        return;
      }

      if (samePoint(targetPointRef.current, point)) {
        return;
      }

      targetPointRef.current = point;
      if (animationFrameRef.current === null) {
        setActive(true);
        animationFrameRef.current = window.requestAnimationFrame(animate);
      }
    };

    const smoothlyCenter = () => {
      orientationBaselineRef.current = null;
      if (!canAcceptInput()) {
        immediatelyCenter();
        return;
      }
      targetPoint({ ...PARALLAX_CENTER });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canAcceptInput() || !finePointerRef.current) {
        return;
      }

      targetPoint(
        pointerToParallax(event.clientX, event.clientY, {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    };

    const screenAngle = () => {
      const angle = window.screen?.orientation?.angle;
      if (typeof angle === "number" && Number.isFinite(angle)) {
        return angle;
      }
      const legacyAngle = (window as Window & { orientation?: number }).orientation;
      return typeof legacyAngle === "number" && Number.isFinite(legacyAngle) ? legacyAngle : 0;
    };

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (
        !canAcceptInput() ||
        finePointerRef.current ||
        !coarsePointerRef.current ||
        event.beta === null ||
        event.gamma === null ||
        !Number.isFinite(event.beta) ||
        !Number.isFinite(event.gamma)
      ) {
        if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) {
          orientationBaselineRef.current = null;
          immediatelyCenter();
        }
        return;
      }

      if (!orientationBaselineRef.current) {
        orientationBaselineRef.current = { beta: event.beta, gamma: event.gamma };
        return;
      }

      targetPoint(orientationToParallax(event.beta, event.gamma, orientationBaselineRef.current, screenAngle()));
    };

    const detachPointer = () => {
      if (pointerAttached) {
        window.removeEventListener("pointermove", onPointerMove);
        pointerAttached = false;
      }
    };

    const detachOrientation = () => {
      if (orientationAttached) {
        window.removeEventListener("deviceorientation", onDeviceOrientation);
        orientationAttached = false;
      }
    };

    const syncInputListeners = () => {
      finePointerRef.current = finePointerQuery?.matches ?? false;
      coarsePointerRef.current = coarsePointerQuery?.matches ?? false;
      reducedMotionRef.current = reducedMotionQuery?.matches ?? false;

      const nextMode: InputMode = reducedMotionRef.current
        ? "disabled"
        : finePointerRef.current
          ? "fine"
          : coarsePointerRef.current
            ? "coarse"
            : "none";

      if (nextMode !== effectiveMode) {
        orientationBaselineRef.current = null;
        detachPointer();
        detachOrientation();
        immediatelyCenter();
        effectiveMode = nextMode;
      }

      if (effectiveMode === "fine") {
        if (!pointerAttached) {
          window.addEventListener("pointermove", onPointerMove, { passive: true });
          pointerAttached = true;
        }
        return;
      }

      if (effectiveMode === "coarse" && !orientationAttached) {
        window.addEventListener("deviceorientation", onDeviceOrientation);
        orientationAttached = true;
      }
    };

    const onMediaChange = () => syncInputListeners();
    const onVisibilityChange = () => {
      pageVisibleRef.current = !document.hidden;
      if (!pageVisibleRef.current) {
        orientationBaselineRef.current = null;
        immediatelyCenter();
      }
    };
    const onComponentVisibility = (entries: IntersectionObserverEntry[]) => {
      componentVisibleRef.current = entries.some((entry) => entry.isIntersecting);
      if (!componentVisibleRef.current) {
        orientationBaselineRef.current = null;
        immediatelyCenter();
      }
    };
    const onOrientationChange = () => {
      orientationBaselineRef.current = null;
      immediatelyCenter();
    };

    pageVisibleRef.current = !document.hidden;
    applyPoint(PARALLAX_CENTER);
    setActive(false);
    syncInputListeners();
    window.addEventListener("blur", smoothlyCenter);
    document.addEventListener("mouseleave", smoothlyCenter);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const screenOrientation = window.screen?.orientation;
    const hasScreenOrientationEvents =
      screenOrientation &&
      typeof screenOrientation.addEventListener === "function" &&
      typeof screenOrientation.removeEventListener === "function";
    if (hasScreenOrientationEvents) {
      screenOrientation.addEventListener("change", onOrientationChange);
    } else {
      window.addEventListener("orientationchange", onOrientationChange);
    }

    const observer =
      typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(onComponentVisibility);
    if (observer && sceneRef.current) {
      observer.observe(sceneRef.current);
    }

    const unsubscribeFine = subscribeMediaQuery(finePointerQuery, onMediaChange);
    const unsubscribeCoarse = subscribeMediaQuery(coarsePointerQuery, onMediaChange);
    const unsubscribeReduced = subscribeMediaQuery(reducedMotionQuery, onMediaChange);

    return () => {
      cancelAnimation();
      detachPointer();
      detachOrientation();
      window.removeEventListener("blur", smoothlyCenter);
      document.removeEventListener("mouseleave", smoothlyCenter);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (hasScreenOrientationEvents) {
        screenOrientation.removeEventListener("change", onOrientationChange);
      } else {
        window.removeEventListener("orientationchange", onOrientationChange);
      }
      unsubscribeFine();
      unsubscribeCoarse();
      unsubscribeReduced();
      observer?.disconnect();
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
