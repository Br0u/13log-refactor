import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePhotoAction } from "../../../actions";
import AdminConfirmSubmitButton from "../../../../../components/admin/AdminConfirmSubmitButton";
import AdminPhotoForm from "../../../../../components/admin/AdminPhotoForm";
import { getPhotoCategoryById, listPhotoCategories } from "../../../../../lib/repositories/photo-categories";
import { listAdminPhotos } from "../../../../../lib/repositories/photos";

export const dynamic = "force-dynamic";

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

export default async function AdminPhotoAlbumPage({ params }) {
  const { id } = await params;
  const [category, categories, photos] = await Promise.all([
    getPhotoCategoryById(id),
    listPhotoCategories(),
    listAdminPhotos({ categoryId: id }),
  ]);

  if (!category) {
    notFound();
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
