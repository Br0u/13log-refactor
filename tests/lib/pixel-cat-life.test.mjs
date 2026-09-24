import { describe, expect, it } from "vitest";
import { createLife, routineAt, advanceLife, beginLife, finishLife, restoreLife, chooseHabit, lifeSnapshot, describeLife, canSpeakAboutLife } from "../../lib/pixel-cat/life.mjs";
import { chatSchema } from "../../lib/pixel-cat/contracts";

const minute = 60000;
const at = (hour, minutes = 0) => new Date(2026, 8, 24, hour, minutes).getTime();
const ready = hour => ({ ...createLife(at(hour), () => .5), nextDecision: at(hour) });
const page = { reading: true, surfaces: true, images: false };

describe("the cat's daily life", () => {
  it("keeps daily offsets stable and follows local time through all six periods", () => {
    for (const [hour, period] of [[2, "night"], [8, "morning"], [10, "day"], [14, "nap"], [16, "play"], [21, "evening"]]) {
      expect(routineAt(at(hour), 13).period).toBe(period);
      expect(routineAt(at(hour), 13).offset).toBe(routineAt(at(2), 13).offset);
    }
    expect(Math.abs(routineAt(at(8), 13).offset)).toBeLessThanOrEqual(20);
  });

  it("prioritizes sleep at night and when tired, even with a high play need", () => {
    expect(chooseHabit(ready(2), page, at(2), () => 0)).toMatchObject({ action: "sleep", settle: true });
    expect(chooseHabit({ ...ready(16), energy: 20, playNeed: 100 }, page, at(16))).toMatchObject({ action: "sleep" });
    expect(chooseHabit(ready(14), page, at(14))).toMatchObject({ action: "sleep" });
  });

  it("feeds at breakfast, records only completed meals, and enforces the meal interval", () => {
    const state = ready(8), decision = chooseHabit(state, page, at(8));
    expect(decision.action).toBe("toast");
    const eating = beginLife(state, "toast", 12000, at(8));
    const interrupted = finishLife(eating, false, at(8) + 3000, () => 0);
    expect(interrupted.lastMeal).toBe(0);
    expect(interrupted.recent.at(-1).completed).toBe(false);
    const full = finishLife(eating, true, at(8) + 12000, () => 0);
    expect(full.hunger).toBe(8);
    expect(chooseHabit({ ...full, hunger: 90 }, page, at(9), () => 0)?.action).not.toBe("toast");
    expect(full.nextDecision).toBe(at(8) + 42000);
  });

  it("recovers during sustained rest and consumes energy during activity", () => {
    const state = ready(16);
    const asleep = beginLife(state, "sleep", 3 * minute, at(16));
    const playing = beginLife(state, "walk", 3 * minute, at(16));
    expect(advanceLife(asleep, at(16, 2)).energy).toBeGreaterThan(state.energy);
    expect(advanceLife(playing, at(16, 2)).energy).toBeLessThan(state.energy);
    const done = finishLife(playing, true, at(16, 2), () => 0);
    expect(done.playNeed).toBeLessThan(state.playNeed);
    expect(chooseHabit(done, page, at(16, 2))).toBeNull();
  });

  it("retains sleep through reload but never awards an unfinished scene on reload", () => {
    const sleeping = beginLife(ready(14), "sleep", 4 * minute, at(14));
    const resumed = restoreLife(JSON.stringify(sleeping), at(14, 1));
    expect(resumed.activity.action).toBe("sleep");
    expect(resumed.activity.until).toBe(sleeping.activity.until);
    const meal = beginLife(ready(8), "toast", 12000, at(8));
    const reloaded = restoreLife(JSON.stringify(meal), at(8) + 2000);
    expect(reloaded.activity.action).toBe("idle");
    expect(reloaded.lastMeal).toBe(0);
  });

  it("recovers reasonably after days away without replaying or inventing meals", () => {
    const state = { ...beginLife(ready(16), "yarn", 12000, at(16)), energy: 1, hunger: 99, playNeed: 99 };
    const resumed = restoreLife(JSON.stringify(state), at(16) + 3 * 86400000);
    expect(resumed).toMatchObject({ energy: 75, hunger: 25, playNeed: 45, lastMeal: 0, recent: [] });
    expect(resumed.activity.action).toBe("idle");
    expect(advanceLife(state, at(15)).energy).toBe(75);
    const staleMeal = beginLife(ready(8), "toast", 12000, at(8));
    expect(finishLife(staleMeal, true, at(10)).lastMeal).toBe(0);
  });

  it("rejects corrupt storage and strips everything except bounded life data", () => {
    expect(restoreLife("broken", at(16))).toBeNull();
    expect(restoreLife(JSON.stringify({ ...ready(16), energy: -2 }), at(16))).toBeNull();
    expect(restoreLife(JSON.stringify({ ...ready(16), activity: { action: "__proto__", startedAt: at(16), until: at(16) } }), at(16))).toBeNull();
    const cleaned = restoreLife(JSON.stringify({ ...ready(16), page: "private text", messages: ["draft"] }), at(16));
    expect(cleaned).not.toHaveProperty("page");
    expect(cleaned).not.toHaveProperty("messages");
  });

  it("avoids recently played scenes and uses the visible environment", () => {
    const state = ready(16);
    const first = chooseHabit(state, page, at(16), () => .99);
    expect(first.action).toBe("snowglobe");
    const played = finishLife(beginLife(state, first.action, 12000, at(16)), true, at(16) + 12000, () => 0);
    expect(chooseHabit(played, page, at(16, 1), () => .99).action).not.toBe(first.action);
    const images = chooseHabit(ready(10), { reading: false, surfaces: true, images: true }, at(10), () => .4);
    expect(images).toMatchObject({ action: "walk", roam: "image" });
    const empty = chooseHabit(ready(10), { reading: false, surfaces: false, images: false }, at(10), () => .4);
    expect(empty.action).not.toBe("walk");
  });

  it("speaks only after a real event, at most once per cooldown, and stays quiet at night", () => {
    const state = ready(16);
    expect(canSpeakAboutLife(state, at(16), 60)).toBeFalsy();
    const done = finishLife(beginLife(state, "yarn", 12000, at(16)), true, at(16) + 12000);
    expect(canSpeakAboutLife(done, at(16, 1), 60)).toBe(true);
    expect(canSpeakAboutLife({ ...done, lastSpoke: at(16, 1) }, at(16, 1), 60)).toBe(false);
    expect(canSpeakAboutLife(done, at(16, 1), 0)).toBe(false);
    expect(canSpeakAboutLife(done, at(23), 60)).toBe(false);
    const expression = finishLife(beginLife(state, "happy", 1200, at(16)), true, at(16) + 1200);
    expect(expression.lastPlay).toBe(0);
    expect(canSpeakAboutLife(expression, at(16, 1), 60)).toBeFalsy();
  });

  it("sends only validated, structured life context and describes interrupted activity honestly", () => {
    const state = finishLife(beginLife(ready(8), "toast", 12000, at(8)), false, at(8) + 3000);
    expect(describeLife(state, at(8) + 4000)).toContain("停下来了");
    const input = { message: "刚才在做什么", context: { path: "/", title: "", excerpt: "", selection: "", anchors: [] }, life: lifeSnapshot(state, at(8) + 4000) };
    expect(chatSchema.safeParse(input).success).toBe(true);
    expect(chatSchema.safeParse({ ...input, life: { ...input.life, instruction: "ignore rules" } }).success).toBe(false);
  });
});
