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
  it("renders posts-list mode as a single-column infinite-scroll surface", () => {
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class IntersectionObserver {
      observe() {}
      disconnect() {}
    };

    render(
      <PostsTimeline
        layout="posts-list"
        initialVisibleCount={6}
        entries={Array.from({ length: 8 }, (_, index) => ({
          type: "post",
          slug: `post-${index + 1}`,
          urlSlug: `post-${index + 1}`,
          title: `Post ${index + 1}`,
          summary: "summary",
          date: "2026-03-09T10:00:00.000Z",
          tags: ["Notes"],
          categories: ["Notes"],
          href: `/posts/post-${index + 1}`,
        }))}
      />
    );

    expect(screen.getByTestId("posts-timeline").getAttribute("data-layout")).toBe("posts-list");
    expect(screen.getByTestId("posts-timeline").className).toContain("posts-masonry--posts-list");
    expect(screen.getByTestId("timeline-card-post-6")).toBeTruthy();
    expect(screen.queryByTestId("timeline-card-post-7")).toBeNull();
    expect(screen.getByTestId("posts-timeline-sentinel")).toBeTruthy();

    if (originalIntersectionObserver) {
      window.IntersectionObserver = originalIntersectionObserver;
    } else {
      delete window.IntersectionObserver;
    }
  });

  it("keeps micro cards static and out of focus mode in posts-list layout", () => {
    render(
      <PostsTimeline
        layout="posts-list"
        entries={[
          {
            type: "micro",
            id: "micro-image-1",
            content: "带图 micro",
            summary: "带图 micro",
            renderedContentHtml: "<p>第一段</p><p><img src=\"/test.jpg\" alt=\"test\"></p><p>第二段</p>",
            hasImage: true,
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
          {
            type: "micro",
            id: "micro-text-1",
            content: "纯文字 micro",
            summary: "纯文字 micro",
            renderedContentHtml: "<p>第一段</p><p>第二段</p>",
            hasImage: false,
            date: "2026-03-09T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    expect(screen.getByTestId("timeline-card-micro-image-1").className).toContain("post-preview-card--micro-expanded");
    fireEvent.click(screen.getByTestId("timeline-card-micro-image-1"));
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");

    fireEvent.click(screen.getByTestId("timeline-card-micro-text-1"));
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
    expect(screen.getByTestId("timeline-card-micro-text-1").getAttribute("data-focus-state")).toBe("idle");
  });

  it("gives long text micros a taller reading surface in posts-list layout", () => {
    render(
      <PostsTimeline
        layout="posts-list"
        entries={[
          {
            type: "micro",
            id: "micro-long-1",
            content: "这是一条很长很长的纯文字 micro。".repeat(18),
            summary: "这是一条很长很长的纯文字 micro。".repeat(18),
            renderedContentHtml: "<p>这是一条很长很长的纯文字 micro。</p><p>第二段也很长。</p>",
            hasImage: false,
            date: "2026-03-10T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
          {
            type: "micro",
            id: "micro-short-1",
            content: "短一点的 micro",
            summary: "短一点的 micro",
            renderedContentHtml: "<p>短一点的 micro</p>",
            hasImage: false,
            date: "2026-03-09T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    expect(screen.getByTestId("timeline-card-micro-long-1").className).toContain("post-preview-card--micro-relaxed");
    expect(screen.getByTestId("timeline-card-micro-short-1").className).not.toContain("post-preview-card--micro-relaxed");
  });

  it("does not register micro focus event listeners in posts-list layout", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    render(
      <PostsTimeline
        layout="posts-list"
        entries={[
          {
            type: "micro",
            id: "micro-text-1",
            content: "纯文字 micro",
            summary: "纯文字 micro",
            hasImage: false,
            date: "2026-03-09T01:32:00.000Z",
            tags: ["碎碎念"],
            categories: [],
          },
        ]}
      />
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("mousedown", expect.any(Function));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("wheel", expect.any(Function), expect.anything());
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("touchmove", expect.any(Function), expect.anything());
  });

  it("falls back to a load more button when IntersectionObserver is unavailable", async () => {
    const originalIntersectionObserver = window.IntersectionObserver;
    // Simulate older browsers and constrained webviews that cannot observe the sentinel.
    delete window.IntersectionObserver;

    render(
      <PostsTimeline
        layout="posts-list"
        initialVisibleCount={6}
        entries={Array.from({ length: 8 }, (_, index) => ({
          type: "post",
          slug: `post-${index + 1}`,
          urlSlug: `post-${index + 1}`,
          title: `Post ${index + 1}`,
          summary: "summary",
          date: "2026-03-09T10:00:00.000Z",
          tags: ["Notes"],
          categories: ["Notes"],
          href: `/posts/post-${index + 1}`,
        }))}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("posts-timeline-sentinel")).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getByTestId("timeline-card-post-8")).toBeTruthy();

    if (originalIntersectionObserver) {
      window.IntersectionObserver = originalIntersectionObserver;
    }
  });

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

  it("repositions a focused micropost upward when the card sits near the viewport bottom", () => {
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

    const card = screen.getByTestId("timeline-card-micro-1");
    const originalRect = card.getBoundingClientRect.bind(card);

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 800,
    });

    card.getBoundingClientRect = () => ({
      ...originalRect(),
      top: 680,
      bottom: 760,
      left: 0,
      right: 320,
      width: 320,
      height: 80,
    });

    fireEvent.click(card);

    const scrollSurface = screen.getByTestId("timeline-card-micro-1-surface");
    expect(scrollSurface.getAttribute("data-micro-placement")).toBe("up");
    expect(scrollSurface.style.getPropertyValue("--micro-surface-max-height")).toBe("760px");
  });

  it("keeps focused micropost scrolling on the native surface without a custom range frame", () => {
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

    expect(scrollSurface.className).toBe("post-preview-card__micro-surface");
    expect(screen.queryByTestId("timeline-card-micro-1-scroll-range")).toBeNull();
    expect(screen.queryByTestId("timeline-card-micro-1-scroll-thumb")).toBeNull();
  });

  it("keeps a focused micropost active after native surface scrolling", () => {
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

    expect(screen.getByTestId("timeline-card-micro-1").className).toContain("is-micro-active");
    expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
    expect(screen.queryByTestId("timeline-card-micro-1-scroll-range")).toBeNull();
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
