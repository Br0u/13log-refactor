import {
  createPhotoCategory,
  listPhotoCategories,
  updatePhotoCategory,
} from "./repositories/photo-categories.js";
import { createPhoto, listAdminPhotos } from "./repositories/photos.js";
import { LEGACY_PHOTO_ALBUMS } from "./legacy-photo-data.js";

export async function importLegacyPhotos(dependencies = {}) {
  const categoryLister = dependencies.listPhotoCategories || listPhotoCategories;
  const categoryCreator = dependencies.createPhotoCategory || createPhotoCategory;
  const categoryUpdater = dependencies.updatePhotoCategory || updatePhotoCategory;
  const photoLister = dependencies.listAdminPhotos || listAdminPhotos;
  const photoCreator = dependencies.createPhoto || createPhoto;

  const existingCategories = await categoryLister();
  const categoryBySlug = new Map(
    existingCategories.map((category) => [String(category.slug || "").toLowerCase(), category]),
  );
  const categoryByName = new Map(
    existingCategories.map((category) => [String(category.name || "").toLowerCase(), category]),
  );
  const existingPhotos = await photoLister();
  const existingPathnames = new Set(existingPhotos.map((photo) => photo.pathname).filter(Boolean));

  let createdAlbums = 0;
  let importedPhotos = 0;
  let skippedPhotos = 0;

  for (const album of LEGACY_PHOTO_ALBUMS) {
    let category = categoryBySlug.get(album.slug) || categoryByName.get(album.name.toLowerCase());

    if (!category) {
      category = await categoryCreator({
        name: album.name,
        slug: album.slug,
        sortOrder: album.sortOrder,
      });
      createdAlbums += 1;
    } else if (category.slug !== album.slug || category.sortOrder !== album.sortOrder || category.name !== album.name) {
      category = await categoryUpdater(category.id, {
        name: album.name,
        slug: album.slug,
        sortOrder: album.sortOrder,
      });
    }

    categoryBySlug.set(album.slug, category);
    categoryByName.set(album.name.toLowerCase(), category);

    for (const [index, photo] of album.photos.entries()) {
      if (existingPathnames.has(photo.url)) {
        skippedPhotos += 1;
        continue;
      }

      await photoCreator({
        title: photo.title,
        imageUrl: photo.url,
        pathname: photo.url,
        status: "PUBLISHED",
        sortOrder: index,
        categoryId: category.id,
      });
      existingPathnames.add(photo.url);
      importedPhotos += 1;
    }
  }

  return {
    createdAlbums,
    importedPhotos,
    skippedPhotos,
  };
}
