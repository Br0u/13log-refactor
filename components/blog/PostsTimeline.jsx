"use client";

import React, { useEffect, useRef, useState } from "react";
import PostPreviewCard from "./PostPreviewCard";

function isScrollableWithinBounds(element, deltaY) {
  if (!element || !Number.isFinite(deltaY) || deltaY === 0) return false;

  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) return false;
  if (deltaY > 0) return element.scrollTop < maxScrollTop;
  return element.scrollTop > 0;
}

export default function PostsTimeline({ entries = [] }) {
  const [focusedMicroPostId, setFocusedMicroPostId] = useState("");
  const [microScrollChrome, setMicroScrollChrome] = useState({
    id: "",
    isScrollable: false,
    progress: 0,
    viewportRatio: 1,
    isHintActive: false,
    placement: "down",
    surfaceMaxHeight: null,
  });
  const timelineRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchStartedInsideActiveCardRef = useRef(false);
  const scrollHintTimeoutRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setFocusedMicroPostId("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!focusedMicroPostId) return undefined;

    const getActiveCard = () => {
      const timeline = timelineRef.current;
      if (!timeline) return null;
      return timeline.querySelector(`[data-testid="timeline-card-${focusedMicroPostId}"]`);
    };

    const getActiveScrollSurface = () => {
      const activeCard = getActiveCard();
      if (!activeCard) return null;
      return activeCard.querySelector(`[data-testid="timeline-card-${focusedMicroPostId}-surface"]`);
    };

    const syncActiveSurfacePlacement = () => {
      const activeCard = getActiveCard();
      if (!activeCard) return;

      const rect = activeCard.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const safeMargin = viewportHeight <= 720 ? 12 : 16;
      const cardOffset = viewportHeight <= 720 ? 4 : 16;
      const maxViewportHeight = Math.max(viewportHeight - (safeMargin * 2), 0);
      const downMaxHeight = Math.max(
        Math.min(viewportHeight - safeMargin - (rect.top - cardOffset), maxViewportHeight),
        0
      );
      const upMaxHeight = Math.max(
        Math.min((rect.bottom + cardOffset) - safeMargin, maxViewportHeight),
        0
      );
      const preferredHeight = viewportHeight <= 720 ? 220 : 280;
      const placement = downMaxHeight < preferredHeight && upMaxHeight > downMaxHeight ? "up" : "down";
      const surfaceMaxHeight = Math.round(placement === "up" ? upMaxHeight : downMaxHeight);

      setMicroScrollChrome((current) => (
        {
          ...current,
          id: focusedMicroPostId,
          placement,
          surfaceMaxHeight,
        }
      ));
    };

    const syncActiveScrollChrome = () => {
      const activeSurface = getActiveScrollSurface();
      if (!activeSurface) return;

      const scrollHeight = activeSurface.scrollHeight || 0;
      const clientHeight = activeSurface.clientHeight || 0;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const progress = maxScrollTop > 0 ? activeSurface.scrollTop / maxScrollTop : 0;
      const viewportRatio = scrollHeight > 0 ? Math.min(clientHeight / scrollHeight, 1) : 1;

      setMicroScrollChrome((current) => ({
        id: focusedMicroPostId,
        isScrollable: maxScrollTop > 0,
        progress: Number(progress.toFixed(4)),
        viewportRatio: Number(viewportRatio.toFixed(4)),
        isHintActive: maxScrollTop > 0 ? current.id === focusedMicroPostId && current.isHintActive : false,
        placement: current.id === focusedMicroPostId ? current.placement : "down",
        surfaceMaxHeight: current.id === focusedMicroPostId ? current.surfaceMaxHeight : null,
      }));
    };

    const triggerScrollHint = () => {
      if (scrollHintTimeoutRef.current) {
        clearTimeout(scrollHintTimeoutRef.current);
      }

      setMicroScrollChrome((current) => (
        current.id === focusedMicroPostId
          ? { ...current, isHintActive: true }
          : current
      ));

      scrollHintTimeoutRef.current = window.setTimeout(() => {
        setMicroScrollChrome((current) => (
          current.id === focusedMicroPostId
            ? { ...current, isHintActive: false }
            : current
        ));
      }, 1000);
    };

    const eventIsInsideActiveCard = (event, activeCard) => {
      if (!activeCard) return false;

      if (typeof event.composedPath === "function") {
        return event.composedPath().includes(activeCard);
      }

      const eventTarget = event.target instanceof Node ? event.target : null;
      return Boolean(eventTarget && activeCard.contains(eventTarget));
    };

    const onPointerDown = (event) => {
      const activeCard = getActiveCard();
      if (activeCard && !activeCard.contains(event.target)) {
        setFocusedMicroPostId("");
      }
    };

    const dismissFocus = (event) => {
      event.preventDefault();
      setFocusedMicroPostId("");
    };

    const onWheel = (event) => {
      const activeCard = getActiveCard();
      const activeSurface = getActiveScrollSurface();
      const isInsideActiveCard = activeCard && eventIsInsideActiveCard(event, activeCard);

      if (activeCard && activeSurface && isInsideActiveCard && isScrollableWithinBounds(activeSurface, event.deltaY)) {
        triggerScrollHint();
        return;
      }

      if (isInsideActiveCard) {
        event.preventDefault();
        triggerScrollHint();
        return;
      }

      dismissFocus(event);
    };

    const onTouchStart = (event) => {
      const activeCard = getActiveCard();
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
      touchStartedInsideActiveCardRef.current = eventIsInsideActiveCard(event, activeCard);
    };

    const onTouchMove = (event) => {
      const activeCard = getActiveCard();
      const activeSurface = getActiveScrollSurface();
      const currentTouchY = event.touches[0]?.clientY ?? null;
      const previousTouchY = touchStartYRef.current;
      touchStartYRef.current = currentTouchY;
      const isInsideActiveCard = activeCard && (
        touchStartedInsideActiveCardRef.current || eventIsInsideActiveCard(event, activeCard)
      );

      const deltaY = previousTouchY == null || currentTouchY == null ? 0 : previousTouchY - currentTouchY;
      if (activeCard && activeSurface && isInsideActiveCard && isScrollableWithinBounds(activeSurface, deltaY)) {
        triggerScrollHint();
        return;
      }

      if (isInsideActiveCard) {
        event.preventDefault();
        triggerScrollHint();
        return;
      }

      dismissFocus(event);
    };

    const onActiveSurfaceScroll = () => {
      syncActiveScrollChrome();
      triggerScrollHint();
    };

    const activeSurface = getActiveScrollSurface();
    syncActiveSurfacePlacement();
    syncActiveScrollChrome();
    activeSurface?.addEventListener("scroll", onActiveSurfaceScroll, { passive: true });
    window.addEventListener("resize", syncActiveSurfacePlacement);

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    return () => {
      if (scrollHintTimeoutRef.current) {
        clearTimeout(scrollHintTimeoutRef.current);
        scrollHintTimeoutRef.current = null;
      }
      activeSurface?.removeEventListener("scroll", onActiveSurfaceScroll);
      window.removeEventListener("resize", syncActiveSurfacePlacement);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      touchStartYRef.current = null;
      touchStartedInsideActiveCardRef.current = false;
    };
  }, [focusedMicroPostId]);

  useEffect(() => {
    if (focusedMicroPostId) return;
    setMicroScrollChrome({
      id: "",
      isScrollable: false,
      progress: 0,
      viewportRatio: 1,
      isHintActive: false,
      placement: "down",
      surfaceMaxHeight: null,
    });
  }, [focusedMicroPostId]);

  return (
    <div
      ref={timelineRef}
      className="posts-masonry posts-masonry--interactive"
      data-testid="posts-timeline"
      data-micro-focus={focusedMicroPostId}
    >
      {entries.map((entry) => {
        const key = entry.type === "micro" ? entry.id : entry.slug;
        const isMicro = entry.type === "micro";
        const isActive = isMicro && focusedMicroPostId === entry.id;
        const hasFocusedMicroPost = focusedMicroPostId !== "";
        const focusState = isActive ? "active" : (hasFocusedMicroPost ? "background" : "idle");

        return (
          <PostPreviewCard
            key={key}
            post={entry}
            dataTestId={`timeline-card-${key}`}
            focusState={focusState}
            microScrollChrome={isActive ? microScrollChrome : undefined}
            onMicroToggle={isMicro ? () => {
              setFocusedMicroPostId((current) => {
                if (!current) return entry.id;
                if (current === entry.id) return "";
                return "";
              });
            } : undefined}
          />
        );
      })}
    </div>
  );
}
