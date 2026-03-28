import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { submitButtonMock } = vi.hoisted(() => ({
  submitButtonMock: vi.fn(({ label, pendingLabel }) => (
    <button type="submit" data-pending-label={pendingLabel}>{label}</button>
  )),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("../../components/admin/AdminSubmitButton", () => ({
  default: submitButtonMock,
}));

import AdminPhotoForm from "../../components/admin/AdminPhotoForm.jsx";

describe("admin photo form", () => {
  it("renders mobile-friendly batch upload fields for a selected album", () => {
    const markup = renderToStaticMarkup(
      <AdminPhotoForm
        albumId="photo-cat-1"
        albumName="Editorial"
        categories={[
          { id: "photo-cat-1", name: "Editorial" },
        ]}
      />
    );

    expect(markup).toContain('name="file"');
    expect(markup).toContain('multiple=""');
    expect(markup).toContain('accept="image/');
    expect(markup).toContain('name="title"');
    expect(markup).toContain('name="caption"');
    expect(markup).toContain("Editorial");
    expect(markup).toContain('name="categoryId"');
    expect(markup).not.toContain("Select album");
    expect(markup).toContain('name="sortOrder"');
    expect(markup).toContain("Leave empty to append after existing photos in this album.");
    expect(markup).toContain("Leave title empty to reuse each file name during batch upload.");
    expect(markup).toContain("Upload photo");
    expect(markup).toContain("Save photo");
  });

  it("renders edit mode without requiring a new file upload", () => {
    const markup = renderToStaticMarkup(
      <AdminPhotoForm
        albumId="photo-cat-1"
        albumName="Editorial"
        mode="edit"
        submitLabel="Update photo"
        initialValue={{
          title: "Morning Light",
          caption: "Quiet stone",
          sortOrder: 4,
        }}
      />
    );

    expect(markup).toContain("Edit photo");
    expect(markup).not.toContain('name="file"');
    expect(markup).toContain('value="Morning Light"');
    expect(markup).toContain('>Quiet stone<');
    expect(markup).toContain('value="4"');
    expect(markup).not.toContain('name="status"');
    expect(markup).not.toContain('name="publishedAt"');
    expect(markup).toContain("Update photo");
  });
});
