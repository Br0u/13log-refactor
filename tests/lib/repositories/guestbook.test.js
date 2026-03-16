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
          startsWith: "guestbook-test-",
        },
      },
    });
  });

  it("creates pending entries and only returns them after approval", async () => {
    const created = await createGuestbookEntry({
      nickname: "guestbook-test-user",
      content: "hello from guestbook",
    });

    expect(created.status).toBe("PENDING");
    expect(await getApprovedGuestbookEntries()).toHaveLength(0);

    await approveGuestbookEntry(created.id);

    const approved = await getApprovedGuestbookEntries();
    expect(approved).toHaveLength(1);
    expect(approved[0].nickname).toBe("guestbook-test-user");
  });

  it("removes a guestbook entry", async () => {
    const created = await createGuestbookEntry({
      nickname: "guestbook-test-delete",
      content: "delete me",
    });

    await removeGuestbookEntry(created.id);

    const deleted = await db.guestbookEntry.findUnique({
      where: { id: created.id },
    });
    expect(deleted).toBeNull();
  });
});
