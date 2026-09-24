export function collectPageContext(path) {
  const root = document.querySelector(".post-content") || document.querySelector("#main-content");
  const targets = new Map();
  const anchors = [];
  const visible = element => { const r = element.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  const isPublic = element => !element.closest("form, .post-interactions, [data-cat-private]");
  const candidates = Array.from(root?.querySelectorAll("h1, h2, h3, .post-title, .link-essay-entry__title, img") || []);
  candidates.sort((a, b) => Number(visible(b)) - Number(visible(a))).forEach(element => {
    if (anchors.length >= 12 || element.closest("form, .post-interactions, [data-cat-private]")) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const id = `cat-target-${anchors.length}`;
    targets.set(id, element);
    anchors.push({ id, text: (element.textContent || element.getAttribute("alt") || "图片（未提供图像内容）").trim().slice(0, 100) });
  });
  const copy = root?.cloneNode(true);
  copy?.querySelectorAll("form, input, textarea, script, style, .post-interactions, [data-cat-private]").forEach(node => node.remove());
  const visibleText = Array.from(root?.querySelectorAll("h1, h2, h3, p, li") || []).filter(element => isPublic(element) && visible(element)).map(element => element.textContent).join(" ").slice(0, 3000);
  const excerpt = `${visibleText ? `当前可见内容：${visibleText}\n页面正文：` : ""}${copy?.textContent || ""}`;
  const selection = window.getSelection();
  const selectedElement = selection?.anchorNode?.parentElement;
  const focusElement = selection?.focusNode?.parentElement;
  const publicSelection = root?.contains(selectedElement) && root?.contains(focusElement)
    && !selectedElement?.closest("form, .post-interactions, [data-cat-private]")
    && !focusElement?.closest("form, .post-interactions, [data-cat-private]");
  const selectedCopy = publicSelection && selection?.rangeCount ? selection.getRangeAt(0).cloneContents() : null;
  selectedCopy?.querySelectorAll("form, input, textarea, script, style, .post-interactions, [data-cat-private]").forEach(node => node.remove());
  return {
    targets,
    context: {
      path, title: document.title.slice(0, 200),
      excerpt: excerpt.replace(/\s+/g, " ").trim().slice(0, 6000),
      selection: selectedCopy?.textContent?.slice(0, 1200) || "",
      anchors,
    },
  };
}

export function waitForCat(ms, signal) {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(false); return; }
    const abort = () => { clearTimeout(timer); resolve(false); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(true); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

const PRIVATE_LAYOUT = "form, input, textarea, select, button, script, style, .post-interactions, [data-cat-private], [contenteditable]:not([contenteditable='false']), [hidden], [aria-hidden='true'], [inert], .pixel-cat-layer";
const playgroundRoot = () => document.querySelector(".post-content") || document.querySelector("#main-content");

function visibleSurface(element, rect) {
  const width = window.visualViewport?.width || window.innerWidth;
  const height = window.visualViewport?.height || window.innerHeight;
  if (!rect || rect.top < 96 || rect.top > height - 24 || rect.height <= 0 || Math.min(rect.right, width) - Math.max(rect.left, 0) < 48) return false;
  if (element.closest(PRIVATE_LAYOUT) || element.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) === false) return false;
  const style = getComputedStyle(element);
  if (style.visibility !== "visible" || style.display === "none" || style.opacity === "0") return false;
  const x = (Math.max(0, rect.left) + Math.min(width, rect.right)) / 2;
  const hit = document.elementsFromPoint?.(x, rect.top + Math.min(8, rect.height / 2)).find(item => !item.closest(".pixel-cat-layer"));
  return !hit || hit === element || element.contains(hit);
}

// Each text Range is a rendered line, so wrapped prose becomes several shelves.
export function collectCatSurfaces() {
  const root = playgroundRoot(), surfaces = [];
  if (!root || location.pathname.startsWith("/admin")) return surfaces;
  for (const element of root.querySelectorAll("img, h1, h2, h3, p, li, blockquote")) {
    if (element.closest(PRIVATE_LAYOUT)) continue;
    if (element.tagName === "IMG") {
      if (element.getAttribute("alt") === "") continue;
      const rect = element.getBoundingClientRect();
      if (visibleSurface(element, rect)) surfaces.push({ element, kind: "image", rect });
      continue;
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim() || node.parentElement.closest(PRIVATE_LAYOUT) || surfaces.some(item => item.node === node)) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      Array.from(range.getClientRects?.() || []).forEach((rect, line) => {
        if (visibleSurface(node.parentElement, rect)) surfaces.push({ element: node.parentElement, kind: "text", node, text: node.textContent, range, line, rect });
      });
    }
    // ponytail: sample at most 48 visible shelves; spatial indexing only if large pages need it.
    if (surfaces.length >= 48) break;
  }
  return surfaces.slice(0, 48);
}

export function readCatSurface(surface) {
  if (!surface.element.isConnected || !playgroundRoot()?.contains(surface.element)) return null;
  if (surface.node && (!surface.element.contains(surface.node) || surface.node.parentElement.closest(PRIVATE_LAYOUT) || surface.node.textContent !== surface.text)) return null;
  const rect = surface.kind === "image" ? surface.element.getBoundingClientRect() : surface.range.getClientRects()[surface.line];
  return visibleSurface(surface.element, rect) ? rect : null;
}

export function pickCatLetter(surface, position, facing = 1) {
  if (!surface.node || !readCatSurface(surface)) return null;
  const letters = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(surface.text)).filter(item => /[\p{L}\p{N}]/u.test(item.segment));
  const line = readCatSurface(surface);
  const candidates = [];
  for (const letter of letters) {
    const range = document.createRange();
    range.setStart(surface.node, letter.index); range.setEnd(surface.node, letter.index + letter.segment.length);
    const rect = range.getBoundingClientRect();
    if (rect.width <= 0 || Math.abs(rect.top - line.top) > 2 || rect.left < 0 || rect.right > window.innerWidth) continue;
    const center = rect.left + rect.width / 2;
    if (center < position.x + 22 || center > position.x + 76 || Math.abs(rect.top - position.y - 80) > 6) continue;
    const { fontFamily, fontSize, fontWeight, color } = getComputedStyle(surface.element);
    candidates.push({ text: letter.segment, rect, range, style: { fontFamily, fontSize, fontWeight, color, lineHeight: `${rect.height}px` } });
  }
  const pawX = position.x + (facing === 1 ? 64 : 32);
  return candidates.sort((a, b) => Math.abs(a.rect.left + a.rect.width / 2 - pawX) - Math.abs(b.rect.left + b.rect.width / 2 - pawX))[0] || null;
}

export function hideCatLetter(toy) {
  // Native ranges leave React's text nodes, selection and line wrapping intact.
  if (!globalThis.CSS?.highlights || !globalThis.Highlight) return null;
  const highlight = new Highlight(toy.range);
  CSS.highlights.set("pixel-cat-held-letter", highlight);
  return () => {
    if (CSS.highlights.get("pixel-cat-held-letter") === highlight) CSS.highlights.delete("pixel-cat-held-letter");
  };
}
