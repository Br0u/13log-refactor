// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initTocRail } from "../../app/components/client-enhancements/tocRail.js";

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    value: 1440,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("toc rail enhancement", () => {
  it("clears and hides the TOC rail when leaving the link page", () => {
    document.body.innerHTML = `
      <main>
        <section>
          <h2 class="link-section-title">Tech Blogs</h2>
          <h2 class="link-section-title">Content Blogs</h2>
        </section>
      </main>
      <aside class="page-toc-rail" id="page-toc-rail" hidden>
        <ul class="page-toc-rail__list" id="page-toc-rail-list"></ul>
      </aside>
    `;
    window.history.replaceState(null, "", "/link");

    const cleanup = initTocRail();
    const rail = document.getElementById("page-toc-rail");
    const list = document.getElementById("page-toc-rail-list");

    expect(rail?.hidden).toBe(false);
    expect(list?.children.length).toBe(2);

    cleanup();

    expect(rail?.hidden).toBe(true);
    expect(list?.children.length).toBe(0);
  });

  it("keeps the floating TOC rail hidden on post pages", () => {
    document.body.innerHTML = `
      <main>
        <article class="post-single">
          <div class="post-content">
            <h2>Section One</h2>
            <h3>Section Two</h3>
          </div>
        </article>
      </main>
      <aside class="page-toc-rail" id="page-toc-rail" hidden>
        <ul class="page-toc-rail__list" id="page-toc-rail-list"></ul>
      </aside>
    `;
    window.history.replaceState(null, "", "/posts/example");

    const cleanup = initTocRail();
    const rail = document.getElementById("page-toc-rail");
    const list = document.getElementById("page-toc-rail-list");

    expect(rail?.hidden).toBe(true);
    expect(list?.children.length).toBe(0);

    cleanup();

    expect(rail?.hidden).toBe(true);
    expect(list?.children.length).toBe(0);
  });
});
