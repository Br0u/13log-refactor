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

  it("uploads a pasted image and inserts markdown at the caret", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        return {
          ok: true,
          json: async () => ({ url: "https://blob.example/test.png" }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue="hello "
        mode="post"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Markdown" });
    textbox.setSelectionRange(6, 6);

    const file = new File(["png"], "pasted.png", { type: "image/png" });
    fireEvent.paste(textbox, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value)
        .toBe("hello ![image](https://blob.example/test.png)");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/uploads/image",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("does not upload on text-only paste", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue=""
        mode="post"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Markdown" });
    fireEvent.paste(textbox, {
      clipboardData: {
        items: [
          {
            kind: "string",
            type: "text/plain",
            getAsFile: () => null,
          },
        ],
      },
    });

    expect(fetchMock).not.toHaveBeenCalledWith("/api/admin/uploads/image", expect.anything());
  });

  it("shows an upload error and preserves content when image upload fails", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        return {
          ok: false,
          json: async () => ({ message: "Upload failed" }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="content"
        label="Content"
        initialValue="before"
        mode="micro"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Content" });
    textbox.setSelectionRange(6, 6);

    const file = new File(["png"], "broken.png", { type: "image/png" });
    fireEvent.paste(textbox, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      },
    });

    expect(await screen.findByText("Image upload failed.")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Content" }).value).toBe("before");
  });

  it("uploads a selected image from the picker and inserts markdown at the caret", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        return {
          ok: true,
          json: async () => ({ url: "https://blob.example/mobile.png" }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue="mobile "
        mode="post"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Markdown" });
    textbox.setSelectionRange(7, 7);

    const fileInput = screen.getByLabelText("Upload image");
    const file = new File(["png"], "mobile.png", { type: "image/png" });
    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value)
        .toBe("mobile ![image](https://blob.example/mobile.png)");
    });
  });
});
