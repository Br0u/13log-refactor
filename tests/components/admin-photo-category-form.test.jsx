import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { submitButtonMock } = vi.hoisted(() => ({
  submitButtonMock: vi.fn(({ label, pendingLabel }) => (
    <button type="submit" data-pending-label={pendingLabel}>{label}</button>
  )),
}));

vi.mock("../../components/admin/AdminSubmitButton", () => ({
  default: submitButtonMock,
}));

import AdminPhotoCategoryForm from "../../components/admin/AdminPhotoCategoryForm.jsx";

describe("admin photo category form", () => {
  it("renders the category fields and save button", () => {
    const markup = renderToStaticMarkup(<AdminPhotoCategoryForm />);

    expect(markup).toContain('name="name"');
    expect(markup).toContain('name="slug"');
    expect(markup).toContain('name="albumAnnotation"');
    expect(markup).toContain('name="displayTitle"');
    expect(markup).toContain('name="coverTitle"');
    expect(markup).toContain('name="indexDescription"');
    expect(markup).toContain('name="detailDescription"');
    expect(markup).toContain('name="status"');
    expect(markup).toContain('name="sortOrder"');
    expect(markup).toContain("Save category");
  });
});
