"use client";

import React from "react";
import PostPreviewCard from "./PostPreviewCard";
import { useFocusedMicroPost } from "./useFocusedMicroPost";
import { usePostsListVisibility } from "./usePostsListVisibility";

const DEFAULT_VISIBLE_COUNT = 6;
const RELAXED_MICRO_TEXT_THRESHOLD = 160;

function getMicroTextLength(entry) {
  return String(entry?.summary || entry?.content || "").trim().length;
}

export default function PostsTimeline({ entries = [], layout = "masonry", initialVisibleCount = DEFAULT_VISIBLE_COUNT }) {
  const isPostsListLayout = layout === "posts-list";
  const { focusedMicroPostId, microScrollChrome, timelineRef, toggleMicroPost } = useFocusedMicroPost({
    enabled: !isPostsListLayout,
  });
  const { sentinelRef, supportsIntersectionObserver, visibleCount, showMore } = usePostsListVisibility({
    entries,
    isPostsListLayout,
    initialVisibleCount,
  });

  const visibleEntries = isPostsListLayout ? entries.slice(0, visibleCount) : entries;

  return (
    <div
      ref={timelineRef}
      className={`posts-masonry posts-masonry--interactive${isPostsListLayout ? " posts-masonry--posts-list" : ""}`}
      data-testid="posts-timeline"
      data-layout={layout}
      data-micro-focus={focusedMicroPostId}
    >
      {visibleEntries.map((entry) => {
        const key = entry.type === "micro" ? entry.id : entry.slug;
        const isMicro = entry.type === "micro";
        const isExpandedImageMicro = isPostsListLayout && Boolean(entry.hasImage);
        const isRelaxedTextMicro = isPostsListLayout && isMicro && !entry.hasImage && getMicroTextLength(entry) >= RELAXED_MICRO_TEXT_THRESHOLD;
        const supportsMicroFocus = isMicro && !isPostsListLayout;
        const hasFocusedMicroPost = !isPostsListLayout && focusedMicroPostId !== "";
        const isActive = supportsMicroFocus && focusedMicroPostId === entry.id;
        const focusState = isExpandedImageMicro ? "idle" : (isActive ? "active" : (hasFocusedMicroPost ? "background" : "idle"));

        return (
          <PostPreviewCard
            key={key}
            post={entry}
            dataTestId={`timeline-card-${key}`}
            isExpandedMicro={isExpandedImageMicro}
            isRelaxedMicro={isRelaxedTextMicro}
            focusState={focusState}
            microScrollChrome={supportsMicroFocus && isActive && !isExpandedImageMicro ? microScrollChrome : undefined}
            onMicroToggle={supportsMicroFocus && !isExpandedImageMicro ? () => toggleMicroPost(entry.id) : undefined}
          />
        );
      })}
      {isPostsListLayout && supportsIntersectionObserver && visibleCount < entries.length ? (
        <div ref={sentinelRef} data-testid="posts-timeline-sentinel" aria-hidden="true" />
      ) : null}
      {isPostsListLayout && !supportsIntersectionObserver && visibleCount < entries.length ? (
        <button
          type="button"
          className="posts-timeline__load-more"
          data-testid="posts-timeline-load-more"
          onClick={showMore}
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
