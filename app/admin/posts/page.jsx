import React from "react";
import Link from "next/link";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Posts | 13log",
};

export default async function AdminPostsPage() {
  const posts = await db.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
    },
  });

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Writing</p>
          <h1>Posts</h1>
          <p className="admin-page-copy">统一查看文章状态、分类归属和最近更新时间。</p>
        </div>
        <Link href="/admin/posts/new" className="admin-primary-link">New post</Link>
      </header>
      <div className="admin-page__panel">
        <div className="admin-table admin-panel-table">
        <div className="admin-table__head">
          <span>Title</span>
          <span>Status</span>
          <span>Category</span>
          <span>Updated</span>
        </div>
        {posts.map((post) => (
          <Link key={post.id} href={`/admin/posts/${post.id}`} className="admin-table__row">
            <span>
              <strong>{post.title}</strong>
            </span>
            <span><span className={`admin-status admin-status--${post.status.toLowerCase()}`}>{post.status}</span></span>
            <span>{post.category?.name || "-"}</span>
            <span>{new Date(post.updatedAt).toLocaleString("zh-CN")}</span>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}
