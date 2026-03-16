import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../app/admin/actions", () => ({
  approveCommentAction: vi.fn(),
  approveGuestbookEntryAction: vi.fn(),
  deleteCommentAction: vi.fn(),
  deleteGuestbookEntryAction: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: {
    comment: {
      findMany: vi.fn(async () => ([
        {
          id: "comment-1",
          nickname: "brou",
          content: "这里是文章评论正文。",
          status: "PENDING",
          createdAt: new Date("2026-03-15T10:00:00.000Z"),
          post: { title: "A post" },
        },
      ])),
    },
    guestbookEntry: {
      findMany: vi.fn(async () => ([
        {
          id: "guest-1",
          nickname: "reader@example.com",
          content: "这里是留言板正文。",
          status: "PENDING",
          createdAt: new Date("2026-03-15T11:00:00.000Z"),
        },
      ])),
    },
  },
}));

import AdminCommentsPage from "../../app/admin/comments/page.jsx";

describe("admin comments page", () => {
  it("renders the comments workspace inside a content panel", async () => {
    const markup = renderToStaticMarkup(await AdminCommentsPage());

    expect(markup).toContain("admin-page-header");
    expect(markup).toContain("admin-page__panel");
    expect(markup).toContain("admin-table admin-panel-table");
    expect(markup).toContain("About 留言板");
    expect(markup).toContain("这里是文章评论正文。");
    expect(markup).toContain("这里是留言板正文。");
    expect(markup).toContain("admin-table__content-cell");
  });
});
