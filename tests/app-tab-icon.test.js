import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("app tab icon", () => {
  it("uses the avatar png as the browser tab icon", () => {
    const icon = fs.readFileSync(path.join(process.cwd(), "app/icon.png"));

    expect(icon.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(icon.readUInt32BE(16)).toBe(512);
    expect(icon.readUInt32BE(20)).toBe(512);
  });
});
