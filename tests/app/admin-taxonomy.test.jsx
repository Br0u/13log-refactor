import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/repositories/categories", () => ({
  listCategories: vi.fn(async () => [
    {
      id: "cat-1",
      name: "Notes",
      slug: "notes",
      description: "Notes category",
    },
  ]),
}));

import AdminTaxonomyPage from "../../app/admin/(protected)/categories/page";

describe("admin taxonomy pages", () => {
  it("renders the category management shell", async () => {
    const markup = renderToStaticMarkup(await AdminTaxonomyPage());

    expect(markup).toContain("Categories");
    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="slug"');
  });
});
