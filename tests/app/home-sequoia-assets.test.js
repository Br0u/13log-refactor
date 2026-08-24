import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readAsset(name) {
  return fs.readFileSync(path.join(process.cwd(), "public/images/home", name));
}

function expectPng(name) {
  const image = readAsset(name);

  expect(image.subarray(0, 8)).toEqual(PNG_SIGNATURE);
  const chunks = [];
  let offset = 8;

  while (offset < image.length) {
    expect(offset + 12).toBeLessThanOrEqual(image.length);
    const length = image.readUInt32BE(offset);
    const type = image.subarray(offset + 4, offset + 8).toString("ascii");
    const chunkEnd = offset + 12 + length;
    expect(chunkEnd).toBeLessThanOrEqual(image.length);
    chunks.push({ type, offset, length });
    offset = chunkEnd;
  }

  expect(chunks[0]?.type).toBe("IHDR");
  expect(chunks[0]?.length).toBe(13);
  expect(chunks.some(({ type }) => type === "IDAT")).toBe(true);
  expect(chunks.at(-1)?.type).toBe("IEND");
  expect(chunks.at(-1)?.length).toBe(0);
  expect(offset).toBe(image.length);

  const ihdr = chunks[0].offset + 8;
  expect(image.readUInt32BE(ihdr)).toBe(1536);
  expect(image.readUInt32BE(ihdr + 4)).toBe(1024);
  expect([4, 6]).toContain(image[ihdr + 9]);
}

function expectWebp(name) {
  const image = readAsset(name);

  expect(image.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(image.subarray(8, 12).toString("ascii")).toBe("WEBP");
  expect(image.readUInt32LE(4) + 8).toBe(image.length);

  const chunks = [];
  let offset = 12;

  while (offset < image.length) {
    expect(offset + 8).toBeLessThanOrEqual(image.length);
    const type = image.subarray(offset, offset + 4).toString("ascii");
    const length = image.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + length;
    const chunkEnd = dataEnd + (length % 2);
    expect(dataEnd).toBeLessThanOrEqual(image.length);
    expect(chunkEnd).toBeLessThanOrEqual(image.length);
    chunks.push({ type, dataOffset, length });
    offset = chunkEnd;
  }

  expect(offset).toBe(image.length);
  expect(chunks[0]?.type).toBe("VP8X");
  expect(chunks[0]?.length).toBeGreaterThanOrEqual(10);
  const vp8x = chunks[0].dataOffset;
  expect(image[vp8x] & 0x10).toBe(0x10);
  expect(image.readUIntLE(vp8x + 4, 3) + 1).toBe(1536);
  expect(image.readUIntLE(vp8x + 7, 3) + 1).toBe(1024);
  expect(chunks.some(({ type }) => type === "ALPH")).toBe(true);
  expect(chunks.some(({ type }) => type === "VP8 " || type === "VP8L")).toBe(true);
  expect(image.byteLength).toBeLessThanOrEqual(300 * 1024);
}

async function expectDecodedForeground(name) {
  const image = sharp(readAsset(name));
  const metadata = await image.metadata();

  expect(metadata.width).toBe(1536);
  expect(metadata.height).toBe(1024);
  expect(metadata.hasAlpha).toBe(true);

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  expect(info.channels).toBe(4);
  let transparentPixels = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparentPixels += 1;
  }
  expect(transparentPixels / (info.width * info.height)).toBeGreaterThan(0.1);
}

describe("home sequoia assets", () => {
  it("keeps a complete transparent foreground PNG at the intended dimensions", () => {
    expectPng("home-sequoia-foreground.png");
  });

  it("keeps the transparent WebP foreground valid and within its budget", () => {
    expectWebp("home-sequoia-foreground.webp");
  });

  it.each(["home-sequoia-foreground.png", "home-sequoia-foreground.webp"])(
    "decodes %s with meaningful transparent coverage",
    async (name) => {
      await expectDecodedForeground(name);
    },
  );
});
