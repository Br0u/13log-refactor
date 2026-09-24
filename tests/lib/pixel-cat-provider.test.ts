import { EventEmitter } from "node:events";
import { beforeEach, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, chatSchema } from "../../lib/pixel-cat/contracts";
import { createLife, lifeSnapshot } from "../../lib/pixel-cat/life.mjs";

const upstream = vi.hoisted(() => ({ status: 200, body: "", calls: [] as any[], address: "1.1.1.1", stream: false, chunks: null as Buffer[] | null, hold: false, requests: [] as any[] }));
const database = vi.hoisted(() => ({ catSettings: { findUnique: vi.fn(), upsert: vi.fn() }, $transaction: vi.fn() }));
vi.mock("../../lib/db", () => ({ db: database }));
vi.mock("node:dns/promises", () => ({ lookup: async () => ({ address: upstream.address, family: 4 }) }));
vi.mock("node:https", () => ({ request: (url, options, onResponse) => mockRequest("https:", url, options, onResponse) }));
vi.mock("node:http", () => ({ request: (url, options, onResponse) => mockRequest("http:", url, options, onResponse) }));
function mockRequest(protocol, url, options, onResponse) {
  expect(url.protocol).toBe(protocol);
  const req = new EventEmitter() as any;
  upstream.requests.push(req);
  req.destroy = error => { req.destroyed = true; req.emit("error", error); req.emit("close"); };
  req.end = body => {
    upstream.calls.push({ url: String(url), options, body: JSON.parse(body) });
    queueMicrotask(() => {
      const response = new EventEmitter() as any;
      response.statusCode = upstream.status; response.resume = () => {};
      response.headers = { "content-type": upstream.stream ? "text/event-stream" : "application/json" };
      onResponse(response);
      for (const chunk of upstream.chunks || [Buffer.from(upstream.body)]) { if (!req.destroyed) response.emit("data", chunk); }
      if (!upstream.hold && !req.destroyed) { response.emit("end"); req.emit("close"); }
    });
  };
  return req;
}
import { askCat, configureSettings, encryptKey } from "../../lib/pixel-cat/server";

function providerStream(content: string) {
  return [...content].map(character => `data: ${JSON.stringify({ choices: [{ delta: { content: character } }] })}\r\n\r\n`).join("") + 'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
}

const context = { path: "/", title: "Home", excerpt: "Public text", selection: "", anchors: [{ id: "cat-target-0", text: "Heading" }] };
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("SESSION_SECRET", "pixel-cat-provider-test-32-characters-long"); vi.stubEnv("CAT_SETTINGS_SECRET", "");
  upstream.status = 200; upstream.address = "1.1.1.1"; upstream.calls = [];
  upstream.stream = false; upstream.chunks = null; upstream.hold = false; upstream.requests = [];
  upstream.body = JSON.stringify({ choices: [{ message: { content: JSON.stringify({ say: "喵，看这里。", actions: [{ type: "walk_to", target: "cat-target-0" }, { type: "point" }] }) } }] });
  database.catSettings.findUnique.mockResolvedValue({ ...DEFAULT_SETTINGS, enabled: true, model: "test-model", encryptedKey: encryptKey("dummy-test-key") });
  database.$transaction.mockImplementation(callback => callback({ $queryRaw: async () => [{ id: "day" }, { id: "visitor" }, { id: "minute" }] }));
});

it("sends bounded context and executes only a validated provider plan using pinned DNS", async () => {
  const life = lifeSnapshot(createLife());
  const plan = await askCat(chatSchema.parse({ message: "读这段", proactive: false, context, life, history: [] }), "test-visitor");
  expect(plan.actions[0]).toEqual({ type: "walk_to", target: "cat-target-0" });
  expect(upstream.calls[0].body.response_format).toEqual({ type: "json_object" });
  expect(upstream.calls[0].body).not.toHaveProperty("chat_template_kwargs");
  expect(JSON.parse(upstream.calls[0].body.messages.at(-1).content).life).toEqual(life);
  expect(upstream.calls[0].body.messages[0].content).toContain("不虚构生活经历");
  const callback = vi.fn(); upstream.calls[0].options.lookup("provider.example", { all: true }, callback);
  expect(callback).toHaveBeenCalledWith(null, [{ address: "1.1.1.1", family: 4 }]);
});
it("disables Qwen3.8-27B thinking for both streamed chat and admin connection tests", async () => {
  const settings = { ...DEFAULT_SETTINGS, enabled: true, model: "Qwen3.8-27B", encryptedKey: null };
  database.catSettings.findUnique.mockResolvedValue(settings);
  upstream.stream = true;
  upstream.body = providerStream('{"say":"你好","actions":[]}');
  const speech = vi.fn();
  await expect(askCat({ message: "你好", proactive: false, context, history: [] }, "test", { onSpeech: speech })).resolves.toEqual({ say: "你好", actions: [] });
  expect(speech).toHaveBeenCalledWith("你好");
  upstream.stream = false;
  upstream.body = JSON.stringify({ choices: [{ message: { content: '{"say":"连接成功","actions":[]}' } }] });
  await configureSettings({ ...settings, model: "Qwen/Qwen3.8-27B" }, "test");
  expect(upstream.calls).toHaveLength(2);
  for (const call of upstream.calls) expect(call.body.chat_template_kwargs).toEqual({ enable_thinking: false });
});
it("streams speech before returning validated actions and reports timing without leaking provider data", async () => {
  upstream.stream = true;
  const body = Buffer.from(providerStream('{"say":"喵🐈","actions":[{"type":"wave"},{"type":"eval"}]}'));
  upstream.chunks = Array.from(body, byte => Buffer.from([byte]));
  const speech: string[] = [], timing = vi.fn();
  let finished = false;
  const plan = await askCat({ message: "hi", proactive: false, context, history: [] }, "test", { onSpeech: value => { expect(finished).toBe(false); speech.push(value); }, onTiming: timing });
  finished = true;
  expect(speech).toEqual(["喵", "喵🐈"]);
  expect(plan).toEqual({ say: "喵🐈", actions: [{ type: "wave" }] });
  expect(upstream.calls[0].body.stream).toBe(true);
  expect(timing.mock.calls[0][0]).toMatchObject({ firstTextMs: expect.any(Number), totalMs: expect.any(Number) });
});
it("cancels the provider request when the visitor interrupts and rejects prematurely ended SSE", async () => {
  upstream.stream = true; upstream.hold = true;
  upstream.body = 'data: {"choices":[{"delta":{"content":"{\\\"say\\\":\\\"喵"}}]}\n\n';
  const abort = new AbortController();
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test", { signal: abort.signal, onSpeech: () => abort.abort() })).rejects.toMatchObject({ status: 499 });
  expect(upstream.requests[0].destroyed).toBe(true);
  upstream.hold = false;
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test", { onSpeech: () => {} })).rejects.toThrow("完整回复");
});
it("discards unexpected actions without losing speech and never follows provider redirects", async () => {
  upstream.body = JSON.stringify({ choices: [{ message: { content: '{"say":"hi","actions":[{"type":"eval"}]}' } }] });
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test")).resolves.toEqual({ say: "hi", actions: [] });
  upstream.status = 302; upstream.calls = [];
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test")).rejects.toMatchObject({ status: 502 });
  expect(upstream.calls).toHaveLength(1);
});
it("reports truncated output accurately and does not expose partial JSON", async () => {
  upstream.body = JSON.stringify({ choices: [{ finish_reason: "length", message: { content: '{"say":"unfinished' } }] });
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test")).rejects.toThrow("被截断");
  expect(upstream.calls[0].body.max_tokens).toBe(1024);
});
it("rejects a public-looking hostname resolving to a private address before sending the key", async () => {
  upstream.address = "169.254.169.254";
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test")).rejects.toThrow("非公网");
  expect(upstream.calls).toHaveLength(0);
});
it("tests the JSON protocol without saving or replacing existing configuration", async () => {
  upstream.body = JSON.stringify({ choices: [{ message: { content: '{"say":"连接成功","actions":[]}' } }] });
  expect(await configureSettings({ ...DEFAULT_SETTINGS, model: "test-model" }, "test")).toEqual({ message: "连接成功。当前配置尚未保存。" });
  expect(database.catSettings.upsert).not.toHaveBeenCalled();
});
it("saves, tests and chats without an Authorization header when no key is configured", async () => {
  const settings = { ...DEFAULT_SETTINGS, enabled: true, baseUrl: "http://provider.example:8000/v1", model: "test-model" };
  upstream.body = JSON.stringify({ choices: [{ message: { content: '{"say":"喵","actions":[]}' } }] });
  database.catSettings.findUnique.mockResolvedValue(null);
  database.catSettings.upsert.mockImplementation(async ({ create }) => create);
  const saved = await configureSettings(settings, "save");
  expect(saved.settings).toMatchObject({ enabled: true, hasKey: false });
  expect(database.catSettings.upsert.mock.calls[0][0].create.encryptedKey).toBeNull();
  database.catSettings.findUnique.mockResolvedValue({ ...settings, encryptedKey: null });
  await configureSettings(settings, "test");
  await expect(askCat({ message: "hi", proactive: false, context, history: [] }, "test")).resolves.toMatchObject({ say: "喵" });
  expect(upstream.calls).toHaveLength(2);
  for (const call of upstream.calls) expect(call.options.headers).not.toHaveProperty("authorization");
  upstream.status = 401;
  await expect(configureSettings(settings, "test")).rejects.toThrow("401");
});
it("uses HTTP for a public custom endpoint and still refuses redirects and private DNS", async () => {
  database.catSettings.findUnique.mockResolvedValue(null);
  upstream.address = "125.122.36.24";
  upstream.body = JSON.stringify({ choices: [{ message: { content: '{"say":"连接成功","actions":[]}' } }] });
  const settings = { ...DEFAULT_SETTINGS, baseUrl: "http://provider.example:9000/v1", model: "test-model", apiKey: "dummy-test-key" };
  await expect(configureSettings(settings, "test")).resolves.toHaveProperty("message");
  expect(upstream.calls[0].url).toBe("http://provider.example:9000/v1/chat/completions");
  expect(upstream.calls[0].options.headers.authorization).toBe("Bearer dummy-test-key");
  upstream.status = 302; upstream.calls = [];
  await expect(configureSettings(settings, "test")).rejects.toMatchObject({ status: 502 });
  expect(upstream.calls).toHaveLength(1);
  upstream.address = "127.0.0.1"; upstream.calls = [];
  await expect(configureSettings(settings, "test")).rejects.toThrow("非公网");
  expect(upstream.calls).toHaveLength(0);
  expect(database.catSettings.upsert).not.toHaveBeenCalled();
});
