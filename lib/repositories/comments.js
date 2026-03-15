import { z } from "zod";
import { db } from "../db";

const commentSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  content: z.string().trim().min(1).max(1000),
});

async function getPublishedPostRecord(slug) {
  return db.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

export async function createComment({ slug, nickname, content }) {
  const parsed = commentSchema.parse({ nickname, content });
  const post = await getPublishedPostRecord(slug);

  if (!post) {
    throw new Error("Post not found");
  }

  return db.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        postId: post.id,
        nickname: parsed.nickname,
        content: parsed.content,
        status: "APPROVED",
      },
    });

    await tx.post.update({
      where: { id: post.id },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return comment;
  });
}

export async function getApprovedCommentsBySlug(slug) {
  const post = await getPublishedPostRecord(slug);
  if (!post) {
    return [];
  }

  return db.comment.findMany({
    where: {
      postId: post.id,
      status: "APPROVED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function removeComment(commentId) {
  return db.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return null;
    }

    await tx.comment.delete({
      where: { id: commentId },
    });

    await tx.post.update({
      where: { id: comment.postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });

    return comment;
  });
}
