import React from "react";
import Link from "next/link";
export const metadata = {
  title: "Admin | 13log",
};

export default function AdminDashboardPage() {
  return (
    <section className="admin-page admin-dashboard">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Content Ops</p>
          <h1>Dashboard</h1>
          <p className="admin-page-copy">管理文章、分类、标签和评论，所有内容直接连接后台数据库。</p>
        </div>
        <Link href="/admin/posts/new" className="admin-primary-link">New post</Link>
      </header>
      <section className="admin-page__panel admin-dashboard__grid admin-overview-grid">
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Writing</p>
          <h2>Posts</h2>
          <p>创建、编辑长文，并把短句 micro posts 一起编排进统一时间线。</p>
          <div className="admin-overview-card__links">
            <Link href="/admin/posts">Open post manager</Link>
            <Link href="/admin/micro-posts">Micro posts</Link>
          </div>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Structure</p>
          <h2>Categories & Tags</h2>
          <p>维护文章分类和标签，确保前台归档结构整洁。</p>
          <div className="admin-overview-card__links">
            <Link href="/admin/categories">Categories</Link>
            <Link href="/admin/tags">Tags</Link>
          </div>
        </article>
        <article className="admin-overview-card">
          <p className="admin-overview-card__label">Community</p>
          <h2>Comments</h2>
          <p>查看评论状态，及时删除不需要保留的内容。</p>
          <Link href="/admin/comments">Review comments</Link>
        </article>
      </section>
    </section>
  );
}
