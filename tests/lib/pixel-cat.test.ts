import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { ACTIONS, ACTION_META, BEHAVIORS, AMBIENT_BEHAVIORS, SCENE_IDS, localCommand, clampPosition } from "../../lib/pixel-cat/catalog.mjs";
import { drawCat } from "../../scripts/generate-pixel-cat.mjs";
import { chatSchema, validatePlan, parseModelPlan, DEFAULT_SETTINGS } from "../../lib/pixel-cat/contracts";

const database = vi.hoisted(() => ({ catSettings: { findUnique: vi.fn(), upsert: vi.fn() }, $transaction: vi.fn() }));
vi.mock("../../lib/db", () => ({ db: database }));
import { configureSettings, decryptKey, encryptKey, normalizeBaseUrl, publicIPv4, reserveUsage, safeSettings } from "../../lib/pixel-cat/server";

const context = { path: "/posts/example", title: "Example", excerpt: "Public article", selection: "", anchors: [{ id: "cat-target-0", text: "Intro" }] };

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("SESSION_SECRET", "pixel-cat-test-secret-32-characters-long"); vi.stubEnv("CAT_SETTINGS_SECRET", ""); });

describe("pixel cat artwork and command boundary", () => {
  it("gives actions distinct timing and resolves exact local commands without matching negations", () => {
    expect(ACTION_META.run.cycle).toBeLessThan(ACTION_META.walk.cycle);
    expect(ACTION_META.blink.loop).toBe(false);
    expect(ACTION_META.sleep.loop).toBe(true);
    expect(BEHAVIORS).toHaveLength(25);
    for (const behavior of BEHAVIORS) for (const action of behavior.actions) expect(ACTION_META[action], behavior.id).toBeDefined();
    expect(AMBIENT_BEHAVIORS.some(item => item.actions.includes("enter"))).toBe(false);
    expect(localCommand("请跳一下！")).toMatchObject({ kind: "play", actions: ["jump", "happy"] });
    expect(localCommand("睡觉")).toMatchObject({ kind: "play", rest: "sleep" });
    expect(localCommand("回家")).toEqual({ kind: "home" });
    for (const message of ["不要跳", "小猫为什么会跳", "讲一个跳舞的故事", "不要玩手机", "小猫能吃面条吗", "讲一个钓鱼的故事"]) expect(localCommand(message)).toBeNull();
    expect(SCENE_IDS).toHaveLength(24);
    for (const id of SCENE_IDS) {
      expect(localCommand(`小猫${ACTION_META[id].label}！`)).toEqual({ kind: "play", actions: [id], rest: "idle" });
      expect(validatePlan({ say: "喵", actions: [{ type: id }] }, context).actions[0].type).toBe(id);
      expect(ACTION_META[id].duration).toBe(ACTION_META[id].cycle * 2);
    }
  });
  it("keeps usable speech from wrapped JSON, long replies and imperfect action lists", () => {
    const say = "这是可读的回复。".repeat(40);
    const content = `\`\`\`json\n${JSON.stringify({ say, actions: ["wave", { type: "eval" }, { type: "walk_to", target: "cat-target-99" }, { type: "read" }], mood: "happy" })}\n\`\`\``;
    expect(parseModelPlan(content, context)).toEqual({ say, actions: [{ type: "wave" }, { type: "read" }] });
    expect(parseModelPlan('下面是回复：{"say":"喵","actions":null}', context)).toEqual({ say: "喵", actions: [] });
    expect(parseModelPlan("我陪你看这篇文章。", context)).toEqual({ say: "我陪你看这篇文章。", actions: [] });
    expect(parseModelPlan('<think>internal reasoning</think>{"say":"喵"}', context).say).toBe("喵");
    expect(parseModelPlan(JSON.stringify({ say: "字".repeat(900) }), context).say).toHaveLength(800);
  });
  it("does not display malformed JSON, empty content or incomplete reasoning as speech", () => {
    for (const content of [null, "", '{"say":"未完成', '<think>unfinished', '{"actions":[]}', '[{"say":"喵"}]']) expect(() => parseModelPlan(content, context)).toThrow();
  });
  it("ships 88 distinct animated strips matching the generated sprite sheet pixel for pixel", async () => {
    expect(ACTIONS).toHaveLength(88);
    const { data, info } = await sharp("public/pixel-cat/cat.png").raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, info.channels]).toEqual([384, 48 * ACTIONS.length, 4]);
    const signatures = ACTIONS.map(({ id, cycle }, row) => {
      expect(cycle, id).toBeGreaterThan(0);
      const frames = Array.from({ length: 8 }, (_, frame) => drawCat(id, frame));
      expect(new Set(frames.map(frame => createHash("sha256").update(frame).digest("hex"))).size, id).toBeGreaterThan(1);
      const alpha = new Set();
      for (const frame of frames) for (let index = 3; index < frame.length; index += 4) alpha.add(frame[index]);
      expect([...alpha].every(value => value === 0 || value === 255)).toBe(true);
      for (let f = 0; f < 8; f++) for (let y = 0; y < 48; y++) {
        const start = ((row * 48 + y) * info.width + f * 48) * 4;
        expect(data.subarray(start, start + 48 * 4).equals(frames[f].subarray(y * 48 * 4, (y + 1) * 48 * 4)), `${id} frame ${f}, y ${y}`).toBe(true);
      }
      return createHash("sha256").update(Buffer.concat(frames)).digest("hex");
    });
    expect(new Set(signatures).size).toBe(ACTIONS.length);
  });
  it("clamps the cat into small viewports", () => {
    expect(clampPosition({ x: 900, y: -1 }, 390, 600)).toEqual({ x: 294, y: 0 });
    expect(clampPosition({ x: 20, y: 20 }, 50, 50)).toEqual({ x: 0, y: 0 });
  });
  it("rejects private page context, arbitrary code, portal states and imaginary targets", () => {
    expect(chatSchema.safeParse({ message: "hi", context: { ...context, path: "/admin/posts" } }).success).toBe(false);
    for (const actions of [[{ type: "eval" }], [{ type: "enter" }], [{ type: "walk_to" }], [{ type: "point", target: "cat-target-99" }]]) {
      expect(() => validatePlan({ say: "hi", actions }, context)).toThrow();
    }
    expect(validatePlan({ say: "看这里", actions: [{ type: "walk_to", target: "cat-target-0" }, { type: "read" }] }, context).actions).toHaveLength(2);
  });
});

describe("stored AI settings", () => {
  it("encrypts with randomized authenticated encryption; never returns the secret to admin", () => {
    const ciphertext = encryptKey("test-provider-secret");
    expect(ciphertext).not.toContain("test-provider-secret");
    expect(encryptKey("test-provider-secret")).not.toBe(ciphertext);
    expect(decryptKey(ciphertext)).toBe("test-provider-secret");
    expect(() => decryptKey(ciphertext.slice(0, -4) + "AAAA")).toThrow();
    expect(safeSettings({ ...DEFAULT_SETTINGS, encryptedKey: ciphertext } as any)).not.toHaveProperty("encryptedKey");
    expect(safeSettings({ ...DEFAULT_SETTINGS, encryptedKey: ciphertext } as any).hasKey).toBe(true);
  });
  it("allows public HTTP and HTTPS while blocking local addresses, other protocols and credentials", () => {
    for (const url of ["ftp://example.com", "https://localhost/v1", "https://127.0.0.1", "http://localhost:8000/v1", "http://192.168.1.1:8000", "https://user:pass@example.com", "https://example.com:8443", "https://[::1]/v1"]) expect(() => normalizeBaseUrl(url)).toThrow();
    for (const ip of ["10.0.0.1", "100.64.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "198.18.0.1", "224.0.0.1", "::1"]) expect(publicIPv4(ip), ip).toBe(false);
    expect(publicIPv4("1.1.1.1")).toBe(true);
    expect(normalizeBaseUrl("https://example.com/v1/")).toBe("https://example.com/v1");
    expect(normalizeBaseUrl("http://125.122.36.24:8000/v1/")).toBe("http://125.122.36.24:8000/v1");
    for (const url of ["http://example.com/v1", "http://provider.example:9000/v1", "http://125.122.36.25:8001/v1"]) expect(normalizeBaseUrl(url)).toBe(url);
    for (const url of ["http://user:pass@example.com:8000/v1", "http://example.com:8000/v1?key=secret", "http://example.com:8000/v1#fragment"]) expect(() => normalizeBaseUrl(url)).toThrow();
  });
  it("retains saved key when blank; requires a new key when changing endpoint", async () => {
    const encryptedKey = encryptKey("saved-secret");
    database.catSettings.findUnique.mockResolvedValue({ ...DEFAULT_SETTINGS, encryptedKey });
    database.catSettings.upsert.mockImplementation(async arg => arg.update);
    const result = await configureSettings({ ...DEFAULT_SETTINGS, model: "test-model", apiKey: "" }, "save");
    expect(database.catSettings.upsert.mock.calls[0][0].update.encryptedKey).toBe(encryptedKey);
    expect(JSON.stringify(result)).not.toContain(encryptedKey);
    await expect(configureSettings({ ...DEFAULT_SETTINGS, model: "test-model", baseUrl: "https://other.example/v1" }, "test")).rejects.toThrow("重新填写密钥");
  });
  it("reserves global and visitor quotas atomically and rejects exhausted budgets", async () => {
    const reserve = vi.fn().mockResolvedValue([{ id: "day" }, { id: "visitor" }, { id: "minute" }]);
    database.$transaction.mockImplementation(callback => callback({ $queryRaw: reserve }));
    await reserveUsage("test-visitor", 200, 100000000);
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(reserve.mock.calls[0].slice(1)).toContain(200);
    reserve.mockResolvedValue([{ id: "day" }, { id: "visitor" }]);
    await expect(reserveUsage("test-visitor", 200, 100000000)).rejects.toMatchObject({ status: 429 });
  });
});
