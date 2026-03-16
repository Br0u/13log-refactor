import React from "react";
import Link from "next/link";
import { createMicroPostAction } from "../actions";
import AdminMicroPostForm from "../../../components/admin/AdminMicroPostForm";
import { listMicroPosts } from "../../../lib/repositories/micro-posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Micro Posts | 13log Admin",
};

export default async function AdminMicroPostsPage() {
  const microPosts = await listMicroPosts();

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Writing</p>
          <h1>Micro posts</h1>
          <p className="admin-page-copy">发布短句和牢骚，让它们与长文一起进入 posts 时间线。</p>
        </div>
      </header>
      <div className="admin-page__panel admin-page__panel--stacked">
        <AdminMicroPostForm action={createMicroPostAction} />
        <div className="admin-table admin-panel-table">
          <div className="admin-table__head admin-table__head--micro">
            <span>Content</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {microPosts.map((post) => (
            <Link key={post.id} href={`/admin/micro-posts/${post.id}`} className="admin-table__row admin-table__row--micro">
              <span>{post.content}</span>
              <span><span className={`admin-status admin-status--${post.status.toLowerCase()}`}>{post.status}</span></span>
              <span>{new Date(post.updatedAt).toLocaleString("zh-CN")}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
