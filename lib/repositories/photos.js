import { db } from "../db.js";
import { getPhotoCategoryById } from "./photo-categories.js";

function includePhotoRelations() {
  return {
    category: true,
  };
}

async function assertPhotoCategoryExists(categoryId) {
  if (!categoryId) {
    throw new Error("Photo album is required");
  }

  const category = await getPhotoCategoryById(categoryId);
  if (!category) {
    throw new Error("Photo category not found");
  }

  return category;
}

async function resolveSortOrder(categoryId, sortOrder) {
  const normalized = Number(sortOrder);
  if (Number.isFinite(normalized)) {
    return normalized;
  }

  const lastPhoto = await db.photo.findFirst({
    where: { categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return (lastPhoto?.sortOrder ?? -1) + 1;
}

export async function createPhoto(input) {
  await assertPhotoCategoryExists(input.categoryId);
  const sortOrder = await resolveSortOrder(input.categoryId, input.sortOrder);

  return db.photo.create({
    data: {
      title: input.title,
      caption: input.caption || null,
      imageUrl: input.imageUrl,
      pathname: input.pathname || null,
      sortOrder,
      categoryId: input.categoryId,
    },
    include: includePhotoRelations(),
  });
}

export async function getPhotoById(id) {
  if (!id) return null;

  return db.photo.findUnique({
    where: { id },
    include: includePhotoRelations(),
  });
}

export async function updatePhoto(id, input) {
  await assertPhotoCategoryExists(input.categoryId);

  return db.photo.update({
    where: { id },
    data: {
      title: input.title,
      caption: input.caption || null,
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
      categoryId: input.categoryId,
    },
    include: includePhotoRelations(),
  });
}

export async function deletePhoto(id) {
  return db.photo.delete({
    where: { id },
  });
}

export async function listAdminPhotos(filters = {}) {
  return db.photo.findMany({
    where: filters.categoryId ? { categoryId: filters.categoryId } : undefined,
    orderBy: [
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: includePhotoRelations(),
  });
}

export async function listPublishedPhotos(filters = {}) {
  const where = {
    category: {
      status: "PUBLISHED",
    },
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  } else if (filters.categorySlug) {
    where.category = {
      status: "PUBLISHED",
      slug: filters.categorySlug,
    };
  }

  return db.photo.findMany({
    where,
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
    include: includePhotoRelations(),
  });
}
