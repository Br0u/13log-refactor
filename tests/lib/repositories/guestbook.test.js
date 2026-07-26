import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import {
  approveGuestbookEntry,
  createGuestbookEntry,
  getApprovedGuestbookEntries,
  removeGuestbookEntry,
} from "../../../lib/repositories/guestbook";

describe("guestbook repository", () => {
  beforeEach(async () => {
    await db.guestbookEntry.deleteMany({
      where: {
        nickname: {
          startsWith: "test-13log-guestbook-repository-",
        },
      },
    });
  });

  it("creates pending entries and only returns them after approval", async () => {
    const nickname = "test-13log-guestbook-repository-user";
    const created = await createGuestbookEntry({
      nickname,
      content: "hello from guestbook",
    });

    expect(created.status).toBe("PENDING");
    expect((await getApprovedGuestbookEntries()).some((entry) => entry.nickname === nickname)).toBe(false);

    await approveGuestbookEntry(created.id);

    const approved = await getApprovedGuestbookEntries();
    expect(approved.some((entry) => entry.nickname === nickname)).toBe(true);
  });

  it("removes a guestbook entry", async () => {
    const created = await createGuestbookEntry({
      nickname: "test-13log-guestbook-repository-delete",
      content: "delete me",
    });

    await removeGuestbookEntry(created.id);

    const deleted = await db.guestbookEntry.findUnique({
      where: { id: created.id },
    });
    expect(deleted).toBeNull();
  });
});
