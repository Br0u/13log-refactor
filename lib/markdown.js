import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

function parseShortcodeAttrs(raw = "") {
  const attrs = {};
  const re = /(\w+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = re.exec(raw))) {
    attrs[match[1]] = match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readHtmlAttr(attrs = "", name) {
  const match = String(attrs).match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"));
  return match?.[2] ?? "";
}

function setHtmlClass(attrs = "", className) {
  if (/\sclass=(["']).*?\1/i.test(attrs)) {
    return attrs.replace(/\sclass=(["'])(.*?)\1/i, (_full, quote, value) => {
      const classes = new Set(String(value).split(/\s+/).filter(Boolean));
      classes.add(className);
      return ` class=${quote}${Array.from(classes).join(" ")}${quote}`;
    });
  }

  return `${attrs} class="${className}"`;
}

function upgradeStandaloneImageParagraphs(html = "") {
  return String(html).replace(/<p>\s*(<img([^>]*)>)\s*<\/p>/g, (_full, imgTag, imgAttrs) => {
    const alt = readHtmlAttr(imgAttrs, "alt").trim();
    const caption = alt && alt.toLowerCase() !== "image" ? `<figcaption class="post-figure__caption">${escapeHtml(alt)}</figcaption>` : "";
    const nextImg = `<img${setHtmlClass(imgAttrs, "post-figure__image")}>`;
    return `<figure class="post-figure">${nextImg}${caption}</figure>`;
  });
}

function renderPlaylist(listRaw, title) {
  let list = [];
  try {
    list = JSON.parse(listRaw || "[]");
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  const items = list
    .map((song) => {
      const src = escapeHtml(song.src || "");
      const itemTitle = escapeHtml(song.title || "Untitled");
      const artist = escapeHtml(song.artist || "");
      const duration = escapeHtml(song.duration || "");
      return `<div class=\"song-item\" tabindex=\"0\" role=\"button\" data-src=\"${src}\" data-title=\"${itemTitle}\"><span class=\"song-item__icon\">play</span><div class=\"song-item__meta\"><div class=\"song-item__title\">${itemTitle}</div>${artist ? `<div class=\"song-item__artist\">${artist}</div>` : ""}</div>${duration ? `<span class=\"song-item__duration\">${duration}</span>` : ""}</div>`;
    })
    .join("\n");

  return `<div class=\"playlist-player\"><h4 class=\"playlist-title\">${escapeHtml(
    title || "Playlist"
  )}</h4><div class=\"playlist-container\">${items}</div><div class=\"player-controls\"><audio class=\"playlist-audio\" controls preload=\"metadata\"></audio></div></div>`;
}

function renderFigureImage(src, alt, paired = false) {
  const safeSrc = escapeHtml(src || "");
  const safeAlt = escapeHtml(alt || "image");
  const caption = safeAlt && safeAlt.toLowerCase() !== "image"
    ? `<figcaption class="post-figure__caption">${safeAlt}</figcaption>`
    : "";
  const figureClass = paired ? "post-figure post-figure--paired" : "post-figure";
  return `<figure class="${figureClass}"><img class="post-figure__image" src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async">${caption}</figure>`;
}

export function preprocessShortcodes(markdown) {
  let out = markdown || "";

  out = out.replace(/\{\{<\s*spoiler\s*>\}\}([\s\S]*?)\{\{<\s*\/spoiler\s*>\}\}/g, (_m, inner) => {
    return `<span class=\"spoiler\" tabindex=\"0\" role=\"button\" aria-expanded=\"false\">${inner}</span>`;
  });

  out = out.replace(/\{\{<\s*about_hero([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    const src = escapeHtml(attrs.src || "");
    const alt = escapeHtml(attrs.alt || "about image");
    return `<figure class=\"about-hero\"><img src=\"${src}\" alt=\"${alt}\" loading=\"lazy\" decoding=\"async\"></figure>`;
  });

  out = out.replace(/\{\{<\s*link([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    const href = escapeHtml(attrs.href || attrs.link || "#");
    const title = escapeHtml(attrs.title || href);
    return `<a href=\"${href}\" target=\"_blank\" rel=\"noopener\" class=\"link-card link-card--default\"><h3 class=\"link-card__heading\">${title}</h3></a>`;
  });

  out = out.replace(/\{\{<\s*music([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    const src = escapeHtml(attrs.src || "");
    const title = escapeHtml(attrs.title || "Music");
    const autoplay = attrs.autoplay === "true" ? "autoplay" : "";
    const loop = attrs.loop === "true" ? "loop" : "";
    return `<div class=\"music-player\"><h4 class=\"music-player__title\">Music: ${title}</h4><audio class=\"music-player__audio\" controls preload=\"metadata\" ${autoplay} ${loop}><source src=\"${src}\" type=\"audio/mpeg\"></audio></div>`;
  });

  out = out.replace(/\{\{<\s*bgm([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    const src = escapeHtml(attrs.src || "");
    const title = escapeHtml(attrs.title || "BGM");
    const artist = escapeHtml(attrs.artist || "");
    return `<div class=\"bgm-player\"><div class=\"bgm-player__header\"><span class=\"bgm-player__icon\">?</span><h4 class=\"bgm-player__title\">${title}</h4></div>${artist ? `<p class=\"bgm-player__artist\">${artist}</p>` : ""}<audio class=\"bgm-player__audio\" controls preload=\"metadata\"><source src=\"${src}\" type=\"audio/mpeg\"></audio></div>`;
  });

  out = out.replace(/\{\{<\s*playlist([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    return renderPlaylist(attrs.list, attrs.title);
  });

  out = out.replace(/\{\{<\s*duo_images([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    const left = attrs.left || "";
    const right = attrs.right || "";
    const leftAlt = attrs.leftAlt || attrs.leftCaption || "左图";
    const rightAlt = attrs.rightAlt || attrs.rightCaption || "右图";

    if (!left || !right) return "";

    return `<div class="post-figure-pair">${renderFigureImage(left, leftAlt, true)}${renderFigureImage(right, rightAlt, true)}</div>`;
  });

  out = out.replace(/\{\{<\s*details\s*"([^"]+)"\s*>\}\}/g, (_m, summary) => {
    return `<details><summary>${escapeHtml(summary)}</summary>`;
  });
  out = out.replace(/\{\{<\s*\/details\s*>\}\}/g, "</details>");

  return out;
}

export async function renderMarkdownToHtml(markdown) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown || "");

  return upgradeStandaloneImageParagraphs(String(result));
}

function preserveSoftBreaks(markdown = "") {
  return String(markdown).replace(/(?<!\n)\n(?!\n)/g, "  \n");
}

export async function renderMicroMarkdownToHtml(markdown) {
  const prepared = preprocessShortcodes(preserveSoftBreaks(markdown || ""));
  return renderMarkdownToHtml(prepared);
}

function stripHtml(text) {
  return (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function stripMarkdown(text) {
  return (text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/^>\s?/gm, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/[*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPlainSummary(markdownOrHtml = "") {
  return stripMarkdown(stripHtml(preprocessShortcodes(markdownOrHtml)));
}

function stripHeadingInnerHtml(inner = "") {
  return stripHtml(inner).replace(/\s+/g, " ").replace(/\s#$/, "").trim();
}

function slugifyHeading(text = "") {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\- ]+/g, "")
    .replace(/\s+/g, "-");
}

function ensureUniqueId(base, used) {
  let id = base || `section-${Math.random().toString(36).slice(2, 8)}`;
  if (!used.has(id)) {
    used.add(id);
    return id;
  }
  let i = 2;
  while (used.has(`${id}-${i}`)) i += 1;
  const next = `${id}-${i}`;
  used.add(next);
  return next;
}

export function withHeadingAnchors(html = "") {
  const used = new Set();
  return (html || "").replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (full, level, attrs, inner) => {
    const idMatch = attrs.match(/\sid=(["'])([^"']+)\1/);
    const text = stripHeadingInnerHtml(inner);
    const id = ensureUniqueId(idMatch?.[2] || slugifyHeading(text), used);
    const attrsWithId = idMatch ? attrs : `${attrs} id="${id}"`;
    if (inner.includes('class="anchor"')) {
      return `<h${level}${attrsWithId}>${inner}</h${level}>`;
    }
    return `<h${level}${attrsWithId}>${inner}<a hidden class="anchor" aria-hidden="true" href="#${id}">#</a></h${level}>`;
  });
}

export function buildTocHtml(html = "") {
  const matches = Array.from((html || "").matchAll(/<h([1-3])[^>]*\sid=(["'])([^"']+)\2[^>]*>([\s\S]*?)<\/h\1>/g));
  if (!matches.length) return "";

  const items = matches
    .map((m) => {
      const level = Number(m[1]);
      const id = m[3];
      const text = stripHeadingInnerHtml(m[4]);
      if (!id || !text) return null;
      return { level, id, text };
    })
    .filter((item) => item !== null);
  if (!items.length) return "";

  const out = [];
  let current = 0;
  for (const item of items) {
    while (current < item.level) {
      out.push("<ul>");
      current += 1;
    }
    while (current > item.level) {
      out.push("</ul>");
      current -= 1;
    }
    out.push(`<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`);
  }
  while (current > 0) {
    out.push("</ul>");
    current -= 1;
  }

  return `<div class="toc"><details open><summary accesskey="c" title="(Alt + C)">Table of Contents</summary><div class="inner">${out.join("")}</div></details></div>`;
}
