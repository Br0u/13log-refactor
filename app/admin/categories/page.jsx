import React from "react";
import { createCategoryAction, deleteCategoryAction } from "../actions";
import { listCategories } from "../../../lib/repositories/categories";

export const metadata = {
  title: "Categories | 13log Admin",
};

export default async function AdminTaxonomyPage() {
  const categories = await listCategories();

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Structure</p>
          <h1>Categories</h1>
          <p className="admin-page-copy">维护文章主分类，空分类可以直接删除。</p>
        </div>
      </header>
      <form action={createCategoryAction} className="admin-post-form admin-card">
        <label>
          <span>Name</span>
          <input name="name" required />
        </label>
        <label>
          <span>Slug</span>
          <input name="slug" required />
        </label>
        <label>
          <span>Description</span>
          <textarea name="description" rows={3} />
        </label>
        <button type="submit">Save category</button>
      </form>
      <div className="admin-table">
        <div className="admin-table__head admin-table__head--taxonomy">
          <span>Name</span>
          <span>Slug</span>
          <span>Description</span>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="admin-table__row admin-table__row--taxonomy">
            <span>{category.name}</span>
            <span>{category.slug}</span>
            <span>
              <span>{category.description || "-"}</span>
              <form action={deleteCategoryAction.bind(null, category.id)} className="admin-inline-form">
                <button type="submit" className="admin-danger-link">Delete</button>
              </form>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
