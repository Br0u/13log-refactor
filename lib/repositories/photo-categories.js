import { db } from "../db.js";

function normalizeStatus(status) {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

export async function createPhotoCategory(input) {
  return db.photoCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      displayTitle: input.displayTitle || null,
      coverTitle: input.coverTitle || null,
      indexDescription: input.indexDescription || null,
      detailDescription: input.detailDescription || null,
      status: normalizeStatus(input.status),
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    },
  });
}

export async function updatePhotoCategory(id, input) {
  return db.photoCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      displayTitle: input.displayTitle || null,
      coverTitle: input.coverTitle || null,
      indexDescription: input.indexDescription || null,
      detailDescription: input.detailDescription || null,
      status: normalizeStatus(input.status),
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    },
  });
}

export async function getPhotoCategoryById(id) {
  if (!id) return null;

  return db.photoCategory.findUnique({
    where: { id },
  });
}

export async function getPhotoCategoryBySlug(slug) {
  if (!slug) return null;

  return db.photoCategory.findUnique({
    where: { slug },
  });
}

export async function listPhotoCategories(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = normalizeStatus(filters.status);
  }

  return db.photoCategory.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
}
