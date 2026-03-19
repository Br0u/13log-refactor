"use client";

import React from "react";
import PostPreviewCard from "./PostPreviewCard";
import { useFocusedMicroPost } from "./useFocusedMicroPost";
import { usePostsListVisibility } from "./usePostsListVisibility";

const DEFAULT_VISIBLE_COUNT = 6;

export default function PostsTimeline({ entries = [], layout = "masonry", initialVisibleCount = DEFAULT_VISIBLE_COUNT }) {
  const isPostsListLayout = layout === "posts-list";
  const { focusedMicroPostId, microScrollChrome, timelineRef, toggleMicroPost } = useFocusedMicroPost();
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
        const isActive = isMicro && focusedMicroPostId === entry.id;
        const hasFocusedMicroPost = focusedMicroPostId !== "";
        const focusState = isExpandedImageMicro ? "idle" : (isActive ? "active" : (hasFocusedMicroPost ? "background" : "idle"));

        return (
          <PostPreviewCard
            key={key}
            post={entry}
            dataTestId={`timeline-card-${key}`}
            isExpandedMicro={isExpandedImageMicro}
            focusState={focusState}
            microScrollChrome={isActive && !isExpandedImageMicro ? microScrollChrome : undefined}
            onMicroToggle={isMicro && !isExpandedImageMicro ? () => toggleMicroPost(entry.id) : undefined}
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
