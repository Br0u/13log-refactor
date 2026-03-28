import { listPublishedPhotos } from "../../../lib/repositories/photos";
import { listPhotoCategories } from "../../../lib/repositories/photo-categories";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  const [categories, photos] = await Promise.all([
    listPhotoCategories({ status: "PUBLISHED" }),
    listPublishedPhotos(),
  ]);

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
