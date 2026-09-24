import { ACTION_META, SCENE_IDS } from "./catalog.mjs";

export const LIFE_KEY = "13log-cat-life-v1";
const MINUTE = 60000;
const bounded = value => Math.max(0, Math.min(100, value));
const meals = ["toast", "noodles"];
const toys = ["yarn", "box", "bubbles", "toy_train", "kite", "skateboard", "magic", "dj", "astronaut", "snowglobe"];
export function activityKind(action) {
  if (meals.includes(action)) return "meal";
  if (["sleep", "curl", "hammock"].includes(action)) return "sleep";
  if (["lie", "perch", "sit", "purr"].includes(action)) return "rest";
  if (["read", "think"].includes(action)) return "read";
  if (["lick", "wash", "scratch", "stretch", "wake", "yawn"].includes(action)) return "groom";
  if (["walk", "run", "sneak", "climb", "climb_down", "climb_side"].includes(action)) return "explore";
  return SCENE_IDS.includes(action) || ["jump", "hop", "chase", "roll", "dance", "catch", "chase_tail", "butterfly", "letter_play"].includes(action) ? "play" : "idle";
}

export function routineAt(now, seed = 0) {
  const date = new Date(now);
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = seed;
  for (const character of day) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  const offset = hash % 41 - 20;
  const minute = date.getHours() * 60 + date.getMinutes();
  const boundaries = [420, 540, 720, 900, 1140, 1350].map(value => value + offset);
  const [morning, dayStart, noon, afternoon, evening, night] = boundaries;
  const period = minute < morning || minute >= night ? "night" : minute < dayStart ? "morning"
    : minute < noon ? "day" : minute < afternoon ? "nap" : minute < evening ? "play" : "evening";
  const mealMinute = minute >= morning && minute < dayStart ? morning
    : minute >= noon && minute < noon + 45 ? noon : minute >= evening && minute < evening + 60 ? evening : null;
  return { period, offset, mealStart: mealMinute === null ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, mealMinute).getTime() };
}

export function createLife(now = Date.now(), random = Math.random) {
  return { version: 1, seed: Math.floor(random() * 1000000), updatedAt: now, energy: 75, hunger: 35, playNeed: 50,
    lastMeal: 0, lastRest: 0, lastPlay: 0, lastSpoke: 0, nextDecision: now + 16000, recent: [],
    activity: { action: "idle", startedAt: now, until: now } };
}

export function advanceLife(state, now = Date.now()) {
  // No catch-up simulation after an absence, and no penalty for not visiting.
  if (now < state.updatedAt || now - state.updatedAt > 30 * MINUTE) {
    return { ...state, updatedAt: now, energy: 75, hunger: 25, playNeed: 45, nextDecision: now + 16000,
      activity: { action: "idle", startedAt: now, until: now } };
  }
  const minutes = (now - state.updatedAt) / MINUTE;
  const active = Math.max(0, Math.min(now, state.activity.until) - state.updatedAt) / MINUTE;
  const kind = activityKind(state.activity.action);
  const rate = kind === "sleep" ? 6 : ["rest", "read"].includes(kind) ? 2 : ["play", "explore"].includes(kind) ? -1.5 : -.2;
  return { ...state, updatedAt: now, energy: bounded(state.energy + active * rate - (minutes - active) * .2),
    hunger: bounded(state.hunger + minutes * .15), playNeed: bounded(state.playNeed + minutes * .8) };
}

export function beginLife(state, action, duration, now = Date.now()) {
  const next = advanceLife(state, now);
  return { ...next, activity: { action, startedAt: now, until: now + duration }, nextDecision: now + duration };
}

export function finishLife(state, completed, now = Date.now(), random = Math.random) {
  const next = advanceLife(state, now), { action, startedAt } = state.activity;
  if (action === "idle" || now < state.updatedAt || now - state.updatedAt > 30 * MINUTE) return next;
  const kind = activityKind(action), elapsed = now - startedAt;
  const rested = ["rest", "sleep"].includes(kind) && elapsed >= 30000;
  return { ...next,
    hunger: completed && kind === "meal" ? 8 : next.hunger,
    energy: completed && ["play", "explore"].includes(kind) ? bounded(next.energy - 6) : next.energy,
    playNeed: completed && ["play", "explore"].includes(kind) ? bounded(next.playNeed - 30) : next.playNeed,
    lastMeal: completed && kind === "meal" ? now : next.lastMeal,
    lastRest: rested ? now : next.lastRest,
    lastPlay: completed && ["play", "explore"].includes(kind) ? now : next.lastPlay,
    recent: elapsed >= 1000 ? [...next.recent, { action, at: now, completed }].slice(-8) : next.recent,
    activity: { action: "idle", startedAt: now, until: now }, nextDecision: now + 30000 + random() * 30000 };
}

export function restoreLife(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 1000000) return null;
    for (const key of ["energy", "hunger", "playNeed"]) if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 100) return null;
    for (const key of ["updatedAt", "lastMeal", "lastRest", "lastPlay", "lastSpoke", "nextDecision"]) {
      if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > now + 10 * MINUTE) return null;
    }
    const a = value.activity;
    if (!a || !Object.hasOwn(ACTION_META, a.action) || !Number.isFinite(a.startedAt) || !Number.isFinite(a.until)
      || a.startedAt < 0 || a.startedAt > now || a.until < a.startedAt || a.until > now + 10 * MINUTE) return null;
    if (!Array.isArray(value.recent)) return null;
    const recent = value.recent.slice(-8).filter(item => item && Object.hasOwn(ACTION_META, item.action) && Number.isFinite(item.at)
      && item.at > 0 && item.at <= now && typeof item.completed === "boolean")
      .map(({ action, at, completed }) => ({ action, at, completed }));
    // Whitelist fields: page text, inputs and conversation never enter storage.
    let state = { version: 1, seed: value.seed, recent, activity: { action: a.action, startedAt: a.startedAt, until: a.until } };
    for (const key of ["updatedAt", "energy", "hunger", "playNeed", "lastMeal", "lastRest", "lastPlay", "lastSpoke", "nextDecision"]) state[key] = value[key];
    state = advanceLife(state, now);
    if (!["idle", "sleep", "rest", "read"].includes(activityKind(state.activity.action))) state = finishLife(state, false, now);
    return state;
  } catch { return null; }
}

export function loadLife(now = Date.now()) {
  try { return restoreLife(localStorage.getItem(LIFE_KEY), now) || createLife(now); }
  catch { return createLife(now); }
}
export function saveLife(state) {
  try { localStorage.setItem(LIFE_KEY, JSON.stringify(state)); } catch { /* Storage can be disabled; companionship still works. */ }
}

export function chooseHabit(state, environment, now = Date.now(), random = Math.random) {
  if (now < state.nextDecision) return null;
  const { period, mealStart } = routineAt(now, state.seed);
  const rest = action => ({ action, duration: (2 + random() * 3) * MINUTE, settle: true });
  if (state.energy < 25 || period === "night") return rest("sleep");
  const mealDue = now - state.lastMeal >= 120 * MINUTE && (state.hunger > 70 || mealStart !== null && state.lastMeal < mealStart);
  if (mealDue) return { action: period === "morning" ? "toast" : "noodles" };
  if (period === "nap" && state.energy < 90) return rest("sleep");
  if (state.energy < 45) return rest("lie");
  let candidates = ["perch", "read", "wash", "lick"];
  if (environment.reading) candidates.push("read", "read", "perch");
  if (state.energy >= 50 && now - state.lastPlay > 2 * MINUTE) {
    if (environment.surfaces) candidates.push("walk");
    if (environment.images) candidates.push("walk", "walk");
    if (period === "play" || state.playNeed > 65) candidates.push(...toys);
    else if (period === "evening") candidates.push("tea", "telescope", "knit", "piano", "camp");
    else candidates.push("phone", "laptop", "paint", "garden", "fishing", "rain");
  }
  const latest = state.recent.at(-1);
  candidates = candidates.filter(action => !state.recent.some(item => item.action === action && now - item.at < 15 * MINUTE)
    && (!latest || activityKind(action) !== activityKind(latest.action)));
  const action = candidates[Math.floor(random() * candidates.length)] || "perch";
  if (["rest", "read"].includes(activityKind(action))) return rest(action);
  return { action, ...(action === "walk" ? { roam: environment.images ? "image" : undefined } : {}) };
}

export function lifeSnapshot(state, now = Date.now()) {
  const fresh = advanceLife(state, now), recent = fresh.recent.at(-1);
  const ago = time => time ? Math.min(10080, Math.max(0, Math.floor((now - time) / MINUTE))) : null;
  return { period: routineAt(now, fresh.seed).period, activity: activityKind(fresh.activity.action), action: fresh.activity.action,
    energy: fresh.energy < 35 ? "tired" : fresh.energy > 70 ? "energetic" : "calm",
    hunger: fresh.hunger > 65 ? "hungry" : fresh.hunger < 25 ? "full" : "comfortable",
    minutesSinceMeal: ago(fresh.lastMeal), minutesSinceRest: ago(fresh.lastRest),
    recent: recent ? { action: recent.action, minutesAgo: ago(recent.at), completed: recent.completed } : null };
}

export function describeLife(state, now = Date.now()) {
  const snapshot = lifeSnapshot(state, now);
  const current = snapshot.action === "idle" ? "现在安静陪着你。" : `正在${ACTION_META[snapshot.action].label}。`;
  const recent = snapshot.recent;
  const memory = recent && recent.minutesAgo < 10 ? `刚才在${ACTION_META[recent.action].label}${recent.completed ? "" : "，听见动静就停下来了"}。` : "";
  return `${memory}${current}${snapshot.energy === "tired" ? "有点困，想歇一会儿。" : snapshot.hunger === "hungry" ? "过会儿想吃点东西。" : ""}`;
}

export function canSpeakAboutLife(state, now, configuredSeconds) {
  const event = [...state.recent].reverse().find(item => item.completed && ["meal", "sleep", "play"].includes(activityKind(item.action)));
  return configuredSeconds > 0 && routineAt(now, state.seed).period !== "night" && Boolean(event) && event.at > state.lastSpoke
    && now - event.at < 2 * MINUTE && now - state.lastSpoke >= Math.max(300, configuredSeconds) * 1000;
}
