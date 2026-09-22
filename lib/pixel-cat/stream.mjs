// Shared SSE framing for the provider and the browser. UTF-8 decoding belongs to
// the caller so multibyte characters split across network chunks remain intact.
export function createEventParser(onEvent) {
  let buffer = "";
  return chunk => {
    buffer += chunk;
    let separator;
    while ((separator = /\r?\n\r?\n/.exec(buffer))) {
      if (separator.index > 131072) throw new Error("Stream event too large");
      const block = buffer.slice(0, separator.index);
      buffer = buffer.slice(separator.index + separator[0].length);
      const data = block.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).replace(/^ /, "")).join("\n");
      if (data) onEvent(data);
    }
    if (buffer.length > 131072) throw new Error("Stream event too large");
  };
}

// Only the first top-level `say` string may be previewed. Never stream reasoning,
// actions, incomplete escapes or an arbitrary nested "say" field to the reader.
export function partialSpeech(content) {
  const text = content.trimStart().replace(/^<think>[\s\S]*?<\/think>\s*/i, "");
  const prefix = /^\s*(?:```(?:json)?\s*)?\{\s*"say"\s*:\s*"/i.exec(text);
  if (!prefix) return "";
  let output = "";
  for (let i = prefix[0].length; i < text.length && output.length < 800; i++) {
    const ch = text[i];
    if (ch === '"') break;
    if (ch !== "\\") { if (ch < " ") break; output += ch; continue; }
    const escaped = text[++i];
    if (!escaped) break;
    if (escaped === "u") {
      const hex = text.slice(i + 1, i + 5);
      if (!/^[a-f\d]{4}$/i.test(hex)) break;
      output += String.fromCharCode(parseInt(hex, 16)); i += 4;
    } else {
      const escapes = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
      if (!(escaped in escapes)) break;
      output += escapes[escaped];
    }
  }
  return output.trimStart().slice(0, 800).replace(/[\uD800-\uDBFF]$/, "");
}

export async function readCatReply(response, onSpeech) {
  if (!response.ok || !response.headers?.get("content-type")?.includes("text/event-stream")) {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "暂时没收到回复，请再试一次。");
    return result;
  }
  if (!response.body) throw new Error("没有收到回复。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = null;
  const feed = createEventParser(data => {
    const event = JSON.parse(data);
    if (event.type === "text" && typeof event.say === "string") onSpeech(event.say);
    else if (event.type === "done") result = event;
    else if (event.type === "error") throw new Error(event.error || "回复中断了，请再试一次。");
  });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { feed(decoder.decode()); break; }
      feed(decoder.decode(value, { stream: true }));
    }
    if (!result) throw new Error("回复中断了，请再试一次。");
    return result;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
