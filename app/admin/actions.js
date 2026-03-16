"use server";

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

function parsePostFormData(formData) {
  return {
    title: String(formData.get("title") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    summary: String(formData.get("summary") || "").trim(),
    markdown: String(formData.get("markdown") || ""),
    coverImage: String(formData.get("coverImage") || "").trim(),
    status: String(formData.get("status") || "DRAFT"),
    categoryId: String(formData.get("categoryId") || "").trim() || null,
    tags: parseTags(formData.get("tags")),
  };
}

function parseMicroPostFormData(formData) {
  return {
    content: String(formData.get("content") || "").trim(),
    status: String(formData.get("status") || "DRAFT"),
    tags: parseTags(formData.get("tags")),
  };
}

export async function createPostAction(formData) {
  const post = await createPost(parsePostFormData(formData));
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(postId, formData) {
  await updatePost(postId, parsePostFormData(formData));
  redirect(`/admin/posts/${postId}`);
}

export async function createMicroPostAction(formData) {
  const microPost = await createMicroPost(parseMicroPostFormData(formData));
  redirect(`/admin/micro-posts/${microPost.id}`);
}

export async function updateMicroPostAction(microPostId, formData) {
  await updateMicroPost(microPostId, parseMicroPostFormData(formData));
  redirect(`/admin/micro-posts/${microPostId}`);
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

  redirect("/admin/categories");
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

  redirect("/admin/tags");
}

export async function deletePostAction(postId) {
  await db.post.delete({
    where: { id: postId },
  });
}

export async function deleteMicroPostAction(microPostId) {
  await db.microPost.delete({
    where: { id: microPostId },
  });
}

export async function deleteCommentAction(commentId) {
  await removeComment(commentId);
}

export async function approveCommentAction(commentId) {
  await approveComment(commentId);
}

export async function approveGuestbookEntryAction(entryId) {
  await approveGuestbookEntry(entryId);
}

export async function deleteGuestbookEntryAction(entryId) {
  await removeGuestbookEntry(entryId);
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
}

export async function deleteTagAction(tagId) {
  await db.tag.delete({
    where: { id: tagId },
  });
}
