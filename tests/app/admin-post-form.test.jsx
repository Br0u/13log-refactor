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
    expect(markup).toContain('value="DRAFT"');
    expect(markup).toContain('value="PUBLISHED"');
  });
});
