import React from "react";
import { notFound } from "next/navigation";
import { deletePhotoAction, updatePhotoAction } from "../../../../../actions";
import AdminConfirmSubmitButton from "../../../../../../../components/admin/AdminConfirmSubmitButton";
import AdminPhotoForm from "../../../../../../../components/admin/AdminPhotoForm";
import { getPhotoCategoryById, listPhotoCategories } from "../../../../../../../lib/repositories/photo-categories";
import { getPhotoById } from "../../../../../../../lib/repositories/photos";

export const dynamic = "force-dynamic";

export default async function AdminEditPhotoPage({ params, searchParams }) {
  const { albumId, photoId } = await params;
  const sp = await searchParams;
  const [category, categories, photo] = await Promise.all([
    getPhotoCategoryById(albumId),
    listPhotoCategories(),
    getPhotoById(photoId),
  ]);

  if (!category || !photo || photo.categoryId !== albumId) {
    notFound();
  }

  const action = updatePhotoAction.bind(null, photo.id, albumId);
  const initialValue = {
    title: photo.title,
    caption: photo.caption || "",
    sortOrder: photo.sortOrder,
    categoryId: photo.categoryId || albumId,
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Album</p>
          <h1>Edit Photo</h1>
          <p className="admin-page-copy">修改这张照片的标题、说明和排序。</p>
        </div>
      </header>
      <div className="admin-page__panel">
        <AdminPhotoForm
          action={action}
          categories={categories}
          albumId={category.id}
          albumName={category.name}
          initialValue={initialValue}
          mode="edit"
          submitLabel="Update photo"
          successMessage={sp?.created === "1" ? "Photo saved." : ""}
        />
      </div>
      <div className="admin-page__panel">
        <form action={deletePhotoAction.bind(null, photo.id, albumId)} className="admin-danger-zone">
          <p>Danger zone</p>
          <AdminConfirmSubmitButton
            label="Delete photo"
            confirmMessage="Delete this photo? This cannot be undone."
            className="admin-shell__logout"
          />
        </form>
      </div>
    </section>
  );
}
