export const FRAME_SIZE = 48;
export const FRAME_COUNT = 8;
export const SCENE_GROUPS = [
  ["餐桌日常", [["phone", "玩手机"], ["noodles", "吃面条"], ["tea", "喝茶"], ["toast", "烤面包"]]],
  ["桌边时光", [["laptop", "敲键盘"], ["paint", "画画"], ["piano", "弹钢琴"], ["knit", "织围巾"]]],
  ["玩具小屋", [["yarn", "玩毛线球"], ["box", "钻纸箱"], ["bubbles", "吹泡泡"], ["toy_train", "玩小火车"]]],
  ["院子漫游", [["garden", "浇花"], ["rain", "撑伞听雨"], ["kite", "放风筝"], ["skateboard", "玩滑板"]]],
  ["远方旅行", [["fishing", "钓鱼"], ["camp", "围炉露营"], ["telescope", "看星星"], ["astronaut", "太空漫游"]]],
  ["奇妙时刻", [["magic", "变魔术"], ["dj", "打碟"], ["hammock", "睡吊床"], ["snowglobe", "摇雪景球"]]],
];
export const SCENE_IDS = SCENE_GROUPS.flatMap(([, entries]) => entries.map(([id]) => id));
export const ACTION_GROUPS = [
  ["日常", [["idle", "呼吸"], ["blink", "眨眼"], ["tail", "摇尾巴"], ["look", "转头"], ["tilt", "歪头"]]],
  ["移动", [["walk", "慢走"], ["run", "小跑"], ["sneak", "潜行"], ["turn", "转身"], ["brake", "急停"]]],
  ["跳跃", [["crouch", "蓄力"], ["jump", "起跳"], ["air", "腾空"], ["land", "落地"], ["hop", "连续小跳"]]],
  ["休息", [["sit", "坐下"], ["lie", "趴下"], ["curl", "蜷缩"], ["sleep", "睡觉"], ["wake", "醒来"]]],
  ["习性", [["lick", "舔爪"], ["wash", "洗脸"], ["scratch", "挠耳朵"], ["stretch", "伸懒腰"], ["yawn", "打哈欠"]]],
  ["情绪", [["happy", "开心"], ["surprise", "惊讶"], ["confused", "疑惑"], ["shy", "害羞"], ["angry", "炸毛"]]],
  ["互动", [["rub", "蹭手"], ["chase", "追鼠标"], ["held", "被拎起"], ["struggle", "挣扎"], ["wave", "挥爪"]]],
  ["页面", [["read", "阅读"], ["think", "思考"], ["point", "指向内容"], ["peek", "探头"], ["perch", "趴在边缘"]]],
  ["出入场", [["door_peek", "门后探头"], ["emerge", "钻出门"], ["enter", "钻进门"], ["tail_in", "收回尾巴"], ["logo_in", "钻入标志"], ["climb", "攀上入口"], ["fall", "落下"], ["talk", "说话"]]],
  ["小习惯", [["sniff", "闻一闻"], ["ear_twitch", "抖耳朵"], ["nod", "点头"], ["shake", "甩甩毛"]]],
  ["亲近", [["knead", "踩奶"], ["purr", "呼噜"], ["head_bump", "顶顶手"], ["bow", "鞠躬"]]],
  ["玩耍", [["roll", "打滚"], ["flop", "躺倒"], ["paw_tap", "拍拍爪"], ["dance", "小猫舞"], ["catch", "接小球"], ["chase_tail", "追尾巴"], ["butterfly", "扑蝴蝶"], ["heart", "送颗心"]]],
  ...SCENE_GROUPS,
  ["页面玩耍", [["climb_down", "往下爬"], ["letter_reach", "伸爪抓字"], ["letter_lift", "提起文字"], ["letter_play", "爪间搓字"], ["letter_return", "放回文字"]]],
  ["攀爬衔接", [["climb_grip", "伸爪抓稳"], ["climb_side", "沿边挪步"], ["climb_over", "翻上边缘"]]],
];
const CYCLES = { idle: 2000, blink: 400, tail: 1400, look: 1600, tilt: 1200, walk: 800, run: 480, sneak: 1200, turn: 480, brake: 320, crouch: 400, jump: 400, air: 640, land: 320, hop: 640, sit: 640, lie: 800, curl: 1200, sleep: 3200, wake: 1200, lick: 1200, wash: 1600, scratch: 640, stretch: 2000, yawn: 1600, happy: 800, surprise: 480, confused: 1400, shy: 1600, angry: 800, rub: 1600, chase: 480, held: 1800, struggle: 640, wave: 1000, read: 2400, think: 2000, point: 1200, peek: 1600, perch: 2600, door_peek: 960, emerge: 960, enter: 960, tail_in: 960, logo_in: 960, climb: 640, fall: 640, talk: 640, sniff: 1000, ear_twitch: 480, nod: 640, shake: 480, knead: 1600, purr: 2400, head_bump: 1200, bow: 1200, roll: 1200, flop: 800, paw_tap: 640, dance: 800, catch: 800, chase_tail: 1000, butterfly: 1200, heart: 1600 };
const ONCE = new Set(["blink", "turn", "brake", "crouch", "jump", "land", "sit", "lie", "wake", "stretch", "yawn", "surprise", "door_peek", "emerge", "enter", "tail_in", "logo_in", "fall", "ear_twitch", "nod", "shake", "head_bump", "bow", "roll", "flop", "catch", "heart"]);
Object.assign(CYCLES, { phone: 2000, noodles: 2400, tea: 3200, toast: 2400, laptop: 1200, paint: 2400, piano: 1600, knit: 2000, yarn: 1600, box: 2400, bubbles: 2400, toy_train: 2400, garden: 2400, rain: 2400, kite: 2000, skateboard: 1200, fishing: 3200, camp: 3200, telescope: 3200, astronaut: 3200, magic: 2400, dj: 1200, hammock: 4000, snowglobe: 2400 });
Object.assign(CYCLES, { climb_down: 1280, letter_reach: 1120, letter_lift: 1120, letter_play: 1120, letter_return: 1120 });
Object.assign(CYCLES, { climb: 1280, climb_grip: 480, climb_side: 1280, climb_over: 640 });
ONCE.add("climb_grip"); ONCE.add("climb_over");
for (const id of ["letter_reach", "letter_lift", "letter_return"]) ONCE.add(id);
export const ACTIONS = ACTION_GROUPS.flatMap(([group, entries]) => entries.map(([id, label]) => ({ id, label, group, cycle: CYCLES[id], loop: !ONCE.has(id), duration: SCENE_IDS.includes(id) ? Math.ceil(12000 / CYCLES[id]) * CYCLES[id] : CYCLES[id] * (id === "sleep" ? 2 : 1) })));
export const ACTION_META = Object.fromEntries(ACTIONS.map(action => [action.id, action]));
export const ACTION_IDS = ACTIONS.map(({ id }) => id);
export const BEHAVIORS = [
  { id: "reading", label: "陪你读一会儿", actions: ["walk", "sit", "read", "tilt", "think", "point", "talk"] },
  { id: "play", label: "捕猎鼠标", actions: ["look", "sneak", "chase", "crouch", "jump", "land", "lick"] },
  { id: "nap", label: "午后打盹", actions: ["yawn", "stretch", "lie", "curl", "sleep", "wake"] },
  { id: "explore", label: "巡视书架", actions: ["peek", "walk", "crouch", "hop", "perch", "look"] },
  { id: "greet", label: "见到你了", actions: ["surprise", "run", "brake", "happy", "rub", "wave"] },
  { id: "groom", label: "认真洗个脸", actions: ["sit", "lick", "wash", "scratch", "tail", "blink"] },
  { id: "question", label: "让我想想", actions: ["look", "confused", "think", "point", "talk", "shy"] },
  { id: "door", label: "从家里出发", actions: ["door_peek", "emerge", "fall", "land", "stretch", "wave"] },
  { id: "home", label: "回家睡觉", actions: ["walk", "climb", "enter", "tail_in"] },
  { id: "affection", label: "今天也喜欢你", actions: ["sniff", "head_bump", "knead", "purr", "heart"] },
  { id: "rolling", label: "滚个懒腰", actions: ["stretch", "flop", "roll", "wake", "shake"] },
  { id: "butterfly", label: "追一只蝴蝶", actions: ["ear_twitch", "look", "butterfly", "jump", "catch", "paw_tap"] },
  { id: "dance", label: "跳支小猫舞", actions: ["bow", "dance", "hop", "dance", "heart"] },
  { id: "tail_game", label: "是谁的尾巴", actions: ["ear_twitch", "sniff", "chase_tail", "roll", "confused"] },
  { id: "listening", label: "我在认真听", actions: ["sit", "ear_twitch", "tilt", "nod", "purr"] },
  { id: "sunbath", label: "晒一会儿太阳", actions: ["stretch", "flop", "purr", "sleep"] },
  { id: "ball", label: "爪爪接球", actions: ["look", "crouch", "catch", "paw_tap", "happy"] },
  { id: "breakfast", label: "小猫早餐铺", actions: ["toast", "noodles", "tea"] },
  { id: "desk", label: "摸鱼工作日", actions: ["laptop", "phone", "stretch", "tea"] },
  { id: "studio", label: "猫猫艺术家", actions: ["paint", "piano", "knit", "bow"] },
  { id: "toy_room", label: "玩具总动员", actions: ["yarn", "box", "toy_train", "bubbles"] },
  { id: "courtyard", label: "院子里的风", actions: ["garden", "kite", "skateboard", "rain"] },
  { id: "camping", label: "山野一日游", actions: ["fishing", "camp", "telescope", "hammock"] },
  { id: "dream_trip", label: "星际奇遇记", actions: ["snowglobe", "magic", "astronaut", "heart"] },
  { id: "cat_party", label: "今晚有演出", actions: ["piano", "dj", "dance", "magic", "bow"] },
];

export const AMBIENT_BEHAVIORS = BEHAVIORS.filter(item => !["door", "home"].includes(item.id));

export function localCommand(message) {
  const text = message.trim().toLowerCase().replace(/[，。！？!?,.～~\s]/g, "").replace(/^(请|帮我|给我|小猫)(?=.)/, "");
  if (/^(回家|回去吧|再见|拜拜|消失|goodbye|bye)$/.test(text)) return { kind: "home" };
  if (/^(安静|安静一会儿|别动|不要动)$/.test(text)) return { kind: "quiet" };
  if (/^(可以玩啦|继续玩|继续活动)$/.test(text)) return { kind: "resume" };
  if (/^(陪我看这页|看看这页|读这页)$/.test(text)) return { kind: "read" };
  if (/^(抓个字|抓一个字|抓文字|玩文字)$/.test(text)) return { kind: "roam", target: "text" };
  if (/^(爬图片|爬上图片)$/.test(text)) return { kind: "roam", target: "image" };
  if (/^(往下爬|向下爬|爬下去)$/.test(text)) return { kind: "roam", target: "down" };
  if (/^(自己玩|自由活动|逛逛这页|爬猫架)$/.test(text)) return { kind: "roam" };
  const scene = ACTIONS.find(item => SCENE_IDS.includes(item.id) && item.label === text);
  if (scene) return { kind: "play", actions: [scene.id], rest: "idle" };
  for (const [pattern, actions, rest = "idle"] of [
    [/^(睡觉|睡吧|去睡觉|睡一会儿)$/, ["yawn", "lie", "curl", "sleep"], "sleep"],
    [/^(醒醒|起床|醒来)$/, ["wake", "stretch", "shake"]],
    [/^(跳|跳一下|跳一跳|jump)$/, ["jump", "happy"]],
    [/^(跳舞|跳个舞|dance)$/, ["bow", "dance", "hop", "heart"]],
    [/^(打滚|滚一圈|滚一个)$/, ["flop", "roll", "wake"]],
    [/^(伸懒腰|伸个懒腰)$/, ["stretch", "shake"]],
    [/^(挥手|挥挥手|招招手|挥爪)$/, ["wave", "heart"]],
    [/^(洗脸|洗洗脸|舔爪)$/, ["sit", "lick", "wash"]],
    [/^(踩奶|撒娇|蹭蹭|摸摸|摸摸头)$/, ["head_bump", "knead", "purr"], "sit"],
    [/^(走走|走一走|散步)$/, ["walk", "sniff"]],
    [/^(跑|跑一跑|跑一下)$/, ["run", "brake"]],
    [/^(追尾巴|追追尾巴)$/, ["chase_tail", "confused"]],
    [/^(抓蝴蝶|扑蝴蝶)$/, ["butterfly", "jump", "catch"]],
    [/^(比心|送颗心)$/, ["heart", "shy"]],
    [/^(坐下|坐好)$/, ["sit"], "sit"],
    [/^(吃面|嗦面)$/, ["noodles"]],
    [/^(刷手机|看手机)$/, ["phone"]],
    [/^(毛线球|滚毛线球)$/, ["yarn"]],
    [/^(弹琴)$/, ["piano"]],
    [/^(露营|烤棉花糖)$/, ["camp"]],
    [/^(观星|看星空)$/, ["telescope"]],
    [/^(躲雨|撑伞)$/, ["rain"]],
  ]) if (pattern.test(text)) return { kind: "play", actions, rest };
  return null;
}

export function clampPosition(point, width, height, size = 96) {
  return { x: Math.round(Math.max(0, Math.min(width - size, point.x))), y: Math.round(Math.max(0, Math.min(height - size, point.y))) };
}

export function storageGet() {
  try { return sessionStorage.getItem("13log-cat") === "awake"; } catch { return false; }
}
export function storageSet(awake) {
  try { sessionStorage.setItem("13log-cat", awake ? "awake" : "asleep"); } catch { /* Private browsing can disable storage. */ }
}
