import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../../lib/session";
import { uploadAdminImage } from "../../../../../lib/media-storage";
import { ADMIN_IMAGE_MAX_SIZE_BYTES, isSupportedAdminImageFile } from "../../../../../lib/admin-image-files";
import { createMediaAsset } from "../../../../../lib/repositories/media-assets";

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

  if (!(file instanceof File) || !isSupportedAdminImageFile(file)) {
    return json({ message: "Only image uploads are supported" }, 400);
  }

  if (file.size > ADMIN_IMAGE_MAX_SIZE_BYTES) {
    return json({ message: "Image is too large" }, 400);
  }

  const uploaded = await uploadAdminImage(file);
  await createMediaAsset(uploaded);

  return json(uploaded, 200);
}
