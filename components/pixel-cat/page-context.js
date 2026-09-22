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
