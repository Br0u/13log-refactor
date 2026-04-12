// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initImageZoom } from "../../app/components/client-enhancements/imageZoom.js";

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.style.overflow = "";
  vi.restoreAllMocks();
});

describe("image zoom enhancement", () => {
  it("only binds to post detail, photo detail, and micropost images", () => {
    document.body.innerHTML = `
      <article class="post-single">
        <div class="post-content">
          <img class="post-figure__image" src="/post.jpg" alt="post image">
        </div>
      </article>
      <div class="photo-album-stream">
        <img class="photo-album-image" src="/album.jpg" alt="album image">
      </div>
      <article class="post-preview-card post-preview-card--micro">
        <img class="post-preview-card__micro-image" src="/micro.jpg" alt="micro image">
      </article>
      <footer>
        <img class="footer-badge__image" src="/badge.svg" alt="badge">
      </footer>
    `;

    const cleanup = initImageZoom();

    expect(document.querySelector('.post-figure__image')?.getAttribute('data-image-zoom-bound')).toBe('true');
    expect(document.querySelector('.photo-album-image')?.getAttribute('data-image-zoom-bound')).toBe('true');
    expect(document.querySelector('.post-preview-card__micro-image')?.getAttribute('data-image-zoom-bound')).toBe('true');
    expect(document.querySelector('.footer-badge__image')?.getAttribute('data-image-zoom-bound')).toBeNull();

    cleanup();
  });

  it("opens a lightbox and closes via backdrop, button, and Escape", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });

    document.body.innerHTML = `
      <article class="post-single">
        <div class="post-content">
          <img class="post-figure__image" src="/post.jpg" alt="post image">
        </div>
      </article>
    `;

    const cleanup = initImageZoom();
    const image = document.querySelector('.post-figure__image');
    image?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    let overlay = document.querySelector('.image-lightbox');
    expect(overlay).toBeTruthy();
    expect(overlay?.classList.contains('is-visible')).toBe(true);
    expect(document.querySelector('.image-lightbox__close')?.getAttribute('aria-label')).toBe('关闭图片预览');
    expect(document.documentElement.style.overflow).toBe('hidden');

    document.querySelector('.image-lightbox__dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('.image-lightbox')).toBeTruthy();

    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('.image-lightbox')).toBeNull();

    image?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.querySelector('.image-lightbox__close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('.image-lightbox')).toBeNull();

    image?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('.image-lightbox')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');

    cleanup();
    vi.useRealTimers();
  });

  it("focuses overlay controls without scrolling the background page", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });

    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");

    document.body.innerHTML = `
      <article class="post-single">
        <div class="post-content">
          <img class="post-figure__image" src="/post.jpg" alt="post image" tabindex="0">
        </div>
      </article>
    `;

    const cleanup = initImageZoom();
    const image = document.querySelector('.post-figure__image');
    image?.focus();
    image?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const closeButton = document.querySelector('.image-lightbox__close');
    expect(closeButton).toBeTruthy();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.runAllTimers();

    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });

    cleanup();
    vi.useRealTimers();
  });

  it("locks the page scroll position while the lightbox is open", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });

    const scrollToSpy = vi.fn();
    Object.defineProperty(window, "scrollY", {
      value: 240,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollTo", {
      value: scrollToSpy,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      value: 1264,
      configurable: true,
    });

    document.body.innerHTML = `
      <article class="post-single">
        <div class="post-content">
          <img class="post-figure__image" src="/post.jpg" alt="post image">
        </div>
      </article>
    `;

    document.body.style.scrollBehavior = "smooth";
    document.documentElement.style.scrollBehavior = "smooth";

    const cleanup = initImageZoom();
    document.querySelector('.post-figure__image')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');
    expect(document.body.style.width).toBe('100%');
    expect(document.body.style.paddingRight).toBe('16px');

    document.querySelector('.image-lightbox__close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.runAllTimers();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
    expect(document.body.style.paddingRight).toBe('');
    expect(document.body.style.scrollBehavior).toBe('smooth');
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 240);

    cleanup();
    vi.useRealTimers();
  });
});
