"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMicroPost, updateMicroPost } from "../../lib/repositories/micro-posts";
import { createPost, updatePost } from "../../lib/repositories/posts";
import { createPhoto, updatePhoto } from "../../lib/repositories/photos";
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

function parseSortOrder(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parsePhotoFormData(formData) {
  return {
    title: String(formData.get("title") || "").trim(),
    caption: String(formData.get("caption") || "").trim(),
    imageUrl: String(formData.get("imageUrl") || "").trim(),
    altText: String(formData.get("altText") || "").trim(),
    categoryId: String(formData.get("categoryId") || "").trim() || null,
    sortOrder: parseSortOrder(formData.get("sortOrder")),
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

function revalidatePhotosPaths() {
  revalidatePath("/photos");
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

function revalidateAdminPhotosPaths() {
  revalidateSharedAdminPaths();
  revalidatePath("/admin/photos");
}

function revalidatePhotoAlbumPaths(albumId, photoId) {
  revalidateAdminPhotosPaths();
  if (albumId) {
    revalidatePath(`/admin/photos/${albumId}`);
  }
  if (albumId && photoId) {
    revalidatePath(`/admin/photos/album/${albumId}/${photoId}`);
  }
  revalidatePhotosPaths();
}
export async function createPostAction(_previousState, formData) {
  try {
    const post = await createPost(parsePostFormData(formData));
    revalidateAdminPostsPaths(post.id);
    revalidatePostTimelinePaths();
    if (post?.slug) {
      revalidatePath(`/posts/${post.slug}`);
    }
    redirect(`/admin/posts/${post.id}?created=1`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save post right now.",
    };
  }
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
  redirect(`/admin/micro-posts/${microPost.id}?created=1`);
}

export async function createPhotoAction(_previousState, formData) {
  try {
    await createPhoto(parsePhotoFormData(formData));
    revalidateAdminPhotosPaths();
    revalidatePhotosPaths();
    redirect("/admin/photos?created=1");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save photo right now.",
    };
  }
}

export async function updateMicroPostAction(microPostId, formData) {
  await updateMicroPost(microPostId, parseMicroPostFormData(formData));
  revalidateAdminMicroPostsPaths(microPostId);
  revalidatePostTimelinePaths();
}

export async function updatePhotoAction(photoId, albumId, formData) {
  await updatePhoto(photoId, parsePhotoFormData(formData));
  revalidatePhotoAlbumPaths(albumId, photoId);
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

export async function createPhotoCategoryAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const albumAnnotation = String(formData.get("albumAnnotation") || "").trim();
  const displayTitle = String(formData.get("displayTitle") || "").trim();
  const coverTitle = String(formData.get("coverTitle") || "").trim();
  const indexDescription = String(formData.get("indexDescription") || "").trim();
  const detailDescription = String(formData.get("detailDescription") || "").trim();
  const status = String(formData.get("status") || "DRAFT");
  const sortOrder = parseSortOrder(formData.get("sortOrder"));

  if (!name || !slug) {
    return;
  }

  await db.photoCategory.upsert({
    where: { slug },
    update: {
      name,
      description: description || null,
      albumAnnotation: albumAnnotation || null,
      displayTitle: displayTitle || null,
      coverTitle: coverTitle || null,
      indexDescription: indexDescription || null,
      detailDescription: detailDescription || null,
      status,
      sortOrder,
    },
    create: {
      name,
      slug,
      description: description || null,
      albumAnnotation: albumAnnotation || null,
      displayTitle: displayTitle || null,
      coverTitle: coverTitle || null,
      indexDescription: indexDescription || null,
      detailDescription: detailDescription || null,
      status,
      sortOrder,
    },
  });

  revalidateAdminPhotosPaths();
  revalidatePhotosPaths();
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

export async function deletePhotoAction(photoId, albumId) {
  await db.photo.delete({
    where: { id: photoId },
  });
  revalidatePhotoAlbumPaths(albumId, photoId);
  redirect(`/admin/photos/${albumId}`);
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
