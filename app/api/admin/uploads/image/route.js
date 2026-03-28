import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../../lib/session";
import { uploadAdminImage } from "../../../../../lib/media-storage";
import { createMediaAsset } from "../../../../../lib/repositories/media-assets";

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const session = await readAdminSession(token);

  if (!session) {
    return json({ message: "Unauthorized" }, 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !String(file.type || "").startsWith("image/")) {
    return json({ message: "Only image uploads are supported" }, 400);
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return json({ message: "Image is too large" }, 400);
  }

  const uploaded = await uploadAdminImage(file);
  await createMediaAsset(uploaded);

  return json(uploaded, 200);
}
