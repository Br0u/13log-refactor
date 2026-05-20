import { handleUpload } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../../../lib/session";
import {
  ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
  ADMIN_IMAGE_MAX_SIZE_BYTES,
} from "../../../../../../lib/admin-image-files";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function assertAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const session = await readAdminSession(token);

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body?.type) {
    return json({ message: "Invalid upload request" }, 400);
  }

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        await assertAdminSession();

        if (!String(pathname || "").startsWith("admin-images/")) {
          throw new Error("Invalid upload pathname");
        }

        return {
          allowedContentTypes: ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: ADMIN_IMAGE_MAX_SIZE_BYTES,
          addRandomSuffix: false,
        };
      },
    });

    return json(response, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return json({ message }, message === "Unauthorized" ? 401 : 400);
  }
}
