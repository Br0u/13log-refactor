import React from "react";
import { notFound } from "next/navigation";
import { deletePostAction, updatePostAction } from "../../actions";
import AdminPostForm from "../../../../components/admin/AdminPostForm";
import { listCategories } from "../../../../lib/repositories/categories";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminEditPostPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const [post, categories] = await Promise.all([
    db.post.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    }),
    listCategories(),
  ]);

  if (!post) {
    notFound();
  }

  const action = updatePostAction.bind(null, post.id);
  const initialValue = {
    title: post.title,
    slug: post.slug,
    summary: post.summary || "",
    markdown: post.markdown,
    coverImage: post.coverImage || "",
    status: post.status,
    publishedAt: post.publishedAt,
    categoryId: post.categoryId || "",
    tags: post.tags.map((item) => item.tag.name),
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Writing</p>
          <h1>Edit Post</h1>
          <p className="admin-page-copy">修改正文、状态、标签和分类，危险操作独立放置。</p>
        </div>
      </header>
      <div className="admin-page__panel">
        <AdminPostForm
          action={action}
          categories={categories}
          initialValue={initialValue}
          successMessage={sp?.created === "1" ? "Post saved." : ""}
        />
      </div>
      <div className="admin-page__panel">
        <form action={deletePostAction.bind(null, post.id)} className="admin-danger-zone">
          <p>Danger zone</p>
          <button type="submit" className="admin-shell__logout">Delete post</button>
        </form>
      </div>
    </section>
  );
}
