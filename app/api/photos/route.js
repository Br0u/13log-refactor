import { listPublishedPhotos } from "../../../lib/repositories/photos";
import { listPhotoCategories } from "../../../lib/repositories/photo-categories";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(request) {
  const url = new URL(request.url);
  const album = url.searchParams.get("album")?.trim();

  const categories = await listPhotoCategories({ status: "PUBLISHED" });
  const photos = album
    ? await listPublishedPhotos({ categorySlug: album })
    : [];

  return json({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder ?? 0,
    })),
    photos: photos.map((photo) => ({
      id: photo.id,
      title: photo.title,
      imageUrl: photo.imageUrl,
      category: photo.category
        ? {
            id: photo.category.id,
            name: photo.category.name,
            slug: photo.category.slug,
          }
        : null,
      publishedAt: photo.publishedAt ? photo.publishedAt.toISOString() : null,
    })),
  });
}
