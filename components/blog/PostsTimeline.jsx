"use client";

import React, { useEffect, useRef, useState } from "react";
import PostPreviewCard from "./PostPreviewCard";

export default function PostsTimeline({ entries = [] }) {
  const [focusedMicroPostId, setFocusedMicroPostId] = useState("");
  const timelineRef = useRef(null);

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

    const onPointerDown = (event) => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      const activeCard = timeline.querySelector(`[data-testid="timeline-card-${focusedMicroPostId}"]`);
      if (activeCard && !activeCard.contains(event.target)) {
        setFocusedMicroPostId("");
      }
    };

    const clearFocus = (event) => {
      event.preventDefault();
      setFocusedMicroPostId("");
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("wheel", clearFocus, { passive: false });
    window.addEventListener("touchmove", clearFocus, { passive: false });
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("wheel", clearFocus);
      window.removeEventListener("touchmove", clearFocus);
      };
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
