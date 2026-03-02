import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import TOML from "@iarna/toml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const ROOT = process.cwd();
const LOCAL_CONTENT_DIR = path.resolve(ROOT, "content");
const PARENT_CONTENT_DIR = path.resolve(ROOT, "..", "content");
const CONTENT_DIR = fs.existsSync(LOCAL_CONTENT_DIR) ? LOCAL_CONTENT_DIR : PARENT_CONTENT_DIR;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.13log.live").replace(/\/+$/, "");

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function parseShortcodeAttrs(raw = "") {
  const attrs = {};
  const re = /(\w+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(raw))) {
    const key = m[1];
    const value = m[3] ?? m[4] ?? "";
    attrs[key] = value;
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

function preprocessShortcodes(markdown) {
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
    return `<div class=\"bgm-player\"><div class=\"bgm-player__header\"><span class=\"bgm-player__icon\">♫</span><h4 class=\"bgm-player__title\">${title}</h4></div>${artist ? `<p class=\"bgm-player__artist\">${artist}</p>` : ""}<audio class=\"bgm-player__audio\" controls preload=\"metadata\"><source src=\"${src}\" type=\"audio/mpeg\"></audio></div>`;
  });

  out = out.replace(/\{\{<\s*playlist([^>]*)>\}\}/g, (_m, rawAttrs) => {
    const attrs = parseShortcodeAttrs(rawAttrs);
    return renderPlaylist(attrs.list, attrs.title);
  });

  out = out.replace(/\{\{<\s*details\s*"([^"]+)"\s*>\}\}/g, (_m, summary) => {
    return `<details><summary>${escapeHtml(summary)}</summary>`;
  });
  out = out.replace(/\{\{<\s*\/details\s*>\}\}/g, "</details>");

  return out;
}

function parseFrontmatter(source) {
  const raw = source.trimStart();

  if (raw.startsWith("+++")) {
    const closeIndex = raw.indexOf("\n+++", 3);
    if (closeIndex > -1) {
      const fm = raw.slice(3, closeIndex).trim();
      const body = raw.slice(closeIndex + 4).trimStart();
      try {
        return { data: TOML.parse(fm), content: body };
      } catch {
        return { data: {}, content: source };
      }
    }
  }

  if (raw.startsWith("---")) {
    try {
      const parsed = matter(source);
      return { data: parsed.data || {}, content: parsed.content || "" };
    } catch {
      return { data: {}, content: source };
    }
  }

  return { data: {}, content: source };
}

function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const entry of files) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...getMarkdownFiles(p));
      continue;
    }
    if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
      out.push(p);
    }
  }

  return out;
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function makeSlug(filePath, baseDir) {
  const rel = path.relative(baseDir, filePath);
  return rel.replace(/\\/g, "/").replace(/\.(md|markdown)$/i, "");
}

function toUrlSegment(input = "") {
  return (input || "")
    .normalize("NFKC")
    .replace(/[·•`~!@#$%^&*()+=\[\]{}|\\:;"'<>,.?/，。！？：；、“”‘’（）【】《》]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function toUrlSlugPath(slug = "") {
  return (slug || "")
    .split("/")
    .map((seg) => toUrlSegment(seg))
    .filter(Boolean)
    .join("/");
}

function normalizeEntry(filePath, baseDir) {
  const source = readFileSafe(filePath);
  const { data, content } = parseFrontmatter(source);
  const slug = makeSlug(filePath, baseDir);
  const processed = preprocessShortcodes(content);
  const plain = stripMarkdown(stripHtml(processed));

  return {
    slug,
    urlSlug: data.slug ? toUrlSlugPath(String(data.slug)) : toUrlSlugPath(slug),
    title: data.title || slug,
    description: data.description || "",
    summary: plain.slice(0, 220),
    draft: Boolean(data.draft),
    date: normalizeDate(data.date),
    tags: Array.isArray(data.tags) ? data.tags : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    readingTime: Number(data.readingTime) || null,
    content: processed,
    data,
  };
}

export function getSectionEntries(section) {
  const dir = path.join(CONTENT_DIR, section);
  const files = getMarkdownFiles(dir).filter((f) => !f.endsWith("_index.md"));

  return files
    .map((f) => normalizeEntry(f, dir))
    .filter((p) => !p.draft)
    .sort((a, b) => {
      if (!a.date && !b.date) return a.slug.localeCompare(b.slug);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
}

export function getSectionEntryBySlug(section, slug) {
  const baseDir = path.join(CONTENT_DIR, section);
  const variants = [
    path.join(baseDir, `${slug}.md`),
    path.join(baseDir, `${slug}.markdown`),
  ];

  const filePath = variants.find((p) => fs.existsSync(p));
  if (!filePath) {
    const entries = getSectionEntries(section);
    return entries.find((entry) => entry.urlSlug === slug || entry.slug === slug) || null;
  }

  const entry = normalizeEntry(filePath, baseDir);
  if (entry.draft) return null;
  return entry;
}

export function getSectionIndex(section, fallbackTitle) {
  const filePath = path.join(CONTENT_DIR, section, "_index.md");
  const source = readFileSafe(filePath);
  const { data, content } = parseFrontmatter(source);
  return {
    title: data.title || fallbackTitle,
    description: data.description || "",
    content: preprocessShortcodes(content),
  };
}

export function getLinkEntries() {
  const entries = getSectionEntries("link").map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    link: entry.data.link || "#",
    description: entry.description || (entry.content || "").slice(0, 120),
    site: entry.data.site || "",
    category: entry.data.category || "other",
    image: entry.data.image || "",
    children: Array.isArray(entry.data.children) ? entry.data.children : [],
  }));

  const order = { tech: 1, content: 2, podcast: 3, other: 4 };
  entries.sort((a, b) => {
    const oa = order[a.category] || 99;
    const ob = order[b.category] || 99;
    if (oa !== ob) return oa - ob;
    return a.title.localeCompare(b.title);
  });

  return entries;
}

export function getPosts() {
  return getSectionEntries("posts");
}

export function getPostBySlug(slug) {
  return getSectionEntryBySlug("posts", slug);
}

export function getCodingPosts() {
  return getSectionEntries("coding");
}

export function getCodingPostBySlug(slug) {
  return getSectionEntryBySlug("coding", slug);
}

export function getLinkPageIntro() {
  return getSectionIndex("link", "Link");
}

export function getCodingIndex() {
  return getSectionIndex("coding", "Coding");
}

export function getAboutPage() {
  const filePath = path.join(CONTENT_DIR, "About.md");
  const source = readFileSafe(filePath);
  const { data, content } = parseFrontmatter(source);
  return {
    title: data.title || "About",
    description: data.description || "",
    content: preprocessShortcodes(content),
  };
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

function normalizeRootRegularEntry(filePath) {
  const source = readFileSafe(filePath);
  const { data, content } = parseFrontmatter(source);
  const rel = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  const slug = rel.replace(/\.(md|markdown)$/i, "");
  const section = slug.includes("/") ? slug.split("/")[0].toLowerCase() : slug.toLowerCase();
  const plain = stripMarkdown(stripHtml(preprocessShortcodes(content)));
  const summary = (data.description || plain).slice(0, 260);

  let permalinkPath = `/${slug.toLowerCase()}/`;
  if (section === "posts" || section === "coding" || section === "link") {
    const localSlug = slug.split("/").slice(1).join("/");
    permalinkPath = `/${section}/${encodeURIComponent(toUrlSlugPath(localSlug))}`;
  } else if (slug.toLowerCase() === "about") {
    permalinkPath = "/about/";
  }

  return {
    title: data.title || slug,
    date: normalizeDate(data.date),
    description: data.description || "",
    plain,
    summary,
    permalink: `${SITE_URL}${permalinkPath}`,
    layout: data.layout || "",
    searchHidden: Boolean(data.searchHidden),
    draft: Boolean(data.draft),
  };
}

function getAllRegularEntries() {
  const files = getMarkdownFiles(CONTENT_DIR).filter((f) => !f.endsWith("_index.md"));
  return files
    .map((file) => normalizeRootRegularEntry(file))
    .filter((entry) => !entry.draft)
    .filter((entry) => entry.layout !== "search" && entry.layout !== "archives")
    .filter((entry) => !entry.searchHidden);
}

export function getSearchDocuments() {
  const docs = [];
  const sections = [
    { key: "posts", href: (slug) => `/posts/${encodeURIComponent(slug)}`, items: getPosts() },
    { key: "coding", href: (slug) => `/coding/${encodeURIComponent(slug)}`, items: getCodingPosts() },
  ];

  for (const section of sections) {
    for (const item of section.items) {
      docs.push({
        section: section.key,
        title: item.title,
        description: item.description || "",
        tags: item.tags || [],
        date: item.date,
        slug: item.slug,
        url: section.href(item.urlSlug || item.slug),
        content: stripHtml(item.content).slice(0, 1400),
      });
    }
  }

  const links = getLinkEntries();
  for (const link of links) {
    docs.push({
      section: "link",
      title: link.title,
      description: link.description || "",
      tags: [],
      date: null,
      slug: link.slug,
      url: "/link",
      content: `${link.site || ""} ${link.category || ""} ${link.link || ""}`.trim(),
    });
  }

  return docs;
}

export function getRssItems(limit = 50) {
  const items = getAllRegularEntries()
    .sort((a, b) => {
      if (!a.date && !b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    })
    .slice(0, limit)
    .map((item) => {
      return {
        title: item.title,
        description: item.description || item.summary || "",
        date: item.date,
        link: item.permalink,
      };
    });

  return items;
}

export function getIndexJsonItems() {
  return getAllRegularEntries().map((item) => ({
    title: item.title,
    content: item.plain,
    permalink: item.permalink,
    summary: item.summary,
  }));
}

export async function renderMarkdown(markdown) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown || "");

  return String(result);
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
    .filter(Boolean);
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

export function formatListDate(dateIso) {
  if (!dateIso) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateIso));
}

export function formatListMeta(entry) {
  if (!entry?.date) return "";
  const dateText = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(entry.date));
  const reading = entry.readingTime || estimateReadingMinutes(entry.content || "");
  return `${dateText} · ${reading} min`;
}

function estimateReadingMinutes(markdown = "", charsPerMinute = 240) {
  const plain = stripMarkdown(stripHtml(markdown)).replace(/\s+/g, "");
  const chars = plain.length;
  if (!chars) return 1;
  return Math.max(1, Math.ceil(chars / charsPerMinute));
}

export function formatPostMeta(entry) {
  if (!entry?.date) return "";
  const dateText = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(entry.date));
  const reading = entry.readingTime || estimateReadingMinutes(entry.content || "");
  return `${dateText} · ${reading} min`;
}

export function collectTagCounts(entries) {
  const map = new Map();
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function getAdjacentEntries(section, slug) {
  const entries = getSectionEntries(section);
  const index = entries.findIndex((item) => item.slug === slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index < entries.length - 1 ? entries[index + 1] : null,
    next: index > 0 ? entries[index - 1] : null,
  };
}

