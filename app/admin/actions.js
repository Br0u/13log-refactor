"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMicroPost, updateMicroPost } from "../../lib/repositories/micro-posts";
import { createPost, updatePost } from "../../lib/repositories/posts";
import { db } from "../../lib/db";
import { approveComment, removeComment } from "../../lib/repositories/comments";
import { approveGuestbookEntry, removeGuestbookEntry } from "../../lib/repositories/guestbook";

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parsePublishedAt(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePostFormData(formData) {
  return {
    title: String(formData.get("title") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    summary: String(formData.get("summary") || "").trim(),
    markdown: String(formData.get("markdown") || ""),
    coverImage: String(formData.get("coverImage") || "").trim(),
    status: String(formData.get("status") || "DRAFT"),
    publishedAt: parsePublishedAt(formData.get("publishedAt")),
    categoryId: String(formData.get("categoryId") || "").trim() || null,
    tags: parseTags(formData.get("tags")),
  };
}

function parseMicroPostFormData(formData) {
  return {
    content: String(formData.get("content") || "").trim(),
    status: String(formData.get("status") || "DRAFT"),
    publishedAt: parsePublishedAt(formData.get("publishedAt")),
    tags: parseTags(formData.get("tags")),
  };
}

function revalidateSharedAdminPaths() {
  revalidatePath("/admin");
}

function revalidatePostTimelinePaths() {
  revalidatePath("/posts");
  revalidatePath("/posts/page/[page]", "page");
  revalidatePath("/index.json");
  revalidatePath("/rss.xml");
}

function revalidateAdminPostsPaths(postId) {
  revalidateSharedAdminPaths();
  revalidatePath("/admin/posts");
  if (postId) {
    revalidatePath(`/admin/posts/${postId}`);
  }
}

function revalidateAdminMicroPostsPaths(microPostId) {
  revalidateSharedAdminPaths();
  revalidatePath("/admin/micro-posts");
  if (microPostId) {
    revalidatePath(`/admin/micro-posts/${microPostId}`);
  }
}

export async function createPostAction(formData) {
  const post = await createPost(parsePostFormData(formData));
  revalidateAdminPostsPaths(post.id);
  revalidatePostTimelinePaths();
  if (post?.slug) {
    revalidatePath(`/posts/${post.slug}`);
  }
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(postId, formData) {
  const post = await updatePost(postId, parsePostFormData(formData));
  revalidateAdminPostsPaths(postId);
  revalidatePostTimelinePaths();
  if (post?.slug) {
    revalidatePath(`/posts/${post.slug}`);
  }
}

export async function createMicroPostAction(formData) {
  const microPost = await createMicroPost(parseMicroPostFormData(formData));
  revalidateAdminMicroPostsPaths(microPost.id);
  revalidatePostTimelinePaths();
  redirect(`/admin/micro-posts/${microPost.id}`);
}

export async function updateMicroPostAction(microPostId, formData) {
  await updateMicroPost(microPostId, parseMicroPostFormData(formData));
  revalidateAdminMicroPostsPaths(microPostId);
  revalidatePostTimelinePaths();
}

export async function createCategoryAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name || !slug) {
    return;
  }

  await db.category.upsert({
    where: { slug },
    update: { name, description: description || null },
    create: { name, slug, description: description || null },
  });

  revalidateSharedAdminPaths();
  revalidatePath("/admin/categories");
  revalidatePath("/posts");
}

export async function createTagAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!name || !slug) {
    return;
  }

  await db.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });

  revalidateSharedAdminPaths();
  revalidatePath("/admin/tags");
  revalidatePath("/posts");
}

export async function deletePostAction(postId) {
  const deletedPost = await db.post.delete({
    where: { id: postId },
  });
  revalidateAdminPostsPaths(postId);
  revalidatePostTimelinePaths();
  if (deletedPost?.slug) {
    revalidatePath(`/posts/${deletedPost.slug}`);
  }
  redirect("/admin/posts");
}

export async function deleteMicroPostAction(microPostId) {
  await db.microPost.delete({
    where: { id: microPostId },
  });
  revalidateAdminMicroPostsPaths(microPostId);
  revalidatePostTimelinePaths();
  redirect("/admin/micro-posts");
}

export async function deleteCommentAction(commentId) {
  await removeComment(commentId);
  revalidateSharedAdminPaths();
  revalidatePath("/admin/comments");
}

export async function approveCommentAction(commentId) {
  await approveComment(commentId);
  revalidateSharedAdminPaths();
  revalidatePath("/admin/comments");
}

export async function approveGuestbookEntryAction(entryId) {
  await approveGuestbookEntry(entryId);
  revalidateSharedAdminPaths();
  revalidatePath("/admin/comments");
  revalidatePath("/about");
}

export async function deleteGuestbookEntryAction(entryId) {
  await removeGuestbookEntry(entryId);
  revalidateSharedAdminPaths();
  revalidatePath("/admin/comments");
  revalidatePath("/about");
}

export async function deleteCategoryAction(categoryId) {
  const postsCount = await db.post.count({
    where: { categoryId },
  });

  if (postsCount > 0) {
    throw new Error("Cannot delete a category that is still assigned to posts");
  }

  await db.category.delete({
    where: { id: categoryId },
  });
  revalidateSharedAdminPaths();
  revalidatePath("/admin/categories");
  revalidatePath("/posts");
}

export async function deleteTagAction(tagId) {
  await db.tag.delete({
    where: { id: tagId },
  });
  revalidateSharedAdminPaths();
  revalidatePath("/admin/tags");
  revalidatePath("/posts");
}
