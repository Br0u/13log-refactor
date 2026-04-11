import { getPhotoCategoryBySlug, listPhotoCategories } from "./repositories/photo-categories";
import { listPublishedPhotos } from "./repositories/photos";

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

export async function getPublicPhotoAlbums() {
  const [categories, photos] = await Promise.all([
    listPhotoCategories({ status: "PUBLISHED" }),
    listPublishedPhotos(),
  ]);

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

      const cover = categoryPhotos[0];
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        displayTitle: category.displayTitle || "",
        coverTitle: category.coverTitle || "",
        coverTitleLines: splitLines(category.coverTitle),
        indexDescription: category.indexDescription || "",
        indexDescriptionLines: splitLines(category.indexDescription),
        detailDescription: category.detailDescription || "",
        detailDescriptionLines: splitLines(category.detailDescription),
        photoCount: categoryPhotos.length,
        coverImageUrl: cover.imageUrl,
        fallbackCoverTitle: cover.title || category.name,
      };
    })
    .filter(Boolean);
}

export async function getPublicPhotoAlbumBySlug(slug) {
  const category = await getPhotoCategoryBySlug(slug);
  if (!category || category.status !== "PUBLISHED") {
    return null;
  }

  const photos = sortPhotos(await listPublishedPhotos({ categorySlug: slug })).map(mapPhoto);
  if (!photos.length) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    displayTitle: category.displayTitle || "",
    coverTitle: category.coverTitle || "",
    coverTitleLines: splitLines(category.coverTitle),
    indexDescription: category.indexDescription || "",
    indexDescriptionLines: splitLines(category.indexDescription),
    detailDescription: category.detailDescription || "",
    detailDescriptionLines: splitLines(category.detailDescription),
    photoCount: photos.length,
    coverImageUrl: photos[0].imageUrl,
    fallbackCoverTitle: photos[0].title || category.name,
    photos,
  };
}
