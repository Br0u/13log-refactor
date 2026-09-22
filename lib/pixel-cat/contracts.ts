import { z } from "zod";
import { ACTION_IDS } from "./catalog.mjs";

export const settingsSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().trim().url().max(300),
  model: z.string().trim().min(1).max(100),
  apiKey: z.string().trim().max(500).default(""),
  removeKey: z.boolean().default(false),
  personality: z.string().trim().min(1).max(800),
  proactiveSeconds: z.number().int().min(0).max(600).refine(n => n === 0 || n >= 60),
  dailyLimit: z.number().int().min(1).max(10000),
});

export const DEFAULT_SETTINGS = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  model: "",
  personality: "你是住在 13log 的黑色小猫，黄色眼睛、红色嘴巴。好奇、温柔，有一点调皮。用简短自然的中文陪伴阅读，不编造文章内容；不知道就直说。安静比打扰更重要。",
  proactiveSeconds: 120,
  dailyLimit: 200,
};

export const PUBLIC_PATH = /^\/(?:$|(?:posts|photos|about|link|playzone)(?:\/[^?#]*)?\/?$)/;
export const contextSchema = z.object({
  path: z.string().max(300).regex(PUBLIC_PATH),
  title: z.string().max(200),
  excerpt: z.string().max(6000),
  selection: z.string().max(1200).default(""),
  anchors: z.array(z.object({ id: z.string().regex(/^cat-target-\d+$/), text: z.string().max(100) })).max(12),
});
export const chatSchema = z.object({
  message: z.string().trim().max(800),
  proactive: z.boolean().default(false),
  context: contextSchema,
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(800) })).max(6).default([]),
});
// Portal/drag states belong to the controller, not to AI plans.
export const AI_ACTIONS = ACTION_IDS.filter(id => !["door_peek", "emerge", "enter", "tail_in", "logo_in", "climb", "held", "struggle", "fall"].includes(id));
export const planSchema = z.object({
  say: z.string().max(240),
  actions: z.array(z.object({
    type: z.string().refine(value => AI_ACTIONS.includes(value) || value === "walk_to"),
    target: z.string().regex(/^cat-target-\d+$/).optional(),
  }).strict()).max(6),
}).strict();

export function validatePlan(value: unknown, context: z.infer<typeof contextSchema>) {
  const plan = planSchema.parse(value);
  const targets = new Set(context.anchors.map(anchor => anchor.id));
  for (const action of plan.actions) {
    if ((action.type === "walk_to" && !action.target) || (action.target && !targets.has(action.target))) throw new Error("Invalid interaction target");
  }
  return plan;
}

// Providers can wrap JSON or add unsupported actions. Keep usable speech without
// ever forwarding an unvalidated action to the browser.
export function parseModelPlan(content: unknown, context: z.infer<typeof contextSchema>) {
  if (typeof content !== "string" || !content.trim()) throw new Error("Empty model response");
  let text = content.trim().replace(/^<think>[\s\S]*?<\/think>\s*/i, "").trim();
  text = text.replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, "$1").trim();
  let value: unknown;
  try { value = JSON.parse(text); }
  catch {
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start >= 0) {
      if (end < start) throw new Error("Incomplete model JSON");
      value = JSON.parse(text.slice(start, end + 1));
    } else {
      // Plain assistant speech is useful too; do not surface partial JSON or reasoning.
      if (/^[\["`<]/.test(text) || !text) throw new Error("Invalid model response");
      value = { say: text, actions: [] };
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid model response");
  const record = value as Record<string, unknown>;
  if (typeof record.say !== "string") throw new Error("Missing model speech");
  const actions: z.infer<typeof planSchema>["actions"] = [];
  for (const candidate of Array.isArray(record.actions) ? record.actions.slice(0, 24) : []) {
    const action = typeof candidate === "string" ? { type: candidate } : candidate;
    try { actions.push(...validatePlan({ say: "", actions: [action] }, context).actions); } catch { /* Ignore invalid actions, retain valid speech. */ }
    if (actions.length === 6) break;
  }
  // Match the browser history limit; do not reject a whole answer for excess length.
  const say = record.say.trim().slice(0, 800);
  return { say, actions };
}
