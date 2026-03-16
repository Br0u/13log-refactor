// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PostsTimeline from "../../components/blog/PostsTimeline";

afterEach(() => {
  cleanup();
});

describe("PostsTimeline", () => {
  it("focuses a micro post in place and shrinks the rest of the timeline", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
          {
            type: "micro",
            id: "micro-2",
            content: "第二条短句",
            summary: "第二条短句",
            date: "2026-03-09T11:00:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
          {
            type: "post",
            slug: "post-1",
            urlSlug: "post-1",
            title: "Long post",
            summary: "summary",
            date: "2026-03-09T10:00:00.000Z",
            tags: ["Notes"],
            categories: ["Notes"],
            href: "/posts/post-1",
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("active");
    expect(screen.getByTestId("timeline-card-micro-2").getAttribute("data-focus-state")).toBe("background");
    expect(screen.getByTestId("timeline-card-post-1").getAttribute("data-focus-state")).toBe("background");
  });

  it("clears the focused micro post when Escape is pressed", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("idle");
  });

  it("clears the focused micro post when clicking outside the active card", () => {
    render(
      <div>
        <button type="button">outside</button>
        <PostsTimeline
          entries={[
            {
              type: "micro",
              id: "micro-1",
              content: "转折点 II",
              summary: "转折点 II",
              date: "2026-03-10T01:32:00.000Z",
              tags: ["碎碎念"],
              categories: [],
            },
          ]}
        />
      </div>
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("idle");
  });

  it("does not switch directly to another micro post while one is focused", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
          {
            type: "micro",
            id: "micro-2",
            content: "第二条短句",
            summary: "第二条短句",
            date: "2026-03-09T10:00:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    fireEvent.click(screen.getByTestId("timeline-card-micro-2"));

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("idle");
    expect(screen.getByTestId("timeline-card-micro-2").getAttribute("data-focus-state")).toBe("idle");
  });

  it("does not mutate body scroll styles while a micro post is focused", () => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));

    expect(document.body.style.overflow).toBe(originalOverflow);
    expect(document.body.style.position).toBe(originalPosition);
    expect(document.body.style.top).toBe(originalTop);
    expect(document.body.style.width).toBe(originalWidth);
  });

  it("clears the focused micro post as soon as scrolling starts", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    fireEvent.wheel(window);

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("idle");
  });

  it("prevents wheel scrolling from moving the page while dismissing a focused micro post", async () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "转折点 II",
            summary: "转折点 II",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const wheelEvent = new Event("wheel", { bubbles: true, cancelable: true });
    const dispatchResult = window.dispatchEvent(wheelEvent);

    expect(dispatchResult).toBe(false);
    expect(wheelEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    });
  });
});
