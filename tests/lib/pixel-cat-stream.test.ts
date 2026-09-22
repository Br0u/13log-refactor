import { expect, it } from "vitest";
import { createEventParser, partialSpeech, readCatReply } from "../../lib/pixel-cat/stream.mjs";

it("extracts only the leading speech string, handles split escapes and withholds reasoning", () => {
  const text = JSON.stringify({ say: '喵，"你好"\n🐈', actions: [{ type: "wave" }] });
  for (let i = 0; i <= text.length; i++) expect('喵，"你好"\n🐈'.startsWith(partialSpeech(text.slice(0, i)))).toBe(true);
  expect(partialSpeech('{"say":"\\u55b5\\uD83D')).toBe("喵");
  expect(partialSpeech('{"say":"\\u55b5\\uD83D\\uDC08')).toBe("喵🐈");
  for (const text of ['<think>secret', '{"actions":[{"say":"secret"}', '{"reasoning":"secret"', '```json\n{']) expect(partialSpeech(text)).toBe("");
  expect(partialSpeech('```json\n{"say":"喵')).toBe("喵");
});

it("frames SSE across CRLF boundaries and multiple data lines", () => {
  const events: string[] = [];
  const feed = createEventParser(value => events.push(value));
  for (const character of ': keepalive\r\n\r\ndata: one\r\ndata: two\r\n\r\ndata: [DONE]\n\n') feed(character);
  expect(events).toEqual(["one\ntwo", "[DONE]"]);
});

it("shows speech before completion and rejects streams without a final validated plan", async () => {
  let controller: ReadableStreamDefaultController;
  const body = new ReadableStream({ start(value) { controller = value; } });
  const encoder = new TextEncoder(), seen: string[] = [];
  const result = readCatReply(new Response(body, { headers: { "content-type": "text/event-stream" } }), value => seen.push(value));
  const bytes = encoder.encode('data: {"type":"text","say":"喵"}\n\n');
  for (const byte of bytes) controller!.enqueue(new Uint8Array([byte]));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(seen).toEqual(["喵"]);
  controller!.enqueue(encoder.encode('data: {"type":"done","say":"喵","actions":[]}\n\n')); controller!.close();
  expect(await result).toMatchObject({ say: "喵", actions: [] });
  await expect(readCatReply(new Response('data: {"type":"text","say":"喵"}\n\n', { headers: { "content-type": "text/event-stream" } }), () => {})).rejects.toThrow("中断");
  await expect(readCatReply(new Response('data: {"type":"error","error":"额度已满"}\n\n', { headers: { "content-type": "text/event-stream" } }), () => {})).rejects.toThrow("额度已满");
});
