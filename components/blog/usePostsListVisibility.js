"use client";

import { useEffect, useRef, useState } from "react";

export function usePostsListVisibility({ entries, isPostsListLayout, initialVisibleCount }) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [supportsIntersectionObserver, setSupportsIntersectionObserver] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setSupportsIntersectionObserver(typeof IntersectionObserver !== "undefined");
  }, []);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [entries, initialVisibleCount]);

  useEffect(() => {
    if (!isPostsListLayout) return undefined;
    if (!supportsIntersectionObserver || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver((observerEntries) => {
      const [entry] = observerEntries;
      if (!entry?.isIntersecting) return;

      setVisibleCount((current) => (
        current >= entries.length ? current : Math.min(current + initialVisibleCount, entries.length)
      ));
    }, {
      rootMargin: "240px 0px",
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [entries.length, initialVisibleCount, isPostsListLayout, supportsIntersectionObserver]);

  return {
    sentinelRef,
    supportsIntersectionObserver,
    visibleCount,
    showMore: () => {
      setVisibleCount((current) => Math.min(current + initialVisibleCount, entries.length));
    },
  };
}
