import { db } from "../db";
import { ensureTags } from "./tags";

function includeMicroPostRelations() {
  return {
    tags: {
      include: {
        tag: true,
      },
    },
  };
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

async function syncMicroPostTags(tx, microPostId, tags = []) {
  await tx.microPostTag.deleteMany({
    where: { microPostId },
  });

  const ensuredTags = await ensureTags(tags);
  if (!ensuredTags.length) {
    return;
  }

  await tx.microPostTag.createMany({
    data: ensuredTags.map((tag) => ({
      microPostId,
      tagId: tag.id,
    })),
  });
}

export async function createMicroPost(input) {
  const created = await db.$transaction(async (tx) => {
    const microPost = await tx.microPost.create({
      data: {
        content: input.content,
        status: normalizeStatus(input.status),
        publishedAt: publishedAtForStatus(input.status, input.publishedAt),
      },
    });

    await syncMicroPostTags(tx, microPost.id, input.tags || []);

    return tx.microPost.findUnique({
      where: { id: microPost.id },
      include: includeMicroPostRelations(),
    });
  });

  return created;
}

export async function updateMicroPost(id, input) {
  const updated = await db.$transaction(async (tx) => {
    await tx.microPost.update({
      where: { id },
      data: {
        content: input.content,
        status: normalizeStatus(input.status),
        publishedAt: publishedAtForStatus(input.status, input.publishedAt),
      },
    });

    await syncMicroPostTags(tx, id, input.tags || []);

    return tx.microPost.findUnique({
      where: { id },
      include: includeMicroPostRelations(),
    });
  });

  return updated;
}

export async function listMicroPosts() {
  return db.microPost.findMany({
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: includeMicroPostRelations(),
  });
}

export async function getMicroPostById(id) {
  return db.microPost.findUnique({
    where: { id },
    include: includeMicroPostRelations(),
  });
}

export async function getPublishedMicroPosts() {
  return db.microPost.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: includeMicroPostRelations(),
  });
}
