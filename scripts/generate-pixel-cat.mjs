// Original 48px artwork. Every pose is rasterized on an integer grid; no smoothing.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ACTIONS, FRAME_SIZE as S, FRAME_COUNT as N } from "../lib/pixel-cat/catalog.mjs";

const C = { ink: [23, 23, 29, 255], edge: [72, 68, 83, 255], shade: [35, 34, 43, 255], eye: [247, 199, 57, 255], gleam: [255, 239, 164, 255], red: [226, 76, 91, 255], blue: [129, 153, 172, 255], paper: [222, 212, 185, 255] };

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
