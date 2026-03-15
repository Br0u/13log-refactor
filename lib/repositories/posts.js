import { Prisma } from "@prisma/client";
import { db } from "../db";
import { getCategoryById } from "./categories";
import { ensureTags } from "./tags";

function includePostRelations() {
  return {
    category: true,
    tags: {
      include: {
        tag: true,
      },
    },
  };
}

async function assertCategoryExists(categoryId) {
  if (!categoryId) return null;
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
}

async function syncPostTags(tx, postId, tags = []) {
  await tx.postTag.deleteMany({
    where: { postId },
  });

  const ensuredTags = await ensureTags(tags);

  if (!ensuredTags.length) {
    return;
  }

  await tx.postTag.createMany({
    data: ensuredTags.map((tag) => ({
      postId,
      tagId: tag.id,
    })),
  });
}

function normalizeStatus(status) {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function publishedAtForStatus(status, publishedAt) {
  if (normalizeStatus(status) !== "PUBLISHED") {
    return null;
  }
  return publishedAt || new Date();
}

export async function createPost(input) {
  await assertCategoryExists(input.categoryId);

  try {
    const created = await db.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: input.title,
          slug: input.slug,
          summary: input.summary || null,
          markdown: input.markdown,
          coverImage: input.coverImage || null,
          status: normalizeStatus(input.status),
          publishedAt: publishedAtForStatus(input.status, input.publishedAt),
          categoryId: input.categoryId || null,
        },
      });

      await syncPostTags(tx, post.id, input.tags || []);

      return tx.post.findUnique({
        where: { id: post.id },
        include: includePostRelations(),
      });
    });

    return created;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Post slug already exists");
    }
    throw error;
  }
}

export async function updatePost(id, input) {
  await assertCategoryExists(input.categoryId);

  try {
    const updated = await db.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          summary: input.summary || null,
          markdown: input.markdown,
          coverImage: input.coverImage || null,
          status: normalizeStatus(input.status),
          publishedAt: publishedAtForStatus(input.status, input.publishedAt),
          categoryId: input.categoryId || null,
        },
      });

      await syncPostTags(tx, id, input.tags || []);

      return tx.post.findUnique({
        where: { id },
        include: includePostRelations(),
      });
    });

    return updated;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Post slug already exists");
    }
    throw error;
  }
}

export async function getPublishedPostBySlug(slug) {
  return db.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: includePostRelations(),
  });
}

export async function getPublishedPosts() {
  return db.post.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: includePostRelations(),
  });
}
