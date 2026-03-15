import { createAdminSession, buildSessionCookie, verifyAdminLogin } from "../../../../lib/auth";

export async function POST(request) {
  const body = await request.json();

  try {
    const sessionUser = await verifyAdminLogin(body.username || "", body.password || "");
    const token = await createAdminSession(sessionUser);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": buildSessionCookie(token),
      },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
