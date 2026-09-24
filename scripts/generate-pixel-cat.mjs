// Original 48px artwork. Every pose is rasterized on an integer grid; no smoothing.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ACTIONS, SCENE_IDS, FRAME_SIZE as S, FRAME_COUNT as N } from "../lib/pixel-cat/catalog.mjs";

const C = { ink: [23, 23, 29, 255], edge: [72, 68, 83, 255], shade: [35, 34, 43, 255], eye: [247, 199, 57, 255], gleam: [255, 239, 164, 255], red: [226, 76, 91, 255], blue: [129, 153, 172, 255], paper: [222, 212, 185, 255] };
Object.assign(C, { wood: [156, 101, 66, 255], crust: [193, 131, 76, 255], cream: [255, 236, 194, 255], mint: [120, 187, 159, 255], leaf: [65, 125, 103, 255], sky: [159, 204, 222, 255], violet: [175, 144, 199, 255], pink: [240, 173, 181, 255] });

function canvas() {
  const pixels = Buffer.alloc(S * S * 4);
  const dot = (x, y, color = "ink") => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < S && y >= 0 && y < S) pixels.set(C[color], (y * S + x) * 4); };
  const rect = (x, y, w, h, c = "ink") => { for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) dot(x + i, y + j, c); };
  const line = (x, y, xx, yy, c = "ink", width = 1) => { const steps = Math.max(Math.abs(xx - x), Math.abs(yy - y), 1); for (let i = 0; i <= steps; i++) rect(x + (xx - x) * i / steps, y + (yy - y) * i / steps, width, width, c); };
  const oval = (x, y, w, h, color = "ink") => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (((i + .5 - w / 2) / (w / 2)) ** 2 + ((j + .5 - h / 2) / (h / 2)) ** 2 <= 1) dot(x + i, y + j, color);
    }
  };
  const poly = (points, c = "ink") => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) dot(x, y, c);
    }
  };
  return { pixels, dot, rect, line, poly, oval };
}

export function drawCat(action, frame) {
  if (SCENE_IDS.includes(action)) return drawScene(action, frame);
  const g = canvas();
  const { rect, line, poly, dot, oval } = g;
  const wave = Math.round(Math.sin(frame * Math.PI / 4) * 2);
  const beat = frame % 4 < 2 ? 0 : 1;
  let hx = 21, hy = 19, bw = 12, bh = 14, by = 25, feet = 0, paw = "down", face = "normal", tilt = 0, tail = wave, side = false;
  switch (action) {
    case "idle": hy += beat; bh -= beat; break;
    case "blink": face = frame === 3 || frame === 4 ? "closed" : "normal"; break;
    case "tail": tail = wave * 3; hy -= 1; break;
    case "look": hx += wave; side = frame > 3; break;
    case "tilt": tilt = wave; hy += 1; break;
    case "walk": side = true; feet = wave; hy += beat; hx = 24; break;
    case "run": side = true; feet = wave * 2; hx = 26; hy = 22 - beat * 3; by = 27 - beat * 3; bw = 17; bh = 9; tail = -5; break;
    case "sneak": side = true; hx = 27; hy = 28 + beat; by = 30; bw = 18; bh = 8; feet = wave; face = "narrow"; tail = -4; break;
    case "turn": hx += wave * 2; side = frame > 1 && frame < 6; tail = -wave; break;
    case "brake": side = true; hx = 24 - beat; hy = 23; bw = 15; bh = 11; feet = -3; paw = "forward"; tail = -8 + beat; break;
    case "crouch": hy = 23 + frame % 4; by = 29; bh = 9; bw = 16; face = "narrow"; tail = frame - 5; break;
    case "jump": hy = 22 - frame; by = 27 - frame; bh = 14 + beat; paw = "up"; feet = 2; tail = 6; break;
    case "air": hy = 12 + beat; by = 21; bh = 10; bw = 15; paw = "spread"; feet = 3 + beat; tail = 5; break;
    case "land": hy = 26 - Math.min(frame, 5); by = 28; bw = 16 - Math.min(frame, 4); bh = 10 + Math.min(frame, 4); feet = 2 - beat; break;
    case "hop": hy = 20 - Math.abs(wave) * 3; by = 26 - Math.abs(wave) * 3; paw = "up"; tail = -wave; break;
    case "sit": hy = 20 + Math.min(frame, 3); by = 27; bh = 13; bw = 15; tail = 4 + beat; break;
    case "lie": hy = 25 + Math.min(frame, 4); by = 31; bh = 8; bw = 21; paw = "forward"; break;
    case "curl": hy = 30 + beat; hx = 25; by = 29; bh = 11; bw = 21; face = "closed"; tail = 10; break;
    case "sleep": hy = 32 + beat; hx = 24; by = 31; bh = 8; bw = 22; face = "closed"; tail = 9; break;
    case "wake": hy = 29 - frame; by = 29; bh = 11; bw = 17; face = frame < 4 ? "closed" : "wide"; paw = frame > 3 ? "up" : "down"; break;
    case "lick": hy = 23; hx = 22 + beat; paw = "mouth"; face = "lick"; break;
    case "wash": hy = 23 + beat; paw = "face"; face = "closed"; break;
    case "scratch": hy = 22; tilt = 2; paw = "ear"; feet = beat * 2; break;
    case "stretch": hx = 28; hy = 29 + beat; by = 26; bw = 19; bh = 11; paw = "forward"; tail = -9; face = "closed"; break;
    case "yawn": hy = 21 - beat; face = "yawn"; paw = "spread"; break;
    case "happy": hy = 21 + beat; face = "happy"; tail = wave * 3; paw = "up"; break;
    case "surprise": hy = 18 - beat; face = "wide"; paw = "spread"; tail = -10; break;
    case "confused": tilt = wave; hy = 22; face = "uneven"; tail = 5; break;
    case "shy": hy = 25 + beat; paw = "face"; face = "shy"; tail = 8; break;
    case "angry": hy = 18; by = 24; bw = 17; bh = 15; face = "angry"; tail = -10 + beat; break;
    case "rub": hx = 23 + wave; hy = 24; tilt = wave; face = "closed"; bw = 14; tail = -8; break;
    case "chase": side = true; hx = 28; hy = 23 - beat; by = 27; bw = 18; bh = 10; feet = wave * 2; paw = "forward"; tail = -7; break;
    case "held": hy = 12 + beat; by = 21; bh = 16; paw = "dangling"; feet = 2; tail = 7; break;
    case "struggle": hx += wave; hy = 14; by = 23; paw = "spread"; feet = wave * 2; tail = wave * 3; break;
    case "wave": hy = 20; paw = "wave"; tail = 3; break;
    case "read": hy = 25 + beat; face = "narrow"; paw = "book"; break;
    case "think": hy = 21; tilt = -1; paw = "chin"; face = "narrow"; break;
    case "point": hy = 21; hx = 23; side = true; paw = "point"; tail = 2 + beat; break;
    case "peek": hx = 20 + wave; hy = 27 - beat; by = 31; bh = 10; paw = "ledge"; break;
    case "perch": hy = 29 + beat; by = 31; bw = 22; bh = 8; paw = "dangling"; face = "narrow"; tail = 8; break;
    case "door_peek": hy = 26 - frame; hx = 23 + beat; by = 32; face = frame > 3 ? "wide" : "narrow"; break;
    case "emerge": hy = 26 - Math.min(frame, 4); by = 28; bh = 12; paw = "forward"; feet = wave; break;
    case "enter": side = true; hx = 26; hy = 25; by = 29; bh = 10; paw = "forward"; tail = -6 + beat; break;
    case "tail_in": hy = 32; by = 34; bw = 15; bh = 7; tail = -9 + frame; break;
    case "logo_in": side = true; hx = 28; hy = 27; by = 29; bw = 19; bh = 9; feet = wave; tail = -9; break;
    case "climb": side = true; hx = 25; hy = 16 + beat; by = 25; bh = 16; paw = "up"; feet = wave * 2; tail = 6; break;
    case "fall": hy = 13 + frame; by = 21 + frame; bh = 12; paw = "spread"; feet = 3; tail = -7; break;
    case "talk": hy = 21 + beat; face = "talk"; paw = frame < 4 ? "down" : "point"; break;
    case "sniff": hx = 25 + beat; hy = 26 + wave; by = 28; bw = 16; bh = 11; side = true; tail = 4; break;
    case "ear_twitch": hy = 20; tilt = [0, 0, 2, -2, 1, 0, 0, 0][frame]; tail = wave; break;
    case "nod": hy = 20 + [0, 1, 3, 4, 3, 1, 0, 0][frame]; face = frame > 1 && frame < 5 ? "closed" : "normal"; tail = 2; break;
    case "shake": hx = 21 + wave * 2; hy = 22; tilt = -wave; bw = 16; by = 26; tail = -wave * 2; break;
    case "knead": hy = 25 + beat; by = 28; bw = 17; bh = 11; face = "happy"; paw = "knead"; tail = 6; break;
    case "purr": hy = 24 + beat; by = 28; bw = 18; bh = 11 - beat; face = "happy"; tail = 8 + beat; break;
    case "head_bump": hx = 22 + Math.abs(wave) * 2; hy = 23 - Math.abs(wave); by = 27; face = "closed"; tilt = -wave; tail = -4; break;
    case "bow": hy = 20 + [0, 2, 5, 7, 7, 5, 2, 0][frame]; by = 27; bw = 16; bh = 12; paw = "forward"; face = frame > 1 && frame < 6 ? "closed" : "normal"; tail = -5; break;
    case "roll": hx = 23; hy = 26; by = 27; bw = 19; bh = 10; face = "happy"; paw = "up"; tail = 6; break;
    case "flop": hx = 22 + Math.min(frame, 4); hy = 22 + Math.min(frame, 6); by = 29; bw = 15 + Math.min(frame, 5); bh = 11 - Math.min(frame, 3); paw = "forward"; face = frame > 3 ? "happy" : "normal"; break;
    case "paw_tap": hy = 24; by = 28; bw = 16; paw = "tap"; tail = wave * 2; face = "narrow"; break;
    case "dance": hx = 21 + wave; hy = 20 - beat * 2; by = 26 - beat; paw = frame < 4 ? "wave" : "spread"; feet = wave * 2; tail = -wave * 2; face = "happy"; break;
    case "catch": hx = 24; hy = 22 - Math.abs(wave); paw = frame < 4 ? "up" : "mouth"; face = frame < 4 ? "wide" : "happy"; tail = -4; break;
    case "chase_tail": hx = 21 - wave * 2; hy = 24 + beat; bw = 19; bh = 11; by = 28; side = frame % 4 < 2; feet = -wave; tail = -wave * 3; paw = "forward"; break;
    case "butterfly": hx = 24 + beat; hy = 23 - beat * 2; paw = "wave"; face = "wide"; tail = -5 + wave; break;
    case "heart": hy = 23 + beat; face = "happy"; paw = "chin"; tail = 4; break;
  }
  const bx = 21 - Math.floor(bw / 2);
  // Tail behind the body, with a stepped hooked tip.
  line(bx + 3, by + bh - 4, 9, by + bh - 3, "ink", 4);
  line(9, by + bh - 3, 5, by + bh - 8, "ink", 4);
  line(5, by + bh - 8, 5, 27 + tail, "ink", 4);
  line(5, 27 + tail, 8, 24 + tail, "ink", 3);
  dot(7, 24 + tail, "edge");
  oval(bx - 1, by, bw + 2, bh + 1, "edge");
  oval(bx, by, bw, bh);
  oval(bx + 2, by + 2, Math.max(3, bw - 5), Math.max(3, bh - 5), "shade");
  oval(bx - feet, by + bh - 3, 7, 5);
  oval(bx + bw - 6 + feet, by + bh - 3, 7, 5);
  rect(bx + 2 - feet, by + bh, 2, 1, "shade");
  rect(bx + bw - 4 + feet, by + bh, 2, 1, "shade");
  if (action === "angry") for (let i = 0; i < 5; i++) poly([[bx - 3, by + i * 3], [bx + 3, by + i * 3], [bx + 1, by + i * 3 + 4]], "edge");
  // Rounded cheeks and short ears; all curves stay on the integer pixel grid.
  poly([[hx - 11, hy - 13 + tilt], [hx - 3, hy - 6], [hx - 11, hy + 1]], "edge");
  poly([[hx + 10, hy - 14 - tilt], [hx + 2, hy - 6], [hx + 11, hy + 1]], "edge");
  poly([[hx - 10, hy - 11 + tilt], [hx - 4, hy - 5], [hx - 10, hy]], "ink");
  poly([[hx + 9, hy - 12 - tilt], [hx + 3, hy - 5], [hx + 10, hy]], "ink");
  line(hx - 9, hy - 9 + tilt, hx - 7, hy - 6, "shade");
  line(hx + 8, hy - 10 - tilt, hx + 6, hy - 6, "shade");
  oval(hx - 12, hy - 8, 25, 18, "edge");
  oval(hx - 11, hy - 8, 23, 17);
  line(hx - 7, hy - 7, hx - 3, hy - 7, "shade");
  const ex = hx + (side ? 3 : 0), ey = hy - 1;
  const closed = face === "closed" || face === "happy";
  const eyeHeight = closed ? 1 : face === "narrow" ? 3 : face === "wide" ? 7 : 5;
  oval(ex - 8, ey - 1, 6, eyeHeight, "eye");
  oval(ex + 3, ey - 1 + (face === "uneven" ? 2 : 0), side ? 4 : 6, eyeHeight, "eye");
  if (!closed) {
    rect(ex - 5 + (action === "look" ? beat : 0), ey - 1, 2, Math.max(1, eyeHeight - 1));
    rect(ex + 5, ey - 1, 1, Math.max(1, eyeHeight - 1));
    dot(ex - 7, ey, "gleam"); dot(ex + 4, ey, "gleam");
  } else if (face === "happy") { dot(ex - 6, ey - 2, "eye"); dot(ex + 5, ey - 2, "eye"); }
  if (face === "angry") { line(ex - 7, ey - 1, ex - 3, ey + 1, "shade", 2); line(ex + 2, ey + 1, ex + 6, ey - 1, "shade", 2); }
  dot(ex, hy + 3, "edge");
  rect(ex - 1, hy + 5, 3, face === "yawn" ? 3 + beat * 2 : face === "talk" ? 1 + beat * 2 : 1, "red");
  if (face === "normal" || face === "happy") dot(ex, hy + 6, "red");
  if (face === "lick") rect(ex, hy + 5, 2 + beat, 2, "red");
  if (face === "shy") { rect(ex - 8, hy + 3, 3, 1, "red"); rect(ex + 6, hy + 3, 2, 1, "red"); }
  dot(hx - 10, hy + 3, "shade"); dot(hx + 9, hy + 3, "shade");
  const arm = (x, y, xx, yy) => { line(x, y, xx, yy, "ink", 4); rect(xx + 1, yy + 2, 2, 1, "shade"); };
  switch (paw) {
    case "up": arm(15, by + 5, 12, hy - 1); arm(26, by + 5, 32, hy); break;
    case "spread": arm(15, by + 5, 8 - beat, by); arm(27, by + 5, 35 + beat, by - 2); break;
    case "forward": arm(24, by + 5, 35 + beat, by + bh - 1); break;
    case "mouth": arm(26, by + 7, hx + 1, hy + 6 + beat); break;
    case "face": arm(26, by + 6, hx + 5, hy + wave); break;
    case "ear": arm(14, by + 8, hx - 10, hy - 5 + beat * 3); break;
    case "wave": arm(26, by + 5, 34 + wave, hy - 3); break;
    case "chin": arm(26, by + 5, hx + 2 + beat, hy + 6); break;
    case "point": arm(26, by + 4, 37 + beat, by + 1); rect(38 + beat, by, 3, 2, "edge"); break;
    case "dangling": arm(14, by + 5, 13 + beat, by + bh + 3); arm(26, by + 5, 27 - beat, by + bh + 3); break;
    case "ledge": rect(8, 38, 31, 2, "blue"); arm(15, 33, 14, 37); arm(27, 33, 28, 37); break;
    case "book": poly([[11, 33], [22, 35], [34, 32], [34, 41], [22, 44], [11, 41]], "paper"); line(22, 35, 22, 43, "blue"); line(14, 36, 19, 37, "blue"); line(25, 37, 31, 35 + beat, "blue"); break;
    case "knead": arm(15, by + 4, 14, by + 10 + beat * 2); arm(26, by + 4, 27, by + 12 - beat * 2); rect(12, by + 13, 19, 1, "paper"); break;
    case "tap": arm(15, by + 4, 15, by + 11); arm(26, by + 4, 32, by + 8 + wave); if (wave > 0) rect(31, by + 13, 5, 1, "blue"); break;
    default: arm(15, by + 5, 15 + beat, by + bh - 2); arm(26, by + 5, 26, by + bh - 2);
  }
  if (action === "sleep") { line(34, 19 - beat * 2, 38, 19 - beat * 2, "blue"); line(38, 19 - beat * 2, 34, 23 - beat * 2, "blue"); line(34, 23 - beat * 2, 38, 23 - beat * 2, "blue"); }
  if (action === "confused") { line(35, 8 + beat, 39, 8 + beat, "eye"); line(39, 8 + beat, 39, 11 + beat, "eye"); line(39, 11 + beat, 36, 13 + beat, "eye"); dot(36, 16 + beat, "eye"); }
  if (action === "surprise") { rect(37, 8 - beat, 2, 5, "eye"); rect(37, 15 - beat, 2, 2, "eye"); }
  if (action === "happy") { dot(36, 16 + wave, "red"); rect(35, 14 + wave, 3, 2, "red"); }
  if (action === "brake") { line(4, 41, 8 + frame % 3, 41, "blue"); line(5, 44, 12, 44, "blue"); }
  if (action === "sniff") { dot(38 + beat, hy, "paper"); dot(41, hy - 2 + wave, "paper"); }
  if (action === "purr") { line(5, 21 + wave, 3, 23 + wave, "blue"); line(37, 21 - wave, 39, 23 - wave, "blue"); }
  if (action === "heart") {
    const x = 34, y = 18 - frame;
    rect(x, y, 2, 2, "red"); rect(x + 3, y, 2, 2, "red"); rect(x, y + 2, 5, 1, "red"); rect(x + 1, y + 3, 3, 1, "red"); dot(x + 2, y + 4, "red");
  }
  if (action === "butterfly") {
    const x = 35 + wave, y = 10 + beat * 3;
    rect(x, y, 1, 5, "ink"); oval(x - (beat ? 2 : 4), y, beat ? 2 : 4, 4, "eye"); oval(x + 1, y + 1, beat ? 2 : 4, 4, "blue");
  }
  if (action === "catch") { const y = frame < 4 ? 4 + frame * 5 : hy + 7; oval(frame < 4 ? 32 - frame : hx, y, 4, 4, "red"); dot(frame < 4 ? 33 - frame : hx + 1, y, "paper"); }
  if (action === "shake") { dot(4, 19 + frame, "blue"); dot(38, 16 + frame, "blue"); }
  if (action === "roll") {
    const source = Buffer.from(g.pixels), angle = frame / 7 * Math.PI * 2;
    g.pixels.fill(0);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const sx = Math.round(24 + (x - 24) * Math.cos(angle) + (y - 27) * Math.sin(angle));
      const sy = Math.round(27 - (x - 24) * Math.sin(angle) + (y - 27) * Math.cos(angle));
      if (sx >= 0 && sx < S && sy >= 0 && sy < S) source.copy(g.pixels, (y * S + x) * 4, (sy * S + sx) * 4, (sy * S + sx) * 4 + 4);
    }
  }
  // Portal poses physically reveal/occlude the body a column at a time.
  if (["emerge", "enter", "tail_in", "logo_in", "door_peek"].includes(action)) {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const hide = action === "emerge" ? x < 22 - frame * 3
        : action === "enter" ? x > 46 - frame * 4
        : action === "tail_in" ? x > 18 - frame * 2
        : action === "logo_in" ? x > 46 - frame * 5
        : y > 23 + frame * 2;
      if (hide) g.pixels.fill(0, (y * S + x) * 4, (y * S + x) * 4 + 4);
    }
  }
  return g.pixels;
}

// Scenes share the original cat poses; props are drawn behind/in front on the
// same 48px grid. Nearest-neighbour sampling keeps transparent pixels crisp.
function drawScene(action, frame) {
  const g = canvas(), { rect, line, poly, dot, oval } = g;
  const wave = Math.round(Math.sin(frame * Math.PI / 4) * 2), beat = frame % 4 < 2 ? 0 : 1;
  const cat = (pose, x = -2, y = 9, scale = .75) => {
    const source = drawCat(pose, frame), size = Math.round(S * scale);
    for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
      const src = (Math.floor(dy / scale) * S + Math.floor(dx / scale)) * 4;
      const xx = x + dx, yy = y + dy;
      if (source[src + 3] && xx >= 0 && xx < S && yy >= 0 && yy < S) source.copy(g.pixels, (yy * S + xx) * 4, src, src + 4);
    }
  };
  const paw = (x, y, xx, yy) => { line(x, y, xx, yy, "edge", 3); line(x, y, xx, yy, "ink", 2); };
  const table = () => { rect(8, 35, 36, 3, "wood"); rect(10, 38, 2, 7, "wood"); rect(40, 38, 2, 7, "wood"); line(9, 35, 43, 35, "crust"); };
  const star = (x, y, c = "gleam") => { line(x - 2, y, x + 2, y, c); line(x, y - 2, x, y + 2, c); };
  const steam = (x, y) => { for (let i = 0; i < 2; i++) line(x + i * 5, y - (frame + i * 2) % 5, x + i * 5 + beat, y - 3 - (frame + i * 2) % 5, "paper"); };
  const ball = (x, y) => { oval(x, y, 10, 10, "red"); line(x + 2, y + 2, x + 7, y + 6, "pink"); line(x + 2, y + 6, x + 6, y + 1, "pink"); line(x + 3, y + 8, x + 8, y + 4, "pink"); };
  switch (action) {
    case "phone": {
      rect(5, 35, 28, 8, "violet"); rect(7, 33, 24, 3, "pink"); cat("think", 0, 7);
      rect(23, 25, 10, 15, "edge"); rect(25, 27, 6, 10, "sky");
      rect(26, 28 + frame % 3, 4, 2, "cream"); rect(26, 33 + frame % 2, 3, 2, "mint"); dot(28, 38, "paper");
      paw(17, 33, 24 + beat, 31 - beat); paw(20, 36, 23, 37);
      if (frame > 3) { rect(35, 16 - beat, 8, 6, "mint"); dot(36, 22 - beat, "mint"); rect(37, 18 - beat, 4, 1, "cream"); }
      break;
    }
    case "noodles": {
      cat("talk", -4, 6); table();
      const lift = [0, 1, 3, 5, 6, 4, 2, 0][frame];
      poly([[25, 31], [42, 31], [39, 39], [28, 39]], "red"); oval(24, 29, 19, 5, "cream");
      line(28, 31, 38, 31, "crust"); dot(29, 30, "leaf"); dot(36, 32, "leaf");
      line(29, 29 - lift, 37, 26 - lift, "wood"); line(29, 31 - lift, 38, 28 - lift, "wood");
      for (let i = 0; i < 3; i++) line(30 + i * 2, 29 - lift, 31 + i, 31, "eye");
      if (frame === 4 || frame === 5) line(13, 27, 30, 29 - lift, "eye");
      paw(17, 29, 29, 29 - lift); steam(37, 25); break;
    }
    case "tea": {
      cat("purr", -4, 4); table();
      rect(33, 28, 7, 7, "mint"); oval(31, 29, 3, 4, "mint"); line(34, 27, 38, 27, "leaf");
      const lift = [0, 1, 3, 4, 4, 3, 1, 0][frame];
      oval(19, 35, 11, 2, "paper"); rect(21, 29 - lift, 7, 6, "cream"); rect(27, 30 - lift, 3, 3, "crust");
      line(22, 29 - lift, 26, 29 - lift, "wood"); paw(15, 30, 21, 32 - lift); steam(23, 26 - lift); break;
    }
    case "toast": {
      cat(frame === 3 || frame === 4 ? "surprise" : "sniff", -6, 5); table();
      const pop = [0, 0, 2, 10, 8, 4, 0, 0][frame];
      rect(28, 25 - pop, 10, 10, "crust"); oval(27, 22 - pop, 12, 7, "crust"); rect(30, 25 - pop, 6, 7, "cream");
      rect(26, 30, 16, 8, "sky"); line(28, 30, 39, 30, "edge"); rect(40, 33, 3, 2, "wood"); dot(38, 35, "red");
      if (pop > 4) { star(24, 18, "eye"); line(41, 20, 42, 17, "eye"); } break;
    }
    case "laptop": {
      cat("idle", -3, 4); table(); rect(23, 24, 19, 12, "blue"); rect(25, 26, 15, 8, "shade");
      for (let i = 0; i < 3; i++) rect(27, 27 + i * 2, 4 + (frame + i) % 6, 1, i === 1 ? "sky" : "mint");
      rect(17, 35, 25, 2, "paper"); paw(12, 30, 20, 34 + beat); paw(20, 31, 26, 35 - beat);
      rect(6, 33, 5, 3, "red"); break;
    }
    case "paint": {
      line(32, 15, 25, 44, "wood", 2); line(33, 15, 42, 44, "wood", 2);
      rect(25, 13, 18, 23, "crust"); rect(27, 15, 14, 18, "cream");
      oval(34, 18, 4, 4, "eye"); poly([[27, 32], [32, 23], [37, 32]], "mint"); poly([[32, 32], [38, 26], [41, 32]], "leaf");
      cat("idle", -5, 9); const y = 25 + wave;
      paw(15, 31, 24, y + 2); line(24, y + 2, 32, y, "wood"); dot(32, y, "red");
      oval(8, 36, 11, 5, "paper"); dot(11, 37, "red"); dot(14, 38, "sky"); dot(16, 37, "eye"); break;
    }
    case "piano": {
      cat("happy", -1, 5); rect(9, 31, 35, 8, "wood"); rect(10, 32, 33, 4, "cream");
      for (let x = 13; x < 42; x += 4) rect(x, 32, 2, 2, "ink");
      rect(11, 39, 2, 6, "wood"); rect(40, 39, 2, 6, "wood"); paw(13, 29, 19 + beat * 3, 34); paw(22, 29, 28 - beat * 3, 34);
      line(37, 15 - wave, 37, 21 - wave, "violet"); oval(34, 20 - wave, 4, 3, "violet"); line(37, 15 - wave, 41, 17 - wave, "violet"); break;
    }
    case "knit": {
      rect(7, 38, 25, 5, "paper"); cat("idle", -1, 8);
      rect(19, 32, 12, 11, "red"); for (let y = 34; y < 43; y += 3) line(20, y, 29, y, "pink");
      line(18, 28 + beat * 3, 31, 36 - beat * 3, "paper"); line(31, 28 + beat * 3, 18, 36 - beat * 3, "blue");
      paw(13, 31, 19, 32 + beat); paw(24, 31, 29, 33 - beat); ball(36, 34); line(30, 41, 38, 43, "red"); break;
    }
    case "yarn": {
      cat("paw_tap", -4, 8); const x = 29 + wave * 2;
      line(18, 44, 25, 41, "pink"); line(25, 41, x + 4, 43, "pink"); ball(x, 34);
      paw(19, 31, x - 2, 35 + beat); line(3, 45, 43, 45, "paper"); break;
    }
    case "box": {
      const rise = [7, 5, 2, 0, 0, 2, 5, 7][frame]; cat("look", 5, 4 + rise);
      rect(8, 31, 33, 14, "wood"); rect(10, 32, 29, 12, "crust"); line(24, 33, 24, 44, "wood");
      poly([[8, 31], [3, 26 + beat], [18, 28], [24, 33]], "paper"); poly([[24, 33], [30, 28], [45, 27 - beat], [41, 32]], "paper");
      rect(28, 36, 8, 5, "cream"); line(30, 38, 34, 38, "wood"); break;
    }
    case "bubbles": {
      cat("talk", -4, 9); line(21, 30, 28, 25, "wood"); oval(27, 21, 6, 6, "sky"); oval(28, 22, 4, 4, "cream"); paw(15, 32, 22, 29);
      for (let i = 0; i < 3; i++) { const t = (frame + i * 3) % 8, x = 30 + i * 3, y = 21 - t * 2; oval(x, y, 5 + i, 5 + i, "sky"); oval(x + 1, y + 1, 3 + i, 3 + i, "violet"); dot(x + 2, y + 1, "cream"); }
      rect(7, 38, 5, 6, "mint"); break;
    }
    case "toy_train": {
      oval(2, 33, 44, 13, "wood"); oval(4, 35, 40, 9, "paper"); cat("look", 3, -1);
      const x = 14 + wave * 5; rect(x, 35, 13, 7, "red"); rect(x + 8, 32, 5, 5, "red"); rect(x + 9, 33, 3, 2, "sky"); rect(x + 1, 33, 2, 3, "wood");
      oval(x + 1, 41, 4, 4, "edge"); oval(x + 9, 41, 4, 4, "edge"); dot(x + 2 + beat, 42, "paper"); dot(x + 10 - beat, 42, "paper"); steam(x + 1, 31); break;
    }
    case "garden": {
      cat("idle", -5, 9); rect(32, 37, 10, 7, "wood"); rect(30, 35, 14, 3, "crust"); line(37, 24, 37, 35, "leaf");
      oval(31, 28, 6, 3, "mint"); oval(37, 30, 6, 3, "leaf"); oval(33, 19, 8, 8, "pink"); rect(36, 22, 2, 2, "eye");
      rect(22, 29 + beat, 8, 7, "sky"); line(28, 31 + beat, 33, 28 + beat, "sky", 2); line(23, 28 + beat, 27, 28 + beat, "blue"); paw(16, 32, 23, 31 + beat);
      for (let i = 0; i < 3; i++) dot(33 + i, 29 + (frame + i * 2) % 6, "sky"); break;
    }
    case "rain": {
      oval(7, 42, 35, 4, "sky"); cat("idle", 0, 11, .65);
      line(26, 15, 26, 34, "wood"); line(26, 34, 23, 36, "wood");
      poly([[3, 18], [6, 12], [15, 7], [26, 5], [37, 9], [43, 18]], "red");
      poly([[16, 18], [19, 8], [26, 5], [31, 18]], "pink"); line(4, 18, 42, 18, "wood"); paw(17, 31, 25, 31);
      for (let i = 0; i < 7; i++) { const x = 2 + i * 7, y = (frame * 5 + i * 9) % 39; if (y < 6 || x < 5 || x > 39 || y > 36) line(x, y, x - 1, y + 3, "blue"); }
      line(29 - beat, 43, 34 + beat, 43, "cream"); break;
    }
    case "kite": {
      cat("wave", -4, 12, .65); const x = 34 + wave, y = 8 + beat;
      line(23, 30, x, y + 6, "paper"); poly([[x, y - 5], [x + 7, y], [x, y + 7], [x - 6, y]], "red"); poly([[x, y - 5], [x, y + 7], [x - 6, y]], "eye");
      line(x, y + 7, x + 2, y + 12, "wood"); line(x + 2, y + 12, x - wave, y + 17, "wood"); rect(x, y + 11, 4, 2, "sky");
      line(5, 44, 42, 44, "mint"); break;
    }
    case "skateboard": {
      cat("dance", 4, 6, .8); rect(9, 38, 32, 3, "violet"); rect(7, 36, 3, 3, "violet"); rect(40, 36, 3, 3, "violet");
      oval(12, 41, 5, 5, "edge"); oval(34, 41, 5, 5, "edge"); dot(14 + beat, 43, "cream"); dot(36 - beat, 43, "cream");
      line(1, 31 + beat * 2, 6, 31 + beat * 2, "blue"); line(2 + frame % 3, 44, 8 + frame % 3, 44, "blue"); break;
    }
    case "fishing": {
      rect(0, 40, 23, 3, "wood"); rect(4, 43, 2, 4, "wood"); rect(23, 42, 24, 5, "sky"); cat("idle", -6, 7);
      line(20, 30, 32, 10, "wood"); line(32, 10, 40, 14, "paper"); line(40, 14, 40, 38 + beat, "paper");
      rect(39, 37 + beat, 3, 3, "red"); line(36 - beat, 42, 44 + beat, 42, "cream"); paw(16, 32, 22, 27);
      const x = 26 + wave * 2; oval(x, 44, 6, 3, "blue"); dot(x + 4, 44, "ink"); break;
    }
    case "camp": {
      poly([[1, 35], [13, 12], [29, 35]], "mint"); poly([[9, 35], [13, 17], [20, 35]], "leaf");
      cat("purr", -3, 9); line(31, 43, 43, 40, "wood", 2); line(32, 40, 42, 44, "wood", 2);
      poly([[30, 40], [33, 31 - beat * 2], [36, 35], [39, 27 + wave], [43, 40]], "red"); poly([[34, 40], [37, 33 - beat], [40, 40]], "eye");
      line(19, 31, 36, 28 + beat, "wood"); rect(33, 25 + beat, 5, 4, "cream"); paw(16, 32, 22, 31); star(35, 8, "paper"); break;
    }
    case "telescope": {
      oval(4, 3, 7, 7, "cream"); oval(7, 2, 6, 6, "blue"); star(33, 5 + beat, "eye"); star(18, 8, "paper"); dot(43, 13, "paper");
      cat("look", -4, 11); line(32, 30, 25, 44, "wood", 2); line(32, 30, 40, 44, "wood", 2);
      line(25, 28, 39, 18, "edge", 5); line(26, 27, 38, 19, "sky", 3); line(38, 16, 42, 21, "blue", 2); paw(19, 33, 29, 30);
      if (frame > 4) line(30 + frame, 10, 33 + frame, 8, "cream"); break;
    }
    case "astronaut": {
      star(5, 8, "sky"); star(41, 20 + beat, "eye"); oval(31, 35, 15, 9, "violet"); line(28, 41, 46, 36, "pink");
      const y = 2 + wave; oval(8, 9 + y, 24, 24, "sky"); oval(10, 11 + y, 20, 20, "blue");
      cat("air", 3, 10 + y, .7); rect(17, 32 + y, 10, 5, "paper"); rect(20, 33 + y, 3, 2, "red");
      line(10, 18 + y, 10, 23 + y, "cream"); line(13, 12 + y, 18, 12 + y, "cream"); line(27, 36 + y, 35, 31 + y, "paper"); line(35, 31 + y, 44, 33, "paper"); break;
    }
    case "magic": {
      cat("wave", -4, 9); rect(28, 35, 15, 9, "shade"); rect(25, 34, 21, 3, "edge"); rect(29, 37, 13, 2, "violet");
      line(22, 26, 32, 20 + wave, "paper"); line(29, 22 + wave, 32, 20 + wave, "eye");
      if (frame >= 2 && frame <= 6) { const y = 31 - [0, 0, 0, 5, 8, 5, 0, 0][frame]; oval(32, y, 8, 6, "cream"); rect(33, y - 6, 2, 7, "cream"); rect(37, y - 7, 2, 8, "cream"); dot(37, y + 2, "red"); }
      star(39, 17 + beat, "eye"); star(26, 11 - beat, "violet"); break;
    }
    case "dj": {
      cat("happy", 2, 4); line(12, 17, 12, 23, "violet", 3); line(29, 17, 29, 23, "violet", 3); line(12, 17, 17, 12, "violet", 2); line(17, 12, 25, 12, "violet", 2);
      rect(5, 32, 39, 12, "shade"); oval(8, 34, 12, 8, "blue"); oval(29, 34, 12, 8, "blue"); oval(11, 36, 6, 4, "ink"); oval(32, 36, 6, 4, "ink");
      dot(14 + wave, 37 + beat, "cream"); dot(35 - wave, 37 - beat, "cream"); rect(23, 35, 2, 6, "paper"); rect(22, 36 + beat * 2, 4, 1, "red");
      paw(15, 29, 15 + wave, 36); paw(26, 29, 34 - wave, 36); star(39, 10 + beat, "pink"); break;
    }
    case "hammock": {
      line(4, 12, 4, 45, "wood", 2); line(43, 12, 43, 45, "wood", 2); oval(0, 6, 13, 9, "mint"); oval(36, 5, 12, 10, "leaf");
      const sway = wave; line(5, 22, 11, 34 + sway, "paper"); line(43, 22, 38, 34 + sway, "paper");
      cat("sleep", 7, 7 + sway, .75); poly([[7, 30 + sway], [22, 38 + sway], [40, 30 + sway], [34, 41 + sway], [17, 41 + sway]], "mint");
      line(13, 35 + sway, 22, 39 + sway, "cream"); line(22, 39 + sway, 35, 35 + sway, "cream"); break;
    }
    case "snowglobe": {
      cat("idle", -5, 9); const x = 27 + wave;
      oval(x, 22, 17, 17, "sky"); oval(x + 2, 24, 13, 13, "blue");
      poly([[x + 4, 35], [x + 8, 27], [x + 12, 35]], "leaf"); rect(x + 7, 34, 2, 3, "wood");
      for (let i = 0; i < 5; i++) dot(x + 3 + i * 2, 25 + (frame + i * 3) % 10, "cream");
      line(x + 3, 26, x + 3, 29, "cream"); rect(x + 1, 38, 15, 5, "wood"); line(x + 3, 39, x + 14, 39, "crust"); paw(16, 32, x, 35); break;
    }
  }
  return g.pixels;
}

function drawDoor(frame) {
  const { pixels, rect, line } = canvas();
  rect(11, 9, 26, 36, "edge"); rect(13, 7, 22, 38, "edge");
  rect(14, 10, 20, 32, "ink"); rect(10, 43, 28, 3, "blue");
  line(13, 9, 34, 9, "paper"); line(12, 11, 12, 42, "blue");
  const width = Math.max(3, 20 - frame * 3);
  rect(14, 11, width, 31, "shade"); line(14 + width - 1, 11, 14 + width - 1, 42, "blue");
  if (width > 5) rect(14 + width - 4, 27, 2, 2, "eye");
  return pixels;
}

async function writeSheet(name, rows, draw) {
  const sheet = Buffer.alloc(S * N * S * rows * 4);
  for (let row = 0; row < rows; row++) for (let frame = 0; frame < N; frame++) {
    const pixels = draw(row, frame);
    for (let y = 0; y < S; y++) pixels.copy(sheet, ((row * S + y) * S * N + frame * S) * 4, y * S * 4, (y + 1) * S * 4);
  }
  await sharp(sheet, { raw: { width: S * N, height: S * rows, channels: 4 } }).png().toFile(fileURLToPath(new URL(`../public/pixel-cat/${name}.png`, import.meta.url)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(new URL("../public/pixel-cat/", import.meta.url), { recursive: true });
  await writeSheet("cat", ACTIONS.length, (row, frame) => drawCat(ACTIONS[row].id, frame));
  await writeSheet("door", 1, (_, frame) => drawDoor(frame));
  await sharp(drawCat("idle", 0), { raw: { width: S, height: S, channels: 4 } }).resize(192, 192, { kernel: "nearest" }).png().toFile(fileURLToPath(new URL("../public/pixel-cat/preview.png", import.meta.url)));
  await writeFile(new URL("../public/pixel-cat/README.md", import.meta.url), `Original 13log pixel cat. ${ACTIONS.length} actions × 8 frames, 48×48 px; door: 8 frames.\nRegenerate: node scripts/generate-pixel-cat.mjs\nPalette and editable poses are in the generator; action order and timing are in lib/pixel-cat/catalog.mjs.\n`);
  console.log(`Generated ${ACTIONS.length * N} cat frames and ${N} door frames.`);
}
