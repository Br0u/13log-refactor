import React from "react";
import { deleteCommentAction } from "../actions";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comments | 13log Admin",
};

export default async function AdminCommentsPage() {
  const comments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: true,
    },
  });

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Community</p>
          <h1>Comments</h1>
          <p className="admin-page-copy">检查游客评论并按需要移除不保留的内容。</p>
        </div>
      </header>
      <div className="admin-table">
        <div className="admin-table__head">
          <span>Post</span>
          <span>Nickname</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {comments.map((comment) => (
          <div key={comment.id} className="admin-table__row">
            <span>{comment.post?.title || "-"}</span>
            <span>{comment.nickname}</span>
            <span><span className={`admin-status admin-status--${comment.status.toLowerCase()}`}>{comment.status}</span></span>
            <span>
              <span>{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
              <form action={deleteCommentAction.bind(null, comment.id)} className="admin-inline-form">
                <button type="submit" className="admin-danger-link">Delete</button>
              </form>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
