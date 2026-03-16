import { createGuestbookEntry, getApprovedGuestbookEntries } from "../../../lib/repositories/guestbook";

export async function GET() {
  const entries = await getApprovedGuestbookEntries();
  return new Response(JSON.stringify({ entries }), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const entry = await createGuestbookEntry({
      nickname: body.nickname,
      content: body.content,
    });

    return new Response(JSON.stringify({ entry }), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid guestbook entry" }), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
