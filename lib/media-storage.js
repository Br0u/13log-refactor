import { put } from "@vercel/blob";

function sanitizeFileName(name = "image") {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

export async function uploadAdminImage(file) {
  const pathname = buildAdminImagePath(file?.name || "image");
  const uploaded = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file?.type || "application/octet-stream",
  });

  return {
    url: uploaded.url,
    pathname: uploaded.pathname || pathname,
    mimeType: file?.type || "application/octet-stream",
    size: file?.size || 0,
    width: null,
    height: null,
  };
}

export function buildAdminImagePath(fileName = "image") {
  const stamp = Date.now();
  return `admin-images/${stamp}-${sanitizeFileName(fileName)}`;
}
