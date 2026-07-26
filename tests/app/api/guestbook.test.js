import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../lib/db";
import { GET as guestbookGetRoute, POST as guestbookPostRoute } from "../../../app/api/guestbook/route";

describe("guestbook api", () => {
  beforeEach(async () => {
    await db.guestbookEntry.deleteMany({
      where: {
        nickname: {
          startsWith: "test-13log-guestbook-api-",
        },
      },
    });
  });

  it("submits pending entries and lists only approved ones", async () => {
    const nickname = "test-13log-guestbook-api-user";
    const postRequest = new Request("http://localhost:3000/api/guestbook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nickname,
        content: "hello guestbook",
      }),
    });

    const postResponse = await guestbookPostRoute(postRequest);
    expect(postResponse.status).toBe(201);

    let getResponse = await guestbookGetRoute(new Request("http://localhost:3000/api/guestbook"));
    let body = await getResponse.json();
    expect(body.entries.some((entry) => entry.nickname === nickname)).toBe(false);

    const pending = await db.guestbookEntry.findFirst({
      where: { nickname },
    });
    await db.guestbookEntry.update({
      where: { id: pending.id },
      data: { status: "APPROVED" },
    });

    getResponse = await guestbookGetRoute(new Request("http://localhost:3000/api/guestbook"));
    body = await getResponse.json();
    expect(body.entries.some((entry) => entry.nickname === nickname)).toBe(true);
  });
});
