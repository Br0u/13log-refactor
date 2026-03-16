import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPostForm from "../../components/admin/AdminPostForm";

describe("admin post form", () => {
  it("renders the required article fields and status options", () => {
    const markup = renderToStaticMarkup(
      <AdminPostForm
        categories={[{ id: "cat-1", name: "Notes" }]}
        initialValue={{
          title: "",
          slug: "",
          summary: "",
          markdown: "",
          status: "DRAFT",
          categoryId: "",
          tags: [],
        }}
      />
    );

    expect(markup).toContain('name="title"');
    expect(markup).toContain('name="slug"');
    expect(markup).toContain('name="markdown"');
    expect(markup).toContain('name="categoryId"');
    expect(markup).toContain('name="tags"');
    expect(markup).not.toContain('name="publishedAt"');
    expect(markup).toContain("Publication time becomes editable after the post is published.");
    expect(markup).toContain(">Edit<");
    expect(markup).toContain(">Preview<");
    expect(markup).toContain('value="DRAFT"');
    expect(markup).toContain('value="PUBLISHED"');
    expect(markup).toContain('<option value="DRAFT" selected="">Draft</option>');
  });

  it("server-renders the published option as selected for published posts", () => {
    const markup = renderToStaticMarkup(
      <AdminPostForm
        categories={[]}
        initialValue={{
          title: "Published post",
          slug: "published-post",
          summary: "",
          markdown: "body",
          status: "PUBLISHED",
          publishedAt: "2026-03-16T09:30:00.000Z",
          categoryId: "",
          tags: [],
        }}
      />
    );

    expect(markup).toContain('<option value="PUBLISHED" selected="">Published</option>');
    expect(markup).toContain('name="publishedAt"');
    expect(markup).toContain('type="datetime-local"');
    expect(markup).toContain('value="2026-03-16T05:30"');
    expect(markup).toContain("Edit using your local time.");
  });
});
