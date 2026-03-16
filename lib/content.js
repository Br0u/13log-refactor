import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import TOML from "@iarna/toml";
import {
  buildPlainSummary,
  preprocessShortcodes,
  renderMarkdownToHtml,
  withHeadingAnchors,
  buildTocHtml,
} from "./markdown";

const ROOT = process.cwd();
const LOCAL_CONTENT_DIR = path.resolve(ROOT, "content");
const PARENT_CONTENT_DIR = path.resolve(ROOT, "..", "content");
const CONTENT_DIR = fs.existsSync(LOCAL_CONTENT_DIR) ? LOCAL_CONTENT_DIR : PARENT_CONTENT_DIR;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.13log.live").replace(/\/+$/, "");

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
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
    .replace(/[·?`~!@#$%^&*()+=\[\]{}|\\:;"'<>,.?/，。！？：；、“”‘’（）【】《》]/g, "")
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
  const plain = buildPlainSummary(processed);

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

export function getLinkPageIntro() {
  return getSectionIndex("link", "Link");
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

function normalizeRootRegularEntry(filePath) {
  const source = readFileSafe(filePath);
  const { data, content } = parseFrontmatter(source);
  const rel = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  const slug = rel.replace(/\.(md|markdown)$/i, "");
  const section = slug.includes("/") ? slug.split("/")[0].toLowerCase() : slug.toLowerCase();
  const plain = buildPlainSummary(content);
  const summary = (data.description || plain).slice(0, 260);

  let permalinkPath = `/${slug.toLowerCase()}/`;
  if (section === "posts" || section === "link") {
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
        content: buildPlainSummary(item.content).slice(0, 1400),
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
  return renderMarkdownToHtml(markdown);
}

export { buildTocHtml, withHeadingAnchors };

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

export function getPrimaryEntryLabel(entry) {
  const category = Array.isArray(entry?.categories) ? entry.categories.find(Boolean) : null;
  if (category) return category;
  const tag = Array.isArray(entry?.tags) ? entry.tags.find(Boolean) : null;
  return tag || "";
}

export function getPostPreviewBlocks(entry, limit = 4) {
  const source = String(entry?.content || entry?.description || entry?.summary || "");
  const blocks = source
    .split(/\n\s*(?:---+|<hr\s*\/?>)\s*\n|\n{2,}/i)
    .map((block) => buildPlainSummary(block))
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length > 0) {
    return blocks.slice(0, limit);
  }

  const fallback = buildPlainSummary(source).trim();
  return fallback ? [fallback] : [];
}

function estimateReadingMinutes(markdown = "", charsPerMinute = 240) {
  const plain = buildPlainSummary(markdown).replace(/\s+/g, "");
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

export function collectFilterCounts(entries) {
  const map = new Map();
  for (const entry of entries) {
    const values = Array.from(new Set([...(entry.categories || []), ...(entry.tags || [])]));
    for (const value of values) {
      map.set(value, (map.get(value) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function collectEntryFilters(entry) {
  return Array.from(new Set([...(entry?.categories || []), ...(entry?.tags || [])]));
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
