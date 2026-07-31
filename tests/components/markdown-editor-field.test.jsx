// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({
  upload: uploadMock,
}));

import MarkdownEditorField from "../../components/admin/MarkdownEditorField";

function mockUploadedUrls(...urls) {
  uploadMock.mockImplementation(async () => ({
    url: urls[Math.min(uploadMock.mock.calls.length - 1, urls.length - 1)],
  }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  uploadMock.mockReset();
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
    mockUploadedUrls("https://blob.example/test.png");

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

    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining("admin-images/"),
      file,
      expect.objectContaining({
        handleUploadUrl: "/api/admin/uploads/image/client",
        multipart: true,
      })
    );
  });

  it("does not upload on text-only paste", () => {
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

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("shows an upload error and preserves content when image upload fails", async () => {
    uploadMock.mockRejectedValue(new Error("Upload failed"));

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
    mockUploadedUrls("https://blob.example/mobile.png");

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

  it("uploads mobile HEIC images directly to blob storage instead of sending the raw file through the server", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("The raw image upload route should not be used.");
    });
    vi.stubGlobal("fetch", fetchMock);
    uploadMock.mockResolvedValue({
      url: "https://blob.example/mobile.heic",
      pathname: "admin-images/mobile.heic",
    });

    render(
      <MarkdownEditorField
        name="content"
        label="Content"
        initialValue=""
        mode="micro"
      />
    );

    const fileInput = screen.getByLabelText("Upload image");
    const mobilePhoto = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "IMG_0001.HEIC",
      { type: "" }
    );

    fireEvent.change(fileInput, {
      target: {
        files: [mobilePhoto],
      },
    });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith(
        expect.stringContaining("admin-images/"),
        mobilePhoto,
        expect.objectContaining({
          access: "public",
          handleUploadUrl: "/api/admin/uploads/image/client",
          contentType: "image/heic",
          multipart: true,
        })
      );
    });
    expect(screen.getByRole("textbox", { name: "Content" }).value)
      .toBe("![image](https://blob.example/mobile.heic)");
    expect(fetchMock).not.toHaveBeenCalled();
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
    mockUploadedUrls("https://blob.example/left.png", "https://blob.example/right.png");
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
    uploadMock.mockImplementation(async () => {
      if (uploadMock.mock.calls.length === 1) {
        return { url: "https://blob.example/left.png" };
      }
      throw new Error("Upload failed");
    });

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
    mockUploadedUrls("https://blob.example/left.png", "https://blob.example/right.png");
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
    mockUploadedUrls("https://blob.example/left.png", "https://blob.example/right.png");
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
    mockUploadedUrls("https://blob.example/paste-left.png", "https://blob.example/paste-right.png");
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
