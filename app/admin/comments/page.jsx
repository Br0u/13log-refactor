import React from "react";
import {
  approveCommentAction,
  approveGuestbookEntryAction,
  deleteCommentAction,
  deleteGuestbookEntryAction,
} from "../actions";
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
  const guestbookEntries = await db.guestbookEntry.findMany({
    orderBy: { createdAt: "desc" },
  });
  const items = [
    ...comments.map((comment) => ({
      id: comment.id,
      source: comment.post?.title || "-",
      type: "POST",
      nickname: comment.nickname,
      status: comment.status,
      createdAt: comment.createdAt,
      approveAction: approveCommentAction.bind(null, comment.id),
      deleteAction: deleteCommentAction.bind(null, comment.id),
    })),
    ...guestbookEntries.map((entry) => ({
      id: entry.id,
      source: "About 留言板",
      type: "ABOUT",
      nickname: entry.nickname,
      status: entry.status,
      createdAt: entry.createdAt,
      approveAction: approveGuestbookEntryAction.bind(null, entry.id),
      deleteAction: deleteGuestbookEntryAction.bind(null, entry.id),
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Community</p>
          <h1>Comments</h1>
          <p className="admin-page-copy">检查游客评论并按需要移除不保留的内容。</p>
        </div>
      </header>
      <div className="admin-page__panel">
        <div className="admin-table admin-panel-table">
        <div className="admin-table__head">
          <span>Source</span>
          <span>Type</span>
          <span>Nickname</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="admin-table__row">
            <span>{item.source}</span>
            <span>{item.type}</span>
            <span>{item.nickname}</span>
            <span><span className={`admin-status admin-status--${item.status.toLowerCase()}`}>{item.status}</span></span>
            <span>
              <span>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
              {item.status !== "APPROVED" ? (
                <form action={item.approveAction} className="admin-inline-form">
                  <button type="submit" className="admin-secondary-link">Approve</button>
                </form>
              ) : null}
              <form action={item.deleteAction} className="admin-inline-form">
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
