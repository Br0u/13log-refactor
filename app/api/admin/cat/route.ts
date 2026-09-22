import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "../../../../lib/session";
import { assertSameOrigin, CatError, configureSettings, errorResponse, getSettings, readBody, safeSettings } from "../../../../lib/pixel-cat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function authenticate() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || "";
  if (!await readAdminSession(token)) throw new CatError("请先登录管理后台。", 401);
}
export async function GET() {
  try {
    await authenticate();
    return Response.json(safeSettings(await getSettings()), { headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    await authenticate();
    assertSameOrigin(request);
    const { operation, ...input } = await readBody(request);
    if (operation !== "save" && operation !== "test") throw new CatError("未知操作。");
    return Response.json(await configureSettings(input, operation), { headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
