import { db } from "../db";

async function getPublishedPostRecord(slug) {
  return db.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

async function getPublishedMicroPostRecord(id) {
  return db.microPost.findFirst({
    where: {
      id,
      status: "PUBLISHED",
    },
  });
}

export async function createPostLike({ slug, visitorKey }) {
  const post = await getPublishedPostRecord(slug);

  if (!post) {
    throw new Error("Post not found");
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.postLike.findUnique({
      where: {
        postId_visitorKey: {
          postId: post.id,
          visitorKey,
        },
      },
    });

    if (existing) {
      return tx.post.findUnique({
        where: { id: post.id },
        select: { likeCount: true },
      });
    }

    await tx.postLike.create({
      data: {
        postId: post.id,
        visitorKey,
      },
    });

    return tx.post.update({
      where: { id: post.id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      select: { likeCount: true },
    });
  });
}

export async function getPostLikeCount(slug) {
  const post = await getPublishedPostRecord(slug);
  return post?.likeCount || 0;
}

export async function createMicroPostLike({ id, visitorKey }) {
  const microPost = await getPublishedMicroPostRecord(id);

  if (!microPost) {
    throw new Error("Micro post not found");
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.microPostLike.findUnique({
      where: {
        microPostId_visitorKey: {
          microPostId: microPost.id,
          visitorKey,
        },
      },
    });

    if (existing) {
      return tx.microPost.findUnique({
        where: { id: microPost.id },
        select: { likeCount: true },
      });
    }

    await tx.microPostLike.create({
      data: {
        microPostId: microPost.id,
        visitorKey,
      },
    });

    return tx.microPost.update({
      where: { id: microPost.id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      select: { likeCount: true },
    });
  });
}

export async function getMicroPostLikeCount(id) {
  const microPost = await getPublishedMicroPostRecord(id);
  return microPost?.likeCount || 0;
}
