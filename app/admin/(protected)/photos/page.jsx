import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AdminAutoSubmitSelect from "../../../../components/admin/AdminAutoSubmitSelect";
import AdminPhotoCategoryForm from "../../../../components/admin/AdminPhotoCategoryForm";
import { createPhotoCategory, getPhotoCategoryById, listPhotoCategories, updatePhotoCategory } from "../../../../lib/repositories/photo-categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photos | 13log Admin",
};

async function createPhotoCategoryAction(_previousState, formData) {
  "use server";

  try {
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const status = String(formData.get("status") || "DRAFT");

    if (!name || !slug) {
      return { error: "Name and slug are required." };
    }

    const category = await createPhotoCategory({
      name,
      slug,
      status,
    });

    revalidatePath("/admin/photos");
    revalidatePath("/photos");
    redirect(`/admin/photos/${category.id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save category right now.",
    };
  }
}

async function updatePhotoCategoryStatusAction(categoryId, formData) {
  "use server";

  const category = await getPhotoCategoryById(categoryId);
  if (!category) {
    return;
  }

  await updatePhotoCategory(categoryId, {
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    albumAnnotation: category.albumAnnotation || "",
    displayTitle: category.displayTitle || "",
    coverTitle: category.coverTitle || "",
    indexDescription: category.indexDescription || "",
    detailDescription: category.detailDescription || "",
    status: String(formData.get("status") || category.status || "DRAFT"),
    sortOrder: category.sortOrder ?? 0,
  });

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
}

export default async function AdminPhotosPage() {
  const categories = await listPhotoCategories();

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Gallery</p>
          <h1>Photos</h1>
          <p className="admin-page-copy">先管理画册，再进入某个画册上传和整理照片。</p>
        </div>
      </header>
      <div className="admin-page__panel admin-page__panel--stacked">
        <div className="admin-photo-layout">
          <AdminPhotoCategoryForm action={createPhotoCategoryAction} mode="quick-create" />
        </div>
        <div className="admin-table admin-panel-table">
          <div className="admin-table__head admin-table__head--taxonomy">
            <span>Album</span>
            <span>Slug</span>
            <span>Description</span>
            <span>Status</span>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="admin-table__row admin-table__row--taxonomy">
              <span>
                <Link href={`/admin/photos/${category.id}`}>{category.name}</Link>
              </span>
              <span>{category.slug}</span>
              <span>{category.description || "-"}</span>
              <form action={updatePhotoCategoryStatusAction.bind(null, category.id)} className="admin-inline-form admin-inline-form--status">
                <AdminAutoSubmitSelect
                  name="status"
                  defaultValue={category.status || "DRAFT"}
                  ariaLabel={`${category.name} status`}
                  options={[
                    { value: "DRAFT", label: "DRAFT" },
                    { value: "PUBLISHED", label: "PUBLISHED" },
                  ]}
                />
              </form>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
