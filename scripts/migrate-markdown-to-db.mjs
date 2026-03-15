import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import TOML from "@iarna/toml";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const ROOT = process.cwd();
const CONTENT_DIR = path.resolve(ROOT, "content/posts");

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
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...getMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
      out.push(fullPath);
    }
  }

  return out;
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

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function loadMarkdownPosts() {
  return getMarkdownFiles(CONTENT_DIR)
    .map((filePath) => {
      const source = readFileSafe(filePath);
      const { data, content } = parseFrontmatter(source);
      const slug = path.relative(CONTENT_DIR, filePath).replace(/\.(md|markdown)$/i, "").replace(/\\/g, "/");

      return {
        title: data.title || slug,
        slug,
        urlSlug: data.slug ? toUrlSlugPath(String(data.slug)) : toUrlSlugPath(slug),
        description: data.description || "",
        summary: data.description || "",
        content,
        categories: Array.isArray(data.categories) ? data.categories : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        date: normalizeDate(data.date),
        draft: Boolean(data.draft),
      };
    })
    .filter((entry) => !entry.draft);
}

function normalizeTagName(tag) {
  return String(tag || "").trim();
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

export function toPostPayload(entry) {
  return {
    title: entry.title,
    slug: normalizeSlug(entry.urlSlug || entry.slug),
    summary: entry.description || entry.summary || "",
    markdown: entry.content || "",
    status: "PUBLISHED",
    publishedAt: entry.date ? new Date(entry.date) : new Date(),
    categoryName: Array.isArray(entry.categories) ? entry.categories[0] || null : null,
    tags: Array.isArray(entry.tags) ? entry.tags.map(normalizeTagName).filter(Boolean) : [],
  };
}

async function ensureCategory(categoryName) {
  if (!categoryName) return null;
  const slug = categoryName.toLowerCase().replace(/\s+/g, "-");
  return db.category.upsert({
    where: { slug },
    update: { name: categoryName },
    create: { name: categoryName, slug },
  });
}

async function ensureTags(tags) {
  const tagRecords = [];
  for (const tagName of tags) {
    const slug = tagName.toLowerCase().replace(/\s+/g, "-");
    const tag = await db.tag.upsert({
      where: { slug },
      update: { name: tagName },
      create: { name: tagName, slug },
    });
    tagRecords.push(tag);
  }
  return tagRecords;
}

async function importEntry(entry) {
  const payload = toPostPayload(entry);
  const existing = await db.post.findUnique({
    where: { slug: payload.slug },
  });

  if (existing) {
    return { skipped: true, slug: payload.slug };
  }

  const category = await ensureCategory(payload.categoryName);
  const tags = await ensureTags(payload.tags);

  const post = await db.post.create({
    data: {
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary || null,
      markdown: payload.markdown,
      status: "PUBLISHED",
      publishedAt: payload.publishedAt,
      categoryId: category?.id || null,
    },
  });

  if (tags.length) {
    await db.postTag.createMany({
      data: tags.map((tag) => ({
        postId: post.id,
        tagId: tag.id,
      })),
    });
  }

  return { skipped: false, slug: payload.slug };
}

async function main() {
  const posts = loadMarkdownPosts();
  let imported = 0;
  let skipped = 0;

  for (const entry of posts) {
    const result = await importEntry(entry);
    if (result.skipped) skipped += 1;
    else imported += 1;
  }

  console.log(`Imported ${imported} posts, skipped ${skipped} existing posts.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await db.$disconnect();
      process.exit(1);
    });
}
