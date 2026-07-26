import { createAdminSession, buildSessionCookie, verifyAdminLogin } from "../../../../lib/auth";

export async function POST(request) {
  const body = await request.json();
  let sessionUser;

  try {
    sessionUser = await verifyAdminLogin(body.username || "", body.password || "");
  } catch {
    return new Response(JSON.stringify({ message: "Invalid credentials" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  try {
    const token = await createAdminSession(sessionUser);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": buildSessionCookie(token),
      },
    });
  } catch {
    console.error("Failed to create admin session");
    return new Response(JSON.stringify({ message: "Unable to create session" }), {
      status: 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
