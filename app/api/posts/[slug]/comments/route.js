import { ZodError } from "zod";
import { createComment, getApprovedCommentsBySlug } from "../../../../../lib/repositories/comments";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const comments = await getApprovedCommentsBySlug(slug);

  return new Response(JSON.stringify({ comments }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json();

  try {
    const comment = await createComment({
      slug,
      nickname: body.nickname || "",
      content: body.content || "",
    });

    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 404;
    return new Response(JSON.stringify({ message: error.message }), {
      status,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
