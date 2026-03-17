// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PostsTimeline from "../../components/blog/PostsTimeline";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

  it("keeps a focused micro post open when wheel scrolling starts inside the active card content", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");

    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 24 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    const wheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });
    scrollSurface.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(false);
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("active");
  });

  it("keeps a focused micro post open when wheel scrolling reaches the card boundary", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");

    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 360 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 600 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    const wheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });
    scrollSurface.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("active");
  });

  it("dismisses a focused micro post when wheel scrolling starts outside the active card", async () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const wheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });
    document.body.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
      expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("idle");
    });
  });

  it("keeps a focused micro post open when touch scrolling started inside the active card", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p><p>第四段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");

    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 24 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 640 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    fireEvent.touchStart(scrollSurface, {
      touches: [{ clientY: 320 }],
    });
    const touchMoveEvent = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(touchMoveEvent, "touches", {
      configurable: true,
      value: [{ clientY: 260 }],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(touchMoveEvent.defaultPrevented).toBe(false);
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("active");
  });

  it("keeps a focused micro post open when touch scrolling reaches the card boundary", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p><p>第四段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");

    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 400 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 640 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    fireEvent.touchStart(scrollSurface, {
      touches: [{ clientY: 320 }],
    });
    const touchMoveEvent = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(touchMoveEvent, "touches", {
      configurable: true,
      value: [{ clientY: 260 }],
    });
    scrollSurface.dispatchEvent(touchMoveEvent);

    expect(touchMoveEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.getByTestId("timeline-card-micro-1").getAttribute("data-focus-state")).toBe("active");
  });

  it("updates the active micropost range frame as the card scroll position changes", () => {
    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p><p>第四段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");

    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 160 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 640 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    fireEvent.scroll(scrollSurface);

    const range = screen.getByTestId("timeline-card-micro-1-scroll-range");
    expect(range.getAttribute("data-scrollable")).toBe("true");
    expect(range.style.getPropertyValue("--micro-scroll-progress")).toBe("0.4");
    expect(range.style.getPropertyValue("--micro-scroll-window")).toBe("0.375");
  });

  it("keeps the active micropost range frame highlighted briefly after scrolling", async () => {
    vi.useFakeTimers();

    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "一段很长很长的内容",
            summary: "一段很长很长的内容",
            renderedContentHtml: "<p>第一段</p><p>第二段</p><p>第三段</p><p>第四段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");
    Object.defineProperty(scrollSurface, "scrollTop", { configurable: true, writable: true, value: 160 });
    Object.defineProperty(scrollSurface, "scrollHeight", { configurable: true, value: 640 });
    Object.defineProperty(scrollSurface, "clientHeight", { configurable: true, value: 240 });

    fireEvent.scroll(scrollSurface);

    const range = screen.getByTestId("timeline-card-micro-1-scroll-range");
    expect(range.getAttribute("data-scroll-hint-active")).toBe("true");

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(range.getAttribute("data-scroll-hint-active")).toBe("false");
    vi.useRealTimers();
  });

  it("does not focus a micropost card when its like button is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 1 }),
    })));

    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "可点赞的短句",
            summary: "可点赞的短句",
            renderedContentHtml: "<p>第一段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
            likeCount: 0,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1-like"));

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    await waitFor(() => {
      expect(screen.getByText("1")).toBeTruthy();
    });
  });

  it("keeps an active micropost focused when its like button is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 4 }),
    })));

    render(
      <PostsTimeline
        entries={[
          {
            type: "micro",
            id: "micro-1",
            content: "可点赞的短句",
            summary: "可点赞的短句",
            renderedContentHtml: "<p>第一段</p>",
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
            likeCount: 3,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
    fireEvent.click(screen.getByTestId("timeline-card-micro-1-like"));

    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    await waitFor(() => {
      expect(screen.getByText("4")).toBeTruthy();
    });
  });
});
