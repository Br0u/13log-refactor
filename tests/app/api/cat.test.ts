import { beforeEach, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ value: null as any }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-session" }) }) }));
vi.mock("../../../lib/session", () => ({ ADMIN_SESSION_COOKIE: "admin_session", readAdminSession: async () => session.value }));
vi.mock("../../../lib/db", () => ({ db: {} }));
const services = vi.hoisted(() => ({ getSettings: vi.fn(), configureSettings: vi.fn(), askCat: vi.fn() }));
vi.mock("../../../lib/pixel-cat/server", async importOriginal => ({ ...await importOriginal<typeof import("../../../lib/pixel-cat/server")>(), ...services }));
import { GET as adminGet, POST as adminPost } from "../../../app/api/admin/cat/route";
import { GET, POST } from "../../../app/api/cat/route";
import { assertSameOrigin, CatError } from "../../../lib/pixel-cat/server";

beforeEach(() => { vi.clearAllMocks(); session.value = null; });
const request = (body: unknown, origin = "http://localhost") => new Request("http://localhost/api/cat", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });

it("rejects unauthenticated admin reads and writes before accessing stored settings", async () => {
  expect((await adminGet()).status).toBe(401);
  expect((await adminPost(request({ operation: "save" }))).status).toBe(401);
  expect(services.configureSettings).not.toHaveBeenCalled();
  expect(services.getSettings).not.toHaveBeenCalled();
});
it("rejects cross-origin admin writes and public model requests", async () => {
  session.value = { username: "test" };
  expect((await adminPost(request({ operation: "save" }, "https://unrelated.example"))).status).toBe(403);
  expect((await POST(request({}, "https://unrelated.example"))).status).toBe(403);
  expect(services.askCat).not.toHaveBeenCalled();
});
it("uses the browser-facing Host when Next reconstructs a localhost URL", () => {
  expect(() => assertSameOrigin(new Request("http://localhost:3000/api/admin/cat", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } }))).not.toThrow();
  expect(() => assertSameOrigin(new Request("http://localhost:3000/api/admin/cat", { headers: { host: "127.0.0.1:3000", origin: "https://unrelated.example" } }))).toThrow();
});
it("never returns stored credentials in public status or authenticated settings", async () => {
  services.getSettings.mockResolvedValue({ enabled: true, encryptedKey: "ciphertext-never-send", proactiveSeconds: 120 });
  expect(await (await GET()).json()).toEqual({ available: true, proactiveSeconds: 120 });
  session.value = { username: "test" };
  const body = await (await adminGet()).json();
  expect(body.hasKey).toBe(true);
  expect(JSON.stringify(body)).not.toContain("ciphertext-never-send");
});
it("advertises enabled keyless endpoints while keeping disabled AI unavailable", async () => {
  services.getSettings.mockResolvedValue({ enabled: true, encryptedKey: null, proactiveSeconds: 120 });
  expect(await (await GET()).json()).toEqual({ available: true, proactiveSeconds: 120 });
  services.getSettings.mockResolvedValue({ enabled: false, encryptedKey: null, proactiveSeconds: 0 });
  expect(await (await GET()).json()).toEqual({ available: false, proactiveSeconds: 0 });
});
it("rejects excessive bodies and private-page context before spending AI quota", async () => {
  expect((await POST(request({ message: "x".repeat(50000) }))).status).toBe(413);
  expect((await POST(request({ message: "hello", context: { path: "/admin/posts", title: "", excerpt: "", anchors: [] } }))).status).toBe(400);
  expect(services.askCat).not.toHaveBeenCalled();
});
const streamingRequest = () => new Request("http://localhost/api/cat", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json", accept: "text/event-stream" }, body: JSON.stringify({ message: "hi", context: { path: "/", title: "", excerpt: "", anchors: [] } }) });
it("delivers speech before completion and aborts the provider when the response is canceled", async () => {
  let signal: AbortSignal;
  services.askCat.mockImplementation((_input, _identity, options) => {
    signal = options.signal; options.onSpeech("喵");
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  });
  const response = await POST(streamingRequest());
  expect(response.headers.get("content-type")).toContain("text/event-stream");
  const reader = response.body!.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toContain('"type":"text"');
  await reader.cancel();
  expect(signal!.aborted).toBe(true);
});
it("finishes SSE with validated actions and surfaces quota errors as stream errors", async () => {
  services.askCat.mockImplementation(async (_input, _identity, options) => { options.onSpeech("喵"); return { say: "喵", actions: [{ type: "wave" }] }; });
  const body = await (await POST(streamingRequest())).text();
  expect(body).toContain('"type":"done","say":"喵","actions":[{"type":"wave"}]');
  services.askCat.mockRejectedValue(new CatError("额度已满", 429));
  expect(await (await POST(streamingRequest())).text()).toContain('"type":"error","error":"额度已满","status":429');
});
