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

  it("shows a live character count for post markdown fields only", () => {
    const { rerender } = render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue="你好world"
        mode="post"
      />
    );

    expect(screen.getByText("字数 7")).toBeTruthy();

    rerender(
      <MarkdownEditorField
        name="content"
        label="Content"
        initialValue="你好world"
        mode="micro"
      />
    );

    expect(screen.queryByText("字数 7")).toBeNull();
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

  it("renders a two-image upload trigger", () => {
    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue="gallery "
        mode="post"
      />
    );

    expect(screen.getByText("+ Two Images").tagName).toBe("LABEL");
    expect(screen.getByLabelText("Upload two images")).toBeTruthy();
  });

  it("uploads two selected images and inserts a duo images shortcode", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        return {
          ok: true,
          json: async () => ({
            url: callIndex === 1 ? "https://blob.example/left.png" : "https://blob.example/right.png",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", vi.fn((message, defaultValue) => {
      if (String(message).includes("left")) return "山雾";
      if (String(message).includes("right")) return "湖光";
      return defaultValue || "";
    }));

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue=""
        mode="post"
      />
    );

    const textbox = screen.getByRole("textbox", { name: "Markdown" });
    textbox.setSelectionRange(0, 0);

    const fileInput = screen.getByLabelText("Upload two images");
    const leftFile = new File(["left"], "left.png", { type: "image/png" });
    const rightFile = new File(["right"], "right.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [leftFile, rightFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value).toBe(
        '{{< duo_images left="https://blob.example/left.png" leftAlt="山雾" right="https://blob.example/right.png" rightAlt="湖光" >}}'
      );
    });
  });

  it("shows an upload error and skips inserting a duo images shortcode when one upload fails", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        if (callIndex === 1) {
          return {
            ok: true,
            json: async () => ({ url: "https://blob.example/left.png" }),
          };
        }

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
        name="markdown"
        label="Markdown"
        initialValue="before"
        mode="post"
      />
    );

    const fileInput = screen.getByLabelText("Upload two images");
    const leftFile = new File(["left"], "left.png", { type: "image/png" });
    const rightFile = new File(["right"], "right.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [leftFile, rightFile],
      },
    });

    expect(await screen.findByText("Image upload failed.")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Markdown" }).value).toBe("before");
  });

  it("falls back to default duo image captions when prompts are blank", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        return {
          ok: true,
          json: async () => ({
            url: callIndex === 1 ? "https://blob.example/left.png" : "https://blob.example/right.png",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", vi.fn(() => ""));

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue=""
        mode="post"
      />
    );

    const fileInput = screen.getByLabelText("Upload two images");
    const leftFile = new File(["left"], "left.png", { type: "image/png" });
    const rightFile = new File(["right"], "right.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [leftFile, rightFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value).toBe(
        '{{< duo_images left="https://blob.example/left.png" leftAlt="左图说明" right="https://blob.example/right.png" rightAlt="右图说明" >}}'
      );
    });
  });

  it("allows selecting the two upload images across two picker interactions", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        return {
          ok: true,
          json: async () => ({
            url: callIndex === 1 ? "https://blob.example/left.png" : "https://blob.example/right.png",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", vi.fn(() => ""));

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue=""
        mode="post"
      />
    );

    const fileInput = screen.getByLabelText("Upload two images");
    const leftFile = new File(["left"], "left.png", { type: "image/png" });
    const rightFile = new File(["right"], "right.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [leftFile],
      },
    });

    expect(await screen.findByText("Choose the second image to complete the pair.")).toBeTruthy();

    fireEvent.change(fileInput, {
      target: {
        files: [rightFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value).toBe(
        '{{< duo_images left="https://blob.example/left.png" leftAlt="左图说明" right="https://blob.example/right.png" rightAlt="右图说明" >}}'
      );
    });
  });

  it("collects two pasted images in duo mode and inserts a duo images shortcode", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === "/api/admin/uploads/image") {
        const callIndex = fetchMock.mock.calls.filter(([target]) => target === "/api/admin/uploads/image").length;
        return {
          ok: true,
          json: async () => ({
            url: callIndex === 1 ? "https://blob.example/paste-left.png" : "https://blob.example/paste-right.png",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ html: "<p>unused</p>" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", vi.fn((message, defaultValue) => {
      if (String(message).includes("left")) return "左贴图";
      if (String(message).includes("right")) return "右贴图";
      return defaultValue || "";
    }));

    render(
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue=""
        mode="post"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Paste Two Images" }));

    const textbox = screen.getByRole("textbox", { name: "Markdown" });
    const leftFile = new File(["left"], "left.png", { type: "image/png" });
    const rightFile = new File(["right"], "right.png", { type: "image/png" });

    fireEvent.paste(textbox, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => leftFile,
          },
        ],
      },
    });

    expect(await screen.findByText("Paste the second image to complete the pair.")).toBeTruthy();

    fireEvent.paste(textbox, {
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => rightFile,
          },
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Markdown" }).value).toBe(
        '{{< duo_images left="https://blob.example/paste-left.png" leftAlt="左贴图" right="https://blob.example/paste-right.png" rightAlt="右贴图" >}}'
      );
    });
  });
});
