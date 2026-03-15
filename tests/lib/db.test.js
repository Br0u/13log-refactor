import { describe, expect, it } from "vitest";
import { db } from "../../lib/db";

describe("db client", () => {
  it("exports a prisma client instance", () => {
    expect(db).toBeTruthy();
    expect(typeof db).toBe("object");
  });
});
