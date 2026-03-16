import React from "react";
import { createTagAction, deleteTagAction } from "../actions";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tags | 13log Admin",
};

export default async function AdminTagsPage() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Structure</p>
          <h1>Tags</h1>
          <p className="admin-page-copy">维护可复用标签，未使用标签可以直接清理。</p>
        </div>
      </header>
      <div className="admin-page__panel admin-page__panel--stacked">
        <form action={createTagAction} className="admin-post-form admin-card admin-form">
          <label>
            <span>Name</span>
            <input name="name" required />
          </label>
          <label>
            <span>Slug</span>
            <input name="slug" required />
          </label>
          <button type="submit" className="admin-primary-button">Save tag</button>
        </form>
        <div className="admin-table admin-panel-table">
          <div className="admin-table__head admin-table__head--taxonomy">
            <span>Name</span>
            <span>Slug</span>
          </div>
          {tags.map((tag) => (
            <div key={tag.id} className="admin-table__row admin-table__row--taxonomy">
              <span>{tag.name}</span>
              <span>
                <span>{tag.slug}</span>
                <form action={deleteTagAction.bind(null, tag.id)} className="admin-inline-form">
                  <button type="submit" className="admin-danger-link">Delete</button>
                </form>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
