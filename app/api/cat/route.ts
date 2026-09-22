import { chatSchema } from "../../../lib/pixel-cat/contracts";
import { askCat, assertSameOrigin, CatError, errorResponse, getSettings, readBody } from "../../../lib/pixel-cat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({ available: Boolean(settings?.enabled), proactiveSeconds: settings?.proactiveSeconds || 0 }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ available: false, proactiveSeconds: 0 }, { headers: { "cache-control": "no-store" } }); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = chatSchema.safeParse(await readBody(request));
    if (!parsed.success || (!parsed.data.proactive && !parsed.data.message)) throw new CatError("消息或页面信息不完整。");
    const identity = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!request.headers.get("accept")?.includes("text/event-stream")) {
      return Response.json(await askCat(parsed.data, identity, { signal: request.signal }), { headers: { "cache-control": "no-store" } });
    }
    const abort = new AbortController();
    const cancel = () => abort.abort();
    request.signal.addEventListener("abort", cancel, { once: true });
    if (request.signal.aborted) cancel();
    const encoder = new TextEncoder();
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: unknown) => { if (!closed && !abort.signal.aborted) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); };
        let timing;
        try {
          const plan = await askCat(parsed.data, identity, { signal: abort.signal, onSpeech: say => send({ type: "text", say }), onTiming: value => { timing = value; } });
          send({ type: "done", ...plan, timing });
        } catch (error) {
          send({ type: "error", error: error instanceof CatError ? error.message : "暂时没收到回复，请再试一次。", status: error instanceof CatError ? error.status : 503 });
        } finally {
          request.signal.removeEventListener("abort", cancel);
          if (!closed) { closed = true; controller.close(); }
        }
      },
      cancel() { closed = true; cancel(); request.signal.removeEventListener("abort", cancel); },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", "x-accel-buffering": "no" } });
  } catch (error) { return errorResponse(error); }
}
