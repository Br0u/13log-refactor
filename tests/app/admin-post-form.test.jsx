// @vitest-environment jsdom
import React from "react";
import { act } from "react";
import { fireEvent } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import AdminPostForm from "../../components/admin/AdminPostForm";

const { submitButtonMock } = vi.hoisted(() => ({
  submitButtonMock: vi.fn(({ label, pendingLabel }) => (
    <button type="submit" data-pending-label={pendingLabel}>{label}</button>
  )),
}));

vi.mock("../../components/admin/AdminSubmitButton", () => ({
  default: submitButtonMock,
}));

describe("admin post form", () => {
  beforeAll(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

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
    expect(markup).toContain("Save post");
  });

  it.each([
    ["ISO string", "2026-03-16T09:30:00.000Z"],
    ["Date", new Date("2026-03-16T09:30:00.000Z")],
  ])("round-trips a published post timestamp from SSR through hydration for a %s", async (_kind, publishedAt) => {
    const props = {
      categories: [],
      initialValue: {
        title: "Published post",
        slug: "published-post",
        summary: "",
        markdown: "body",
        status: "PUBLISHED",
        publishedAt,
        categoryId: "",
        tags: [],
      },
    };
    const element = <AdminPostForm {...props} />;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const markup = renderToString(element);
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.append(container);

    const visibleBeforeHydration = container.querySelector('input[type="datetime-local"]');
    const hiddenBeforeHydration = container.querySelector('input[type="hidden"][name="publishedAt"]');
    expect(visibleBeforeHydration?.getAttribute("name")).toBeNull();
    expect(visibleBeforeHydration?.value).toBe("");
    expect(hiddenBeforeHydration?.value).toBe("2026-03-16T09:30:00.000Z");

    let root;
    await act(async () => {
      root = hydrateRoot(container, element);
    });

    const expectedLocal = new Date("2026-03-16T09:30:00.000Z");
    const pad = (part) => String(part).padStart(2, "0");
    const visibleAfterHydration = container.querySelector('input[type="datetime-local"]');
    expect(visibleAfterHydration.value).toBe(
      `${expectedLocal.getFullYear()}-${pad(expectedLocal.getMonth() + 1)}-${pad(expectedLocal.getDate())}`
      + `T${pad(expectedLocal.getHours())}:${pad(expectedLocal.getMinutes())}`
    );

    await act(async () => {
      fireEvent.change(visibleAfterHydration, { target: { value: "2026-06-17T14:45" } });
    });
    const submittedUtc = container.querySelector('input[type="hidden"][name="publishedAt"]').value;
    expect(submittedUtc.endsWith("Z")).toBe(true);
    expect(new Date(submittedUtc).getTime()).toBe(new Date(2026, 5, 17, 14, 45).getTime());

    expect(() => {
      fireEvent.change(visibleAfterHydration, { target: { value: "" } });
    }).not.toThrow();
    expect(container.querySelector('input[type="hidden"][name="publishedAt"]').value).toBe("");

    expect(() => {
      fireEvent.change(visibleAfterHydration, { target: { value: "not-a-date" } });
    }).not.toThrow();
    expect(container.querySelector('input[type="hidden"][name="publishedAt"]').value).toBe("");
    expect(container.textContent).toContain("Edit using your local time.");
    expect(consoleError).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    consoleError.mockRestore();
  });

  it("renders a success notice and pending submit label when configured", () => {
    submitButtonMock.mockClear();

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
        successMessage="Post saved."
        submitLabel="Save post"
        pendingLabel="Saving..."
      />
    );

    expect(markup).toContain("Post saved.");
    expect(submitButtonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Save post",
        pendingLabel: "Saving...",
      }),
      undefined
    );
  });

  it("renders a form error when post creation fails validation", () => {
    const markup = renderToStaticMarkup(
      <AdminPostForm
        categories={[]}
        initialValue={{
          title: "Duplicate post",
          slug: "duplicate-post",
          summary: "",
          markdown: "body",
          status: "DRAFT",
          categoryId: "",
          tags: [],
        }}
        formState={{ error: "Post slug already exists" }}
      />
    );

    expect(markup).toContain("Post slug already exists");
  });
});
