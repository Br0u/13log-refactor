import { db } from "../db";

async function getPublishedPostRecord(slug) {
  return db.post.findFirst({
    where: {
      slug,
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
