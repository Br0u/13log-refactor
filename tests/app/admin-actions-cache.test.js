import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  createPostMock,
  updatePostMock,
  createMicroPostMock,
  updateMicroPostMock,
  createPhotoMock,
  updatePhotoMock,
  approveCommentMock,
  removeCommentMock,
  approveGuestbookEntryMock,
  removeGuestbookEntryMock,
  requireAdminSessionMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  createPostMock: vi.fn(),
  updatePostMock: vi.fn(),
  createMicroPostMock: vi.fn(),
  updateMicroPostMock: vi.fn(),
  createPhotoMock: vi.fn(),
  updatePhotoMock: vi.fn(),
  approveCommentMock: vi.fn(),
  removeCommentMock: vi.fn(),
  approveGuestbookEntryMock: vi.fn(),
  removeGuestbookEntryMock: vi.fn(),
  requireAdminSessionMock: vi.fn(),
}));

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("../../lib/repositories/posts", () => ({
  createPost: createPostMock,
  updatePost: updatePostMock,
}));

vi.mock("../../lib/repositories/micro-posts", () => ({
  createMicroPost: createMicroPostMock,
  updateMicroPost: updateMicroPostMock,
}));

vi.mock("../../lib/repositories/photos", () => ({
  createPhoto: createPhotoMock,
  updatePhoto: updatePhotoMock,
}));

vi.mock("../../lib/repositories/comments", () => ({
  approveComment: approveCommentMock,
  removeComment: removeCommentMock,
}));

vi.mock("../../lib/repositories/guestbook", () => ({
  approveGuestbookEntry: approveGuestbookEntryMock,
  removeGuestbookEntry: removeGuestbookEntryMock,
}));

vi.mock("../../lib/db", () => ({
  db: {
    category: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    photoCategory: {
      upsert: vi.fn(),
    },
    photo: {
      delete: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    post: {
      delete: vi.fn(),
      count: vi.fn(async () => 0),
    },
    microPost: {
      delete: vi.fn(),
    },
  },
}));

import {
  approveCommentAction,
  createPhotoAction,
  createPhotoCategoryAction,
  createCategoryAction,
  createMicroPostAction,
  createPostAction,
  deletePhotoAction,
  deletePostAction,
  updateMicroPostAction,
  updatePhotoAction,
  updatePostAction,
} from "../../app/admin/actions";
import { db } from "../../lib/db";

describe("admin action cache behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminSessionMock.mockResolvedValue({ username: "admin" });
  });

  it("updates a post without relying on next/cache.refresh and invalidates related routes", async () => {
    updatePostMock.mockResolvedValueOnce({
      id: "post-1",
      slug: "updated-post",
      status: "PUBLISHED",
    });

    const formData = new FormData();
    formData.set("title", "Updated");
    formData.set("slug", "updated-post");
    formData.set("markdown", "# Updated");
    formData.set("status", "PUBLISHED");

    await updatePostAction("post-1", formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts/post-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/updated-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/index.json");
    expect(revalidatePathMock).toHaveBeenCalledWith("/rss.xml");
  });

  it("creates a category without relying on next/cache.refresh", async () => {
    const formData = new FormData();
    formData.set("name", "Notes");
    formData.set("slug", "notes");

    await createCategoryAction(formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/categories");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
  });

  it("redirects to the posts list and invalidates related routes after deleting a post", async () => {
    db.post.delete.mockResolvedValueOnce({
      id: "post-1",
      slug: "deleted-post",
    });

    await deletePostAction("post-1");

    expect(redirectMock).toHaveBeenCalledWith("/admin/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts/post-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/deleted-post");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
  });

  it("approves a comment without relying on next/cache.refresh", async () => {
    approveCommentMock.mockResolvedValueOnce({
      id: "comment-1",
      postId: "post-1",
    });

    await approveCommentAction("comment-1");

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/comments");
  });

  it("updates a micro post without relying on next/cache.refresh and invalidates related routes", async () => {
    updateMicroPostMock.mockResolvedValueOnce({
      id: "micro-1",
      status: "PUBLISHED",
    });

    const formData = new FormData();
    formData.set("content", "Updated micro");
    formData.set("status", "PUBLISHED");

    await updateMicroPostAction("micro-1", formData);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/micro-posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/micro-posts/micro-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/posts/page/[page]", "page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/index.json");
    expect(revalidatePathMock).toHaveBeenCalledWith("/rss.xml");
  });

  it.each([
    ["post", "2026-03-16T09:30:00.000Z", "2026-03-16T09:30:00.000Z"],
    ["post", "2026-03-16T05:30:00-04:00", "2026-03-16T09:30:00.000Z"],
    ["post", "2026-03-16T05:30", null],
    ["post", "2026-03-16", null],
    ["post", "2026-02-30T09:30:00Z", null],
    ["post", "invalid", null],
    ["micro", "2026-03-16T09:30:00.000Z", "2026-03-16T09:30:00.000Z"],
    ["micro", "2026-03-16T05:30:00-04:00", "2026-03-16T09:30:00.000Z"],
    ["micro", "2026-03-16T05:30", null],
    ["micro", "2026-03-16", null],
    ["micro", "2026-02-30T09:30:00Z", null],
    ["micro", "invalid", null],
  ])("parses %s publishedAt %s only when it has an explicit timezone", async (kind, input, expected) => {
    const formData = new FormData();
    formData.set("status", "PUBLISHED");
    formData.set("publishedAt", input);

    if (kind === "post") {
      updatePostMock.mockResolvedValueOnce({ id: "post-1", slug: "post", status: "PUBLISHED" });
      await updatePostAction("post-1", formData);
      const publishedAt = updatePostMock.mock.calls.at(-1)[1].publishedAt;
      expect(publishedAt?.toISOString() ?? null).toBe(expected);
      return;
    }

    createMicroPostMock.mockResolvedValueOnce({ id: "micro-1", status: "PUBLISHED" });
    await createMicroPostAction(formData);
    const publishedAt = createMicroPostMock.mock.calls.at(-1)[0].publishedAt;
    expect(publishedAt?.toISOString() ?? null).toBe(expected);
  });

  it("returns a form error instead of throwing when creating a post with a duplicate slug", async () => {
    createPostMock.mockRejectedValueOnce(new Error("Post slug already exists"));

    const formData = new FormData();
    formData.set("title", "Duplicate");
    formData.set("slug", "duplicate-post");
    formData.set("markdown", "# Duplicate");
    formData.set("status", "DRAFT");

    const result = await createPostAction({ error: "" }, formData);

    expect(result).toEqual({ error: "Post slug already exists" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("creates a photo category and revalidates the photos surfaces", async () => {
    const formData = new FormData();
    formData.set("name", "Travel");
    formData.set("slug", "travel");
    formData.set("albumAnnotation", "注释词");
    formData.set("displayTitle", "「世界は　ただ通り過ぎていく」");
    formData.set("coverTitle", "「世界は　ただ通り過ぎていく」");
    formData.set("indexDescription", "車窗之外，世界剛好經過。");
    formData.set("detailDescription", "沒有停留，也沒有帶走什麼。");
    formData.set("status", "PUBLISHED");
    formData.set("sortOrder", "4");

    await createPhotoCategoryAction(formData);

    expect(db.photoCategory.upsert).toHaveBeenCalledWith({
      where: { slug: "travel" },
      update: {
        name: "Travel",
        description: null,
        albumAnnotation: "注释词",
        displayTitle: "「世界は　ただ通り過ぎていく」",
        coverTitle: "「世界は　ただ通り過ぎていく」",
        indexDescription: "車窗之外，世界剛好經過。",
        detailDescription: "沒有停留，也沒有帶走什麼。",
        status: "PUBLISHED",
        sortOrder: 4,
      },
      create: {
        name: "Travel",
        slug: "travel",
        description: null,
        albumAnnotation: "注释词",
        displayTitle: "「世界は　ただ通り過ぎていく」",
        coverTitle: "「世界は　ただ通り過ぎていく」",
        indexDescription: "車窗之外，世界剛好經過。",
        detailDescription: "沒有停留，也沒有帶走什麼。",
        status: "PUBLISHED",
        sortOrder: 4,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/photos");
  });

  it("creates a photo and redirects to the photos manager", async () => {
    createPhotoMock.mockResolvedValueOnce({
      id: "photo-1",
      category: { slug: "travel" },
    });

    const formData = new FormData();
    formData.set("title", "Morning Light");
    formData.set("imageUrl", "https://cdn.example.com/morning-light.jpg");
    formData.set("categoryId", "cat-1");

    await createPhotoAction({ error: "" }, formData);

    expect(createPhotoMock).toHaveBeenCalledWith({
      title: "Morning Light",
      caption: "",
      imageUrl: "https://cdn.example.com/morning-light.jpg",
      altText: "",
      categoryId: "cat-1",
      sortOrder: 0,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/photos");
    expect(redirectMock).toHaveBeenCalledWith("/admin/photos?created=1");
  });

  it("updates a photo and revalidates the album surfaces", async () => {
    updatePhotoMock.mockResolvedValueOnce({
      id: "photo-1",
      categoryId: "album-1",
      category: { id: "album-1", slug: "editorial" },
    });

    const formData = new FormData();
    formData.set("title", "Morning Light");
    formData.set("caption", "Quiet stone");
    formData.set("categoryId", "album-1");
    formData.set("sortOrder", "4");

    await updatePhotoAction("photo-1", "album-1", formData);

    expect(updatePhotoMock).toHaveBeenCalledWith("photo-1", {
      title: "Morning Light",
      caption: "Quiet stone",
      imageUrl: "",
      altText: "",
      categoryId: "album-1",
      sortOrder: 4,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos/album-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos/album/album-1/photo-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/photos");
  });

  it("deletes a photo and redirects back to its album", async () => {
    db.photo.delete.mockResolvedValueOnce({
      id: "photo-1",
      categoryId: "album-1",
    });

    await deletePhotoAction("photo-1", "album-1");

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos/album-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/photos/album/album-1/photo-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/photos");
    expect(redirectMock).toHaveBeenCalledWith("/admin/photos/album-1");
  });
});
