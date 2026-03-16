// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MarkdownEditorField from "../../components/admin/MarkdownEditorField";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MarkdownEditorField", () => {
  it("switches from edit to preview and renders returned html", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ html: "<p><strong>Preview</strong> content</p>" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue="**Preview** content"
        mode="post"
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));

    expect(await screen.findByTestId("markdown-preview-content")).toBeTruthy();
    expect(screen.getByTestId("markdown-preview-content").textContent).toBe("Preview content");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/markdown-preview", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ value: "**Preview** content", mode: "post" }),
    }));
  });

  it("keeps the textarea value when toggling back from preview", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ html: "<p>hello</p>" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="content"
        label="Content"
        initialValue=""
        mode="micro"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Content" });
    fireEvent.change(textbox, { target: { value: "第一行\n第二行" } });
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    await screen.findByText("hello");
    fireEvent.click(screen.getByRole("tab", { name: "Edit" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Content" }).value).toBe("第一行\n第二行");
    });
  });
});
