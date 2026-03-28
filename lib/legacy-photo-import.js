import {
  createPhotoCategory,
  listPhotoCategories,
  updatePhotoCategory,
} from "./repositories/photo-categories.js";
import { createPhoto, listAdminPhotos } from "./repositories/photos.js";

export const LEGACY_PHOTO_ALBUMS = [
  {
    name: "Random",
    slug: "random",
    sortOrder: 0,
    photos: [
      { title: "摄影作品 01", url: "/images/gallery/05051dcb0t816a84ff98745e8c52828a.jpg" },
      { title: "摄影作品 02", url: "/images/gallery/1b0b6ebfekd712a8c9ddb3a919f6e51b.jpg" },
      { title: "摄影作品 03", url: "/images/gallery/c310c2b15s058b7dad526c25892e071d.jpg" },
      { title: "摄影作品 04", url: "/images/gallery/e432e79a6nb6db538d9df8e8daf47bcd.jpg" },
      { title: "胶片记录 01", url: "/images/gallery/R0001640.jpg" },
      { title: "胶片记录 02", url: "/images/gallery/R0002247.jpg" },
      { title: "胶片记录 03", url: "/images/gallery/R0003289.jpg" },
      { title: "生活瞬间 01", url: "/images/gallery/IMG_1947.jpg" },
      { title: "生活瞬间 02", url: "/images/gallery/IMG_3058.jpg" },
      { title: "生活瞬间 03", url: "/images/gallery/IMG_3545.jpg" },
      { title: "生活瞬间 04", url: "/images/gallery/IMG_3658.jpg" },
      { title: "生活瞬间 05", url: "/images/gallery/IMG_4023.jpg" },
      { title: "生活瞬间 06", url: "/images/gallery/IMG_4256.jpg" },
      { title: "生活瞬间 07", url: "/images/gallery/IMG_4290.jpg" },
      { title: "生活瞬间 08", url: "/images/gallery/IMG_7282.jpg" },
      { title: "生活瞬间 09", url: "/images/gallery/IMG_7285.jpg" },
      { title: "生活瞬间 10", url: "/images/gallery/IMG_8441.jpg" },
      { title: "生活瞬间 11", url: "/images/gallery/IMG_8682.jpg" },
      { title: "生活瞬间 12", url: "/images/gallery/IMG_8790.jpg" },
      { title: "生活瞬间 13", url: "/images/gallery/IMG_8812.jpg" },
      { title: "生活瞬间 14", url: "/images/gallery/IMG_8819.jpg" },
      { title: "生活瞬间 15", url: "/images/gallery/IMG_9132.jpg" },
    ],
  },
  {
    name: "April",
    slug: "april",
    sortOrder: 1,
    photos: [
      { title: "April 01", url: "/images/gallery/gal01/R0001375.jpg" },
      { title: "April 02", url: "/images/gallery/gal01/R0001410.jpg" },
      { title: "April 03", url: "/images/gallery/gal01/R0001504.JPG" },
      { title: "April 04", url: "/images/gallery/gal01/R0001505.JPG" },
      { title: "April 05", url: "/images/gallery/gal01/R0001515.JPG" },
      { title: "April 06", url: "/images/gallery/gal01/R0001601.JPG" },
      { title: "April 07", url: "/images/gallery/gal01/R0001636.JPG" },
      { title: "April 08", url: "/images/gallery/gal01/R0001666.jpg" },
      { title: "April 09", url: "/images/gallery/gal01/R0001732.JPG" },
      { title: "April 10", url: "/images/gallery/gal01/R0001738.jpg" },
      { title: "April 11", url: "/images/gallery/gal01/R0001822.jpg" },
      { title: "April 12", url: "/images/gallery/gal01/R0001829.jpg" },
      { title: "April 13", url: "/images/gallery/gal01/R0001868.jpg" },
      { title: "April 14", url: "/images/gallery/gal01/R0001877.jpg" },
      { title: "April 15", url: "/images/gallery/gal01/R0001939.jpg" },
      { title: "April 16", url: "/images/gallery/gal01/R0001940.jpg" },
      { title: "April 17", url: "/images/gallery/gal01/R0001942.JPG" },
    ],
  },
  {
    name: "Again",
    slug: "again",
    sortOrder: 2,
    photos: [
      { title: "Again 01", url: "/images/gallery/gal02/132218.JPG" },
      { title: "Again 02", url: "/images/gallery/gal02/135776.JPG" },
      { title: "Again 03", url: "/images/gallery/gal02/196598.JPG" },
      { title: "Again 04", url: "/images/gallery/gal02/569.JPG" },
      { title: "Again 05", url: "/images/gallery/gal02/759.JPG" },
      { title: "Again 06", url: "/images/gallery/gal02/806.JPG" },
      { title: "Again 07", url: "/images/gallery/gal02/IMG_0943.jpg" },
      { title: "Again 08", url: "/images/gallery/gal02/IMG_2115.JPG" },
      { title: "Again 09", url: "/images/gallery/gal02/IMG_5242.jpg" },
      { title: "Again 10", url: "/images/gallery/gal02/IMG_5761.jpg" },
      { title: "Again 11", url: "/images/gallery/gal02/IMG_7812.jpg" },
      { title: "Again 12", url: "/images/gallery/gal02/R0003383.JPG" },
    ],
  },
];

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
