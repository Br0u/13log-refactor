import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminLayout from "../../app/admin/layout";

describe("admin layout", () => {
  it("renders the primary admin navigation", async () => {
    const markup = renderToStaticMarkup(
      await AdminLayout({
        children: "<div>content</div>",
      })
    );

    expect(markup).toContain("/admin/posts");
    expect(markup).toContain("/admin/categories");
    expect(markup).toContain("/admin/tags");
    expect(markup).toContain("/admin/comments");
  });
});
