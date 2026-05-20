import { put } from "@vercel/blob";
import { buildAdminImagePath, inferImageContentType } from "./admin-image-files";

export async function uploadAdminImage(file) {
  const pathname = buildAdminImagePath(file?.name || "image");
  const contentType = inferImageContentType(file);
  const uploaded = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });

  return {
    url: uploaded.url,
    pathname: uploaded.pathname || pathname,
    mimeType: contentType,
    size: file?.size || 0,
    width: null,
    height: null,
  };
}
