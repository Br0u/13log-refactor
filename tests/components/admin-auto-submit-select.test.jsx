import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import AdminAutoSubmitSelect from "../../components/admin/AdminAutoSubmitSelect.jsx";

describe("admin auto submit select", () => {
  it("renders a dedicated status select UI hook", () => {
    const markup = renderToStaticMarkup(
      <AdminAutoSubmitSelect
        name="status"
        defaultValue="PUBLISHED"
        ariaLabel="Album status"
        options={[
          { value: "DRAFT", label: "DRAFT" },
          { value: "PUBLISHED", label: "PUBLISHED" },
        ]}
      />
    );

    expect(markup).toContain('class="admin-status-select"');
    expect(markup).toContain('data-status="published"');
    expect(markup).toContain('name="status"');
  });
});
