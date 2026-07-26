// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { initLinkPreview } from "../../app/components/client-enhancements/linkPreview.js";

afterEach(() => {
  document.body.innerHTML = "";
  window.localStorage?.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (window.IntersectionObserver) {
    delete window.IntersectionObserver;
  }
});

describe("link preview enhancement", () => {
  it("provides browser localStorage for cache behavior", () => {
    expect(window.localStorage).toBeDefined();
  });

  it("applies a fresh cached preview without fetching", () => {
    let observerCallback;
    const unobserve = vi.fn();

    window.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }

      observe() {}
      unobserve = unobserve;
      disconnect() {}
    };
    vi.stubGlobal("fetch", vi.fn());

    const url = "https://example.com/cached";
    window.localStorage.setItem(
      "link-preview-cache-v1",
      JSON.stringify({
        [url]: {
          ts: Date.now(),
          data: {
            title: "Cached title",
            description: "Cached description",
            image: "",
          },
        },
      })
    );
    document.body.innerHTML = `
      <article data-link-card data-preview-enabled="true" data-preview-url="${url}">
        <div data-preview-container class="is-empty"></div>
        <div data-preview-title></div>
        <div data-preview-desc class="is-empty"></div>
      </article>
    `;

    const card = document.querySelector("[data-link-card]");
    initLinkPreview();
    observerCallback([{ isIntersecting: true, target: card }], { unobserve });

    expect(document.querySelector("[data-preview-title]")?.textContent).toBe("Cached title");
    expect(document.querySelector("[data-preview-desc]")?.textContent).toBe("Cached description");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(unobserve).toHaveBeenCalledWith(card);
  });

  it("returns a cleanup that disconnects the observer on route teardown", () => {
    const disconnect = vi.fn();
    const observe = vi.fn();

    window.IntersectionObserver = class IntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }

      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    };

    document.body.innerHTML = `
      <article data-link-card data-preview-enabled="true" data-preview-url="https://example.com">
        <div data-preview-container class="is-empty"></div>
        <div data-preview-title></div>
        <div data-preview-desc class="is-empty"></div>
      </article>
    `;

    const cleanup = initLinkPreview();

    expect(typeof cleanup).toBe("function");
    expect(observe).toHaveBeenCalledTimes(1);

    cleanup();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("does not apply fetched preview content after cleanup runs", async () => {
    let observerCallback;

    window.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    };

    let resolveFetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = () =>
              resolve({
                ok: true,
                json: async () => ({
                  status: "success",
                  data: {
                    title: "Fetched title",
                    description: "Fetched description",
                    image: { url: "https://example.com/preview.png" },
                  },
                }),
              });
          })
      )
    );

    document.body.innerHTML = `
      <article data-link-card data-preview-enabled="true" data-preview-url="https://example.com">
        <div data-preview-container class="is-empty"></div>
        <div data-preview-title></div>
        <div data-preview-desc class="is-empty"></div>
      </article>
    `;

    const card = document.querySelector("[data-link-card]");
    const title = document.querySelector("[data-preview-title]");
    const desc = document.querySelector("[data-preview-desc]");
    const container = document.querySelector("[data-preview-container]");

    const cleanup = initLinkPreview();
    observerCallback([{ isIntersecting: true, target: card }], { unobserve() {} });

    cleanup();
    resolveFetch();
    await Promise.resolve();
    await Promise.resolve();

    expect(title?.textContent).toBe("");
    expect(desc?.textContent).toBe("");
    expect(container?.querySelector("img")).toBeNull();
  });
});
