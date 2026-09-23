import { afterAll, expect, it } from "vitest";
import { db } from "../../lib/db";
import { configureSettings, decryptKey, getSettings, reserveUsage } from "../../lib/pixel-cat/server";
import { DEFAULT_SETTINGS } from "../../lib/pixel-cat/contracts";

const testModel = "test-13log-pixel-cat";
const testNow = Date.UTC(2079, 0, 1);
const day = Math.floor(testNow / 86400000), minute = Math.floor(testNow / 60000);
const counters = { OR: [{ id: `day:${day}` }, { id: { startsWith: `visitor:${day}:` } }, { id: { startsWith: `minute:${minute}:` } }, { id: { startsWith: `minute:${minute + 1}:` } }] };
afterAll(async () => {
  await db.catSettings.deleteMany({ where: { id: "singleton", model: testModel } });
  await db.catUsage.deleteMany({ where: counters });
  await db.$disconnect();
});

it("persists only ciphertext, preserves it on a blank edit, and deletes it explicitly", async () => {
  if (await getSettings()) throw new Error("Run cat integration tests in an empty isolated database.");
  const config = { ...DEFAULT_SETTINGS, model: testModel, apiKey: "test-key-not-a-real-provider-key" };
  await configureSettings(config, "save");
  const first = await getSettings();
  expect(first?.encryptedKey).not.toContain(config.apiKey);
  expect(decryptKey(first!.encryptedKey!)).toBe(config.apiKey);
  await configureSettings({ ...config, apiKey: "", personality: "喜欢看书的小黑" }, "save");
  expect((await getSettings())?.encryptedKey).toBe(first?.encryptedKey);
  await configureSettings({ ...config, apiKey: "", dailyLimit: 0 }, "save");
  expect((await getSettings())?.dailyLimit).toBe(0);
  await configureSettings({ ...config, apiKey: "", removeKey: true }, "save");
  expect((await getSettings())?.encryptedKey).toBeNull();
});

it("keeps the global ceiling under concurrent requests without partial visitor reservations", async () => {
  const outcomes = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => reserveUsage(`test-visitor-${index}`, 3, testNow)));
  expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(3);
  expect(outcomes.filter(result => result.status === "rejected").every(result => result.status === "rejected" && result.reason.status === 429)).toBe(true);
  expect((await db.catUsage.findUnique({ where: { id: `day:${day}` } }))?.count).toBe(3);
  const visitorCounters = await db.catUsage.findMany({ where: { id: { startsWith: `visitor:${day}:` } } });
  expect(visitorCounters.reduce((sum, row) => sum + row.count, 0)).toBe(3);
});

it("rolls back global and minute counters when a visitor limit is reached", async () => {
  await db.catUsage.deleteMany({ where: counters });
  for (let index = 0; index < 6; index++) await reserveUsage("same-visitor", 200, testNow);
  await expect(reserveUsage("same-visitor", 200, testNow)).rejects.toMatchObject({ status: 429 });
  expect((await db.catUsage.findUnique({ where: { id: `day:${day}` } }))?.count).toBe(6);
  await db.catUsage.updateMany({ where: { id: { startsWith: `visitor:${day}:` } }, data: { count: 40 } });
  await expect(reserveUsage("same-visitor", 200, testNow + 60000)).rejects.toMatchObject({ status: 429 });
  expect((await db.catUsage.findUnique({ where: { id: `day:${day}` } }))?.count).toBe(6);
  expect(await db.catUsage.count({ where: { id: { startsWith: `minute:${minute + 1}:` } } })).toBe(0);
});

it("allows unlimited site-wide use at zero while keeping visitor limits", async () => {
  await db.catUsage.deleteMany({ where: counters });
  const outcomes = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => reserveUsage(`unlimited-${index}`, 0, testNow)));
  expect(outcomes.every(result => result.status === "fulfilled")).toBe(true);
  for (let index = 0; index < 6; index++) await reserveUsage("same-visitor", 0, testNow);
  await expect(reserveUsage("same-visitor", 0, testNow)).rejects.toMatchObject({ status: 429 });
  expect((await db.catUsage.findUnique({ where: { id: `day:${day}` } }))?.count).toBe(16);
});
