import { db } from "../db";

export async function createMediaAsset(input) {
  return db.mediaAsset.create({
    data: {
      url: input.url,
      pathname: input.pathname,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
    },
  });
}
