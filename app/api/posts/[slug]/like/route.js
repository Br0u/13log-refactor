import { createPostLike } from "../../../../../lib/repositories/likes";

function getOrCreateVisitorKey(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const existing = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("visitor_key="));

  if (existing) {
    return {
      value: existing.replace("visitor_key=", ""),
      isNew: false,
    };
  }

  return {
    value: crypto.randomUUID(),
    isNew: true,
  };
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const visitor = getOrCreateVisitorKey(request);

  try {
    const result = await createPostLike({
      slug,
      visitorKey: visitor.value,
    });

    return new Response(JSON.stringify({ count: result.likeCount }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        ...(visitor.isNew
          ? {
              "set-cookie": `visitor_key=${visitor.value}; Path=/; HttpOnly; SameSite=Lax`,
            }
          : {}),
      },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Post not found" }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
