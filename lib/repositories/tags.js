import { db } from "../db";

function normalizeTagSlug(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export async function ensureTags(tagNames = [], client = db) {
  const uniqueTags = Array.from(
    new Set(
      tagNames
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );

  if (!uniqueTags.length) {
    return [];
  }

  const tags = [];
  for (const name of uniqueTags) {
    const slug = normalizeTagSlug(name);
    const tag = await client.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    tags.push(tag);
  }

  return tags;
}
