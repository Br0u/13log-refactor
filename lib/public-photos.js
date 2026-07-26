import { LEGACY_PHOTO_ALBUMS } from "./legacy-photo-data";
import { getPhotoCategoryBySlug, listPhotoCategories } from "./repositories/photo-categories";
import { listPublishedPhotos } from "./repositories/photos";

const TRANSIENT_PRISMA_ERROR_CODES = new Set(["P1001", "P1017"]);

function isTransientPrismaConnectionError(error) {
  if (TRANSIENT_PRISMA_ERROR_CODES.has(error?.code)) return true;

  const message = String(error?.message || "");
  return /TLS connection|connection closed|Can't reach database server/i.test(message);
}

async function readWithConnectionFallback(operation) {
  try {
    return { source: "database", value: await operation() };
  } catch (firstError) {
    if (!isTransientPrismaConnectionError(firstError)) {
      throw firstError;
    }
  }

  try {
    return { source: "database", value: await operation() };
  } catch (secondError) {
    if (!isTransientPrismaConnectionError(secondError)) {
      throw secondError;
    }

    return { source: "legacy", value: null };
  }
}

async function readPhotoIndexFromDatabase() {
  const results = await Promise.allSettled([
    listPhotoCategories({ status: "PUBLISHED" }),
    listPublishedPhotos(),
  ]);
  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  const nonTransientError = errors.find(
    (error) => !isTransientPrismaConnectionError(error),
  );

  if (nonTransientError) {
    throw nonTransientError;
  }
  if (errors.length) {
    throw errors[0];
  }

  return results.map((result) => result.value);
}

function sortPhotos(photos) {
  return photos.slice().sort((left, right) => {
    const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 0;
    const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftDate = left.publishedAt ? new Date(left.publishedAt).toISOString() : "";
    const rightDate = right.publishedAt ? new Date(right.publishedAt).toISOString() : "";
    return leftDate.localeCompare(rightDate);
  });
}

function mapPhoto(photo) {
  return {
    id: photo.id,
    title: photo.title || "",
    caption: photo.caption || "",
    imageUrl: photo.imageUrl,
    sortOrder: Number.isFinite(Number(photo.sortOrder)) ? Number(photo.sortOrder) : 0,
  };
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapAlbumMetadata(album, photos, id = album.id) {
  const cover = photos[0];

  return {
    id,
    name: album.name,
    slug: album.slug,
    description: album.description || "",
    albumAnnotation: album.albumAnnotation || "",
    displayTitle: album.displayTitle || "",
    coverTitle: album.coverTitle || "",
    coverTitleLines: splitLines(album.coverTitle),
    indexDescription: album.indexDescription || "",
    indexDescriptionLines: splitLines(album.indexDescription),
    detailDescription: album.detailDescription || "",
    detailDescriptionLines: splitLines(album.detailDescription),
    photoCount: photos.length,
    coverImageUrl: cover.imageUrl,
    fallbackCoverTitle: cover.title || album.name,
  };
}

function mapLegacyPhoto(album, photo, index) {
  return {
    id: `legacy-photo-${album.slug}-${index + 1}`,
    title: photo.title || "",
    caption: photo.caption || "",
    imageUrl: photo.url,
    sortOrder: index,
  };
}

function mapLegacyAlbumForIndex(album) {
  const photos = album.photos.map((photo, index) => mapLegacyPhoto(album, photo, index));
  return mapAlbumMetadata(album, photos, `legacy-album-${album.slug}`);
}

function mapLegacyAlbumForDetail(album) {
  const photos = album.photos.map((photo, index) => mapLegacyPhoto(album, photo, index));
  return {
    ...mapAlbumMetadata(album, photos, `legacy-album-${album.slug}`),
    photos,
  };
}

function mapDatabaseAlbums(categories, photos) {
  const photosByCategoryId = new Map();
  for (const photo of photos) {
    if (!photo.categoryId) continue;
    const bucket = photosByCategoryId.get(photo.categoryId) || [];
    bucket.push(photo);
    photosByCategoryId.set(photo.categoryId, bucket);
  }

  return categories
    .map((category) => {
      const categoryPhotos = sortPhotos(photosByCategoryId.get(category.id) || []);
      if (!categoryPhotos.length) return null;

      return mapAlbumMetadata(category, categoryPhotos);
    })
    .filter(Boolean);
}

export async function getPublicPhotoAlbums() {
  const result = await readWithConnectionFallback(readPhotoIndexFromDatabase);

  if (result.source === "legacy") {
    return LEGACY_PHOTO_ALBUMS.map(mapLegacyAlbumForIndex);
  }

  const [categories, photos] = result.value;
  return mapDatabaseAlbums(categories, photos);
}

export async function getPublicPhotoAlbumBySlug(slug) {
  const result = await readWithConnectionFallback(async () => {
    const category = await getPhotoCategoryBySlug(slug);
    if (!category || category.status !== "PUBLISHED") {
      return { category, photos: [] };
    }

    const photos = await listPublishedPhotos({ categorySlug: slug });
    return { category, photos };
  });

  if (result.source === "legacy") {
    const album = LEGACY_PHOTO_ALBUMS.find((candidate) => candidate.slug === slug);
    return album ? mapLegacyAlbumForDetail(album) : null;
  }

  const { category, photos: rawPhotos } = result.value;
  if (!category || category.status !== "PUBLISHED") {
    return null;
  }

  const photos = sortPhotos(rawPhotos).map(mapPhoto);
  if (!photos.length) {
    return null;
  }

  return {
    ...mapAlbumMetadata(category, photos),
    photos,
  };
}
