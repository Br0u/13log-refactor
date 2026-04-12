import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { deletePhotoAction } from "../../../actions";
import AdminConfirmSubmitButton from "../../../../../components/admin/AdminConfirmSubmitButton";
import AdminPhotoCategoryForm from "../../../../../components/admin/AdminPhotoCategoryForm";
import AdminPhotoForm from "../../../../../components/admin/AdminPhotoForm";
import { getPhotoAlbumCopy } from "../../../../../lib/photo-album-copy";
import { getPhotoCategoryById, listPhotoCategories, updatePhotoCategory } from "../../../../../lib/repositories/photo-categories";
import { listAdminPhotos } from "../../../../../lib/repositories/photos";

export const dynamic = "force-dynamic";

function mergeAlbumCopy(category) {
  const fallback = getPhotoAlbumCopy(category.slug, category.name, category.description || "");

  return {
    ...category,
    displayTitle: category.displayTitle || fallback.displayName,
    coverTitle: category.coverTitle || fallback.coverTitleLines.join("\n"),
    indexDescription: category.indexDescription || fallback.body.join("\n"),
    detailDescription: category.detailDescription || fallback.body.join("\n"),
  };
}

function parseSortOrder(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function PhotoCard({ photo }) {
  const albumId = photo.categoryId || photo.category?.id;

  return (
    <article className="admin-card admin-photo-card">
      <div className="admin-photo-card__image-wrap">
        <img
          src={photo.imageUrl}
          alt={photo.title}
          loading="lazy"
          decoding="async"
          className="admin-photo-card__image"
        />
      </div>
      <div className="admin-photo-card__body">
        <div className="admin-photo-card__header">
          <div className="admin-photo-card__meta">
            <strong>{photo.title}</strong>
            <span>{photo.category?.name || "-"}</span>
          </div>
        </div>
        {photo.caption ? <p className="admin-photo-card__caption">{photo.caption}</p> : null}
        <div className="admin-photo-card__actions">
          <Link href={`/admin/photos/album/${albumId}/${photo.id}`} className="admin-secondary-link">Edit</Link>
          <form action={deletePhotoAction.bind(null, photo.id, albumId)} className="admin-inline-form">
            <AdminConfirmSubmitButton
              label="Delete photo"
              confirmMessage="Delete this photo? This cannot be undone."
              className="admin-danger-link"
            />
          </form>
        </div>
      </div>
    </article>
  );
}

export default async function AdminPhotoAlbumPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const [category, categories, photos] = await Promise.all([
    getPhotoCategoryById(id),
    listPhotoCategories(),
    listAdminPhotos({ categoryId: id }),
  ]);

  if (!category) {
    notFound();
  }

  const categoryWithCopy = mergeAlbumCopy(category);

  async function updatePhotoCategoryAction(_previousState, formData) {
    "use server";

    try {
      const name = String(formData.get("name") || "").trim();
      const slug = String(formData.get("slug") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const displayTitle = String(formData.get("displayTitle") || "").trim();
      const coverTitle = String(formData.get("coverTitle") || "").trim();
      const indexDescription = String(formData.get("indexDescription") || "").trim();
      const detailDescription = String(formData.get("detailDescription") || "").trim();
      const status = String(formData.get("status") || "DRAFT");
      const sortOrder = parseSortOrder(formData.get("sortOrder"));

      if (!name || !slug) {
        return { error: "Name and slug are required." };
      }

      await updatePhotoCategory(category.id, {
        name,
        slug,
        description,
        displayTitle,
        coverTitle,
        indexDescription,
        detailDescription,
        status,
        sortOrder,
      });

      revalidatePath("/admin/photos");
      revalidatePath(`/admin/photos/${category.id}`);
      revalidatePath("/photos");
      revalidatePath(`/photos/${slug}`);
      redirect(`/admin/photos/${category.id}?updated=1`);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to update album right now.",
      };
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Album</p>
          <h1>{category.name}</h1>
          <p className="admin-page-copy">{category.description || "在这个画册里上传并整理照片。"}</p>
        </div>
      </header>
      <div className="admin-page__panel admin-page__panel--stacked">
        <div className="admin-photo-layout">
          <div className="admin-page__panel admin-page__panel--stacked">
            <div className="admin-card__header">
              <p className="admin-eyebrow">Album</p>
              <h2>Edit album</h2>
              <p className="admin-page-copy">更新前台标题、封面文案和详情页说明，下面继续管理这本画册里的照片。</p>
            </div>
            <AdminPhotoCategoryForm
              action={updatePhotoCategoryAction}
              initialValue={categoryWithCopy}
              successMessage={sp?.updated === "1" ? "Album saved." : ""}
              submitLabel="Update album"
              pendingLabel="Updating..."
            />
          </div>
          <AdminPhotoForm
            categories={categories}
            albumId={category.id}
            albumName={category.name}
            createEndpoint="/api/admin/photos"
          />
        </div>
        <div className="admin-photo-grid">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      </div>
    </section>
  );
}
