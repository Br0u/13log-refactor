import { buildClearedSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  const url = new URL(request.url);

  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/", url).toString(),
      "set-cookie": buildClearedSessionCookie(),
    },
  });
}
