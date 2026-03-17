import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("../../../lib/db", () => ({
  db: {
    mediaAsset: {
      create: createMock,
    },
  },
}));

import { createMediaAsset } from "../../../lib/repositories/media-assets";

describe("media asset repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a media asset record from uploaded image metadata", async () => {
    createMock.mockResolvedValue({
      id: "asset-1",
      url: "https://blob.example/test.png",
      pathname: "admin-images/test.png",
      mimeType: "image/png",
      size: 1234,
      width: 800,
      height: 600,
    });

    const asset = await createMediaAsset({
      url: "https://blob.example/test.png",
      pathname: "admin-images/test.png",
      mimeType: "image/png",
      size: 1234,
      width: 800,
      height: 600,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        url: "https://blob.example/test.png",
        pathname: "admin-images/test.png",
        mimeType: "image/png",
        size: 1234,
        width: 800,
        height: 600,
      },
    });
    expect(asset.url).toBe("https://blob.example/test.png");
  });
});
