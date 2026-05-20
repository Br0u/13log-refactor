import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../lib/session";
import { createPhoto } from "../../../../lib/repositories/photos";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseSortOrder(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function fallbackTitle(fileName = "Photo") {
  return String(fileName || "Photo").replace(/\.[^.]+$/, "").trim() || "Photo";
}

function failedUpload(fileName, message, clientId = "") {
  return {
    ...(clientId ? { clientId } : {}),
    fileName,
    message,
  };
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const session = await readAdminSession(token);

  if (!session) {
    return json({ message: "Unauthorized" }, 401);
  }

  const body = await request.json();
  const categoryId = String(body?.categoryId || "").trim();
  const title = String(body?.title || "").trim();
  const caption = String(body?.caption || "").trim();
  const sortOrder = parseSortOrder(body?.sortOrder);
  const uploads = Array.isArray(body?.uploads) ? body.uploads : [];

  if (!categoryId || !uploads.length) {
    return json({ message: "Album and uploaded images are required." }, 400);
  }

  const failed = [];
  let created = 0;

  for (let index = 0; index < uploads.length; index += 1) {
    const upload = uploads[index];
    const imageUrl = String(upload?.url || "").trim();
    const pathname = String(upload?.pathname || "").trim();
    const fileName = String(upload?.fileName || "").trim();
    const clientId = String(upload?.clientId || "").trim();

    if (!imageUrl || !pathname) {
      failed.push(failedUpload(fileName || `upload-${index + 1}`, "Uploaded image metadata is incomplete.", clientId));
      continue;
    }

    try {
      await createPhoto({
        title: title || fallbackTitle(fileName),
        caption,
        imageUrl,
        pathname,
        sortOrder: sortOrder == null ? null : sortOrder + created,
        categoryId,
      });
      created += 1;
    } catch (error) {
      failed.push(failedUpload(
        fileName || `upload-${index + 1}`,
        error instanceof Error ? error.message : "Unable to save photo right now.",
        clientId,
      ));
    }
  }

  if (!created && failed.length) {
    return json({ message: failed[0].message, failed }, 400);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/photos");
  revalidatePath(`/admin/photos/${categoryId}`);
  revalidatePath("/photos");

  return json(failed.length ? { created, failed } : { created }, 200);
}
