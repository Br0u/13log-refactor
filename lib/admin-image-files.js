const IMAGE_EXTENSIONS = new Set([
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "tif",
  "tiff",
  "webp",
]);

const IMAGE_CONTENT_TYPES_BY_EXTENSION = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
};

export const ADMIN_IMAGE_MAX_SIZE_BYTES = 50 * 1024 * 1024;
export const ADMIN_IMAGE_ALLOWED_CONTENT_TYPES = [
  "image/*",
];

function extensionFromName(fileName = "") {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

export function sanitizeImageFileName(name = "image") {
  return String(name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

export function inferImageContentType(file) {
  const type = String(file?.type || "").trim().toLowerCase();
  if (type.startsWith("image/")) {
    return type;
  }

  const extension = extensionFromName(file?.name);
  return IMAGE_CONTENT_TYPES_BY_EXTENSION[extension] || "application/octet-stream";
}

export function isSupportedAdminImageFile(file) {
  if (!file) return false;

  const type = String(file.type || "").trim().toLowerCase();
  if (type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(extensionFromName(file.name));
}

export function buildAdminImagePath(fileName = "image") {
  const stamp = Date.now();
  const randomId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `admin-images/${stamp}-${randomId}-${sanitizeImageFileName(fileName)}`;
}
