import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminTaxonomyPage from "../../app/admin/categories/page";

describe("admin taxonomy pages", () => {
  it("renders the category management shell", async () => {
    const markup = renderToStaticMarkup(await AdminTaxonomyPage());

    expect(markup).toContain("Categories");
    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="slug"');
  });
});
