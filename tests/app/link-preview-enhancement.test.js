// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { initLinkPreview } from "../../app/components/client-enhancements/linkPreview.js";

afterEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
  vi.restoreAllMocks();
  if (window.IntersectionObserver) {
    delete window.IntersectionObserver;
  }
  if (globalThis.fetch) {
    delete globalThis.fetch;
  }
});

describe("link preview enhancement", () => {
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
    globalThis.fetch = vi.fn(
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
