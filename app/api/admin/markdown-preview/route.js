import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../lib/session";
import {
  preprocessShortcodes,
  renderMarkdownToHtml,
  renderMicroMarkdownToHtml,
} from "../../../../lib/markdown";

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const session = await readAdminSession(token);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await request.json();
  const value = String(body?.value || "");
  const mode = body?.mode === "micro" ? "micro" : "post";

  const html = mode === "micro"
    ? await renderMicroMarkdownToHtml(value)
    : await renderMarkdownToHtml(preprocessShortcodes(value));

  return new Response(JSON.stringify({ html }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
