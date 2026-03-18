import React from "react";
import AdminPostCreateForm from "../../../../../components/admin/AdminPostCreateForm";
import { listCategories } from "../../../../../lib/repositories/categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Post | 13log",
};

export default async function AdminNewPostPage() {
  const categories = await listCategories();

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Writing</p>
          <h1>New Post</h1>
          <p className="admin-page-copy">创建新文章，默认保持 Markdown 写作方式。</p>
        </div>
      </header>
      <div className="admin-page__panel">
        <AdminPostCreateForm categories={categories} />
      </div>
    </section>
  );
}
