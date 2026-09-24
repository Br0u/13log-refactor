"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, BookOpen, House, Moon, Square, Volume2, X } from "lucide-react";
import PixelSprite from "./PixelSprite";
import { BEHAVIORS, AMBIENT_BEHAVIORS, ACTION_META, localCommand, clampPosition, storageGet, storageSet } from "../../lib/pixel-cat/catalog.mjs";
import { collectPageContext, waitForCat } from "./page-context";
import { readCatReply } from "../../lib/pixel-cat/stream.mjs";

const SIZE = 96;
const WELCOME = "喵，我出来啦。拖着我走，或点我聊聊。";

export default function PixelCat() {
  const pathname = usePathname();
  const [phase, setPhase] = useState("hidden");
  const [action, setAction] = useState("idle");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState(1);
  const [portal, setPortal] = useState(null);
  const [panel, setPanel] = useState(false);
  const [say, setSay] = useState(WELCOME);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [panelHeight, setPanelHeight] = useState(240);
  const [, refreshViewport] = useState(0);
  const [settings, setSettings] = useState({ available: false, proactiveSeconds: 0 });
  const actor = useRef(null);
  const handle = useRef(null);
  const panelElement = useRef(null);
  const conversation = useRef(null);
  const followReply = useRef(true);
  const phaseRef = useRef("hidden");
  const pos = useRef(position);
  const path = useRef(pathname);
  const sequence = useRef(null);
  const highlighted = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const history = useRef([]);
  const lastInteraction = useRef(Date.now());
  const lastProactive = useRef(Date.now());
  const pending = useRef(false);
  const reduced = useRef(false);
  const pointerPosition = useRef(null);
  const api = useRef({});
  const motion = useRef(null);
  const moving = useRef(false);
  const performing = useRef(false);
  const facingRef = useRef(1);
  const panelOpen = useRef(panel);
  const resting = useRef("idle");
  const lastBehavior = useRef("");
  const replyHidden = useRef(false);
  panelOpen.current = panel;
  const face = value => { facingRef.current = value; setFacing(value); };
  const viewport = () => ({ width: window.visualViewport?.width || window.innerWidth, height: window.visualViewport?.height || window.innerHeight });
  const changePhase = next => { phaseRef.current = next; setPhase(next); };
  const clearHighlight = () => { highlighted.current?.classList.remove("pixel-cat-target"); highlighted.current = null; };
  const place = point => {
    const { width, height } = viewport();
    const target = clampPosition(point, width, height);
    pos.current = target; setPosition(target);
  };
  const stop = () => {
    const rect = actor.current?.getBoundingClientRect();
    sequence.current?.abort();
    motion.current?.cancel(); motion.current = null; moving.current = false; performing.current = false;
    if (rect) place({ x: rect.left, y: rect.top });
    clearHighlight();
    pending.current = false; setBusy(false); setStreaming(false);
    const controller = new AbortController();
    sequence.current = controller;
    return controller.signal;
  };
  const delay = (time, signal) => waitForCat(reduced.current ? Math.min(time, 80) : time, signal);
  const move = async (point, signal, type = "walk", arc = 0) => {
    if (signal.aborted) return false;
    const { width, height } = viewport();
    const origin = { ...pos.current }, target = clampPosition(point, width, height);
    const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
    const cycle = ACTION_META[type]?.cycle || 800;
    const speed = ["run", "chase"].includes(type) ? 220 : type === "sneak" ? 65 : 130;
    const time = arc ? 800 : Math.min(3600, Math.max(320, Math.round(distance / speed * 1000 / cycle) * cycle));
    setAction(type);
    if (Math.abs(target.x - origin.x) > 3) face(target.x > origin.x ? 1 : -1);
    if (reduced.current || !actor.current?.animate) { place(target); return delay(time, signal); }
    const frameCount = arc ? 25 : 2;
    const keyframes = Array.from({ length: frameCount }, (_, index) => {
      const t = index / (frameCount - 1);
      return { transform: `translate(${Math.round(origin.x + (target.x - origin.x) * t)}px, ${Math.round(origin.y + (target.y - origin.y) * t - 4 * arc * t * (1 - t))}px)` };
    });
    const animation = actor.current.animate(keyframes, { duration: time, easing: "linear", fill: "forwards" });
    motion.current = animation; moving.current = true;
    const cancel = () => animation.cancel();
    signal.addEventListener("abort", cancel, { once: true });
    try {
      await animation.finished;
      if (signal.aborted) return false;
      actor.current.style.transform = `translate(${target.x}px, ${target.y}px)`;
      place(target); animation.cancel(); return true;
    } catch { return false; }
    finally {
      signal.removeEventListener("abort", cancel);
      if (motion.current === animation) { motion.current = null; moving.current = false; }
    }
  };

  async function jump(signal, small = false) {
    setAction("crouch");
    if (!await delay(ACTION_META.crouch.cycle, signal)) return false;
    const origin = pos.current;
    const { width } = viewport();
    const direction = origin.x + facingRef.current * 64 > width - SIZE || origin.x + facingRef.current * 64 < 0 ? -facingRef.current : facingRef.current;
    if (!await move({ x: origin.x + direction * (small ? 28 : 64), y: origin.y }, signal, "air", Math.min(origin.y, small ? 28 : 60))) return false;
    setAction("land");
    return delay(ACTION_META.land.cycle, signal);
  }
  const entrance = () => {
    const element = document.querySelector(path.current === "/" ? "[data-cat-home]" : "[data-cat-logo]");
    const rect = element?.getBoundingClientRect();
    const home = path.current === "/";
    const raw = rect ? { x: rect.left + rect.width / 2 - SIZE / 2, y: home ? rect.top + rect.height * .7 - SIZE : rect.top + rect.height / 2 - SIZE / 2 } : { x: 16, y: 8 };
    const { width, height } = viewport();
    return { ...clampPosition(raw, width, height), home, offscreen: Boolean(rect && (rect.bottom < 0 || rect.top > height)) };
  };

  async function summon() {
    if (["entering", "returning"].includes(phaseRef.current)) return;
    const signal = stop();
    lastInteraction.current = Date.now();
    const home = entrance();
    if (phaseRef.current === "active") {
      if (await move({ x: home.x + 70, y: home.y + 35 }, signal)) { setAction("wave"); setSay("在呢。你一叫，我就过来。 "); setPanel(true); }
      return;
    }
    changePhase("entering"); storageSet(true); face(1); place(home);
    setPortal({ ...home, closing: false }); setAction("door_peek");
    if (!await delay(960, signal)) return;
    setAction("emerge");
    if (!await delay(960, signal)) return;
    setPortal({ ...home, closing: true });
    if (!await move({ x: home.x + 160, y: home.y + 100 }, signal, "fall")) return;
    setAction("land");
    if (!await delay(560, signal)) return;
    setPortal(null); changePhase("active"); setAction("wave"); setSay(WELCOME); setPanel(true);
  }

  async function goHome() {
    if (phaseRef.current !== "active") return;
    const signal = stop();
    changePhase("returning"); storageSet(false); setPanel(false); drag.current = null;
    const home = entrance();
    // A viewport-edge transition avoids scrolling the reader back to an offscreen anchor.
    if (!await move({ x: home.x + (home.home ? 44 : 56), y: home.y + 24 }, signal)) return;
    if (home.home) {
      setPortal({ ...home, closing: false });
      if (!await delay(560, signal)) return;
    }
    if (!await move(home, signal, "climb")) return;
    face(-1); setAction(home.home ? "enter" : "logo_in");
    if (!await delay(960, signal)) return;
    setAction("tail_in");
    if (!await delay(960, signal)) return;
    if (home.home) {
      setPortal({ ...home, closing: true });
      if (!await delay(560, signal)) return;
    }
    setPortal(null); changePhase("hidden");
    const target = document.querySelector(home.home ? "[data-cat-home]" : "[data-cat-logo]");
    target?.focus({ preventScroll: true });
  }

  async function play(actions, signal, targets = new Map(), stationary = false, rest = "idle") {
    performing.current = true;
    try {
      for (let index = 0; index < actions.length; index++) {
        if (signal.aborted) return;
        const step = actions[index], type = typeof step === "string" ? step : step.type;
        const next = actions[index + 1];
        if (type === "crouch" && (next === "jump" || next?.type === "jump")) continue;
        const target = targets.get(step.target);
        if (step.target && !target?.isConnected) continue;
        if (target?.isConnected) {
          const rect = target.getBoundingClientRect();
          if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
          clearHighlight(); highlighted.current = target; target.classList.add("pixel-cat-target");
          if (!stationary && !await move({ x: rect.right - SIZE / 2, y: rect.top - SIZE + 12 }, signal)) return;
        }
        if (!stationary && ["jump", "hop"].includes(type)) {
          if (!await jump(signal, type === "hop")) return;
          continue;
        }
        if (!stationary && (type === "chase" && pointerPosition.current || ["walk", "run", "sneak"].includes(type))) {
          const point = type === "chase" ? { x: pointerPosition.current.x - 48, y: pointerPosition.current.y - 70 } : { x: pos.current.x + (pos.current.x > viewport().width / 2 ? -100 : 100), y: pos.current.y };
          if (!await move(point, signal, type)) return;
          if (["run", "chase"].includes(type)) { setAction("brake"); if (!await delay(ACTION_META.brake.cycle, signal)) return; }
          continue;
        }
        const pose = type === "walk_to" ? "point" : stationary && ["walk", "run", "sneak", "chase", "jump", "hop"].includes(type) ? "tail" : type;
        setAction(pose);
        if (!await delay(ACTION_META[pose]?.duration || 1200, signal)) return;
      }
      if (!signal.aborted) { clearHighlight(); setAction(rest); }
    } finally { if (!signal.aborted) performing.current = false; }
  }

  function commandLocally(command) {
    if (command.kind === "home") { void goHome(); return; }
    if (command.kind === "read") { explore(); return; }
    const signal = stop(); lastInteraction.current = Date.now();
    setPanel(false);
    if (command.kind === "quiet") { setQuiet(true); resting.current = "sit"; setAction("sit"); return; }
    if (command.kind === "resume") { setQuiet(false); resting.current = "idle"; void play(["wake", "stretch"], signal); return; }
    setQuiet(command.rest === "sleep"); resting.current = command.rest || "idle";
    void play(command.actions, signal, new Map(), false, resting.current);
  }

  async function ask(message, proactive = false) {
    if (phaseRef.current !== "active") return;
    const command = !proactive && localCommand(message);
    if (command) { commandLocally(command); return; }
    if (proactive && pending.current) return;
    followReply.current = true;
    if (!proactive) lastInteraction.current = Date.now();
    if (!settings.available) {
      stop();
      setSay("我先陪你逛逛。走走、玩耍，或一起看看这页。 "); setAction("tilt"); setPanel(true); return;
    }
    const signal = stop();
    replyHidden.current = false;
    pending.current = true; setBusy(true); setAction("think");
    if (!proactive) { setPanel(true); setSay("让我想一想……"); }
    const { context, targets } = collectPageContext(path.current);
    context.selection = selectedText || context.selection;
    const reading = proactive || context.selection || /文章|这页|页面|内容|选中|解释|总结|这里|链接|照片|图片|这段|刚才|继续/.test(message);
    if (!reading) { context.excerpt = ""; context.anchors = []; }
    else { context.excerpt = context.excerpt.slice(0, 3000); context.anchors = context.anchors.slice(0, 6); }
    let partial = "";
    try {
      const response = await fetch("/api/cat", { method: "POST", headers: { "content-type": "application/json", accept: "text/event-stream" }, signal, body: JSON.stringify({ message, proactive, context, history: history.current.slice(-6) }) });
      const result = await readCatReply(response, text => {
        if (signal.aborted) return;
        partial = text; setSay(text); setStreaming(true); if (!replyHidden.current) setPanel(true); setAction("talk");
      });
      if (signal.aborted) return;
      if (result.say) {
        setSay(result.say); if (!replyHidden.current) setPanel(true);
        if (!proactive) history.current = [...history.current, { role: "user", content: message }, { role: "assistant", content: result.say }].slice(-6);
      } else if (!proactive) { setSay(""); setPanel(false); }
      pending.current = false; setBusy(false); setStreaming(false);
      await play(result.actions, signal, targets, Boolean(result.say), resting.current);
    } catch (error) {
      if (!signal.aborted) { setAction("tilt"); if (!proactive) setSay(partial ? `${partial}\n\n刚才断了一下，可以接着问我。` : error.message); }
    } finally {
      if (!signal.aborted) { pending.current = false; setBusy(false); setStreaming(false); }
    }
  }

  function explore() {
    const signal = stop(); lastInteraction.current = Date.now();
    const { targets } = collectPageContext(path.current);
    const visible = [...targets.entries()].find(([, element]) => { const r = element.getBoundingClientRect(); return r.top >= 90 && r.bottom < window.innerHeight; });
    void play(visible ? [{ type: "walk_to", target: visible[0] }, "read", "point", "think"] : BEHAVIORS[0].actions, signal, targets);
    setSay("我在这里陪你看。想聊内容，随时叫我。 "); setPanel(false);
  }
  api.current = { summon, goHome, ask, explore, stop, play };

  useEffect(() => {
    if (panel && followReply.current && conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [panel, say]);

  useEffect(() => {
    if (!panel || !panelElement.current) return;
    const measure = () => setPanelHeight(panelElement.current?.offsetHeight || 240);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panelElement.current);
    return () => observer.disconnect();
  }, [panel]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => { reduced.current = query.matches; };
    motion(); query.addEventListener("change", motion);
    const onSummon = () => void api.current.summon();
    const visualResize = () => refreshViewport(value => value + 1);
    const resize = () => {
      if (panelOpen.current) { place(pos.current); visualResize(); return; }
      drag.current = null;
      const wasTransition = ["entering", "returning"].includes(phaseRef.current);
      api.current.stop(); setPortal(null);
      if (wasTransition) changePhase(storageGet() ? "active" : "hidden");
      place(pos.current); setAction("idle");
    };
    const visibility = () => { setPaused(document.hidden); if (document.hidden && phaseRef.current === "active") { api.current.stop(); setAction("idle"); } };
    let scrollFrame = 0;
    const scroll = () => {
      if (scrollFrame || phaseRef.current === "hidden") return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0; lastInteraction.current = Date.now();
        if (["entering", "returning"].includes(phaseRef.current)) resize();
        else if (!pending.current && highlighted.current) { api.current.stop(); setAction("idle"); }
      });
    };
    const pointer = event => {
      pointerPosition.current = { x: event.clientX, y: event.clientY };
      const dx = event.clientX - pos.current.x - SIZE / 2;
      if (event.pointerType !== "touch" && phaseRef.current === "active" && !drag.current && !pending.current && !performing.current && !moving.current && !panelOpen.current && Math.abs(dx) > 32 && Math.abs(dx) < 220) face(dx > 0 ? 1 : -1);
    };
    const selectionChanged = () => {
      if (phaseRef.current !== "active" || path.current.startsWith("/admin")) return;
      const { context } = collectPageContext(path.current);
      if (context.selection) setSelectedText(context.selection);
    };
    window.addEventListener("pixel-cat:summon", onSummon);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", scroll, { passive: true });
    window.visualViewport?.addEventListener("resize", visualResize);
    window.visualViewport?.addEventListener("scroll", visualResize);
    window.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("selectionchange", selectionChanged);
    return () => {
      sequence.current?.abort(); motion.current?.cancel(); clearHighlight(); query.removeEventListener("change", motion);
      window.removeEventListener("pixel-cat:summon", onSummon); window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scroll); cancelAnimationFrame(scrollFrame);
      window.visualViewport?.removeEventListener("resize", visualResize);
      window.visualViewport?.removeEventListener("scroll", visualResize);
      window.removeEventListener("pointermove", pointer); document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("selectionchange", selectionChanged);
    };
  }, []);

  useEffect(() => {
    path.current = pathname;
    api.current.stop(); setPortal(null); setPanel(false); setAction("idle"); setSelectedText(""); history.current = []; drag.current = null;
    if (pathname.startsWith("/admin")) { changePhase("hidden"); return; }
    if (storageGet()) { changePhase("active"); place({ x: window.innerWidth - 130, y: window.innerHeight - 160 }); }
    else changePhase("hidden");
    const controller = new AbortController();
    fetch("/api/cat", { signal: controller.signal }).then(r => r.json()).then(setSettings).catch(() => {});
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(() => {
      if (document.hidden || drag.current || pending.current || performing.current || panel || Date.now() - lastInteraction.current < 16000) return;
      if (!quiet && settings.available && settings.proactiveSeconds && Date.now() - lastProactive.current > settings.proactiveSeconds * 1000) {
        lastProactive.current = Date.now(); void api.current.ask("", true); return;
      }
      if (!quiet && !reduced.current) {
        lastInteraction.current = Date.now();
        const candidates = AMBIENT_BEHAVIORS.filter(item => item.id !== lastBehavior.current);
        const behavior = candidates[Math.floor(Math.random() * candidates.length)];
        lastBehavior.current = behavior.id;
        void api.current.play(behavior.actions, api.current.stop());
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [phase, panel, quiet, settings]);

  useEffect(() => {
    if (!busy || streaming || reduced.current) return;
    const poses = ["ear_twitch", "think", "blink", "look"];
    let index = 0;
    const timer = setInterval(() => setAction(poses[index++ % poses.length]), 2000);
    return () => clearInterval(timer);
  }, [busy, streaming]);

  function dragStart(event) {
    if (phaseRef.current !== "active" || (event.pointerType === "mouse" && event.button !== 0)) return;
    const replying = pending.current;
    if (!replying) stop();
    lastInteraction.current = Date.now();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, start: { ...pos.current }, moved: false, replying };
    if (!replying) setAction("held");
  }
  function dragMove(event) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
    if (drag.current.moved) {
      if (drag.current.replying) { stop(); drag.current.replying = false; }
      setPanel(false); setAction(Math.abs(dx) > 120 ? "struggle" : "held"); place({ x: drag.current.start.x + dx, y: drag.current.start.y + dy });
    }
  }
  function dragEnd(event) {
    if (!drag.current) return;
    const keepReplying = drag.current.replying && !drag.current.moved;
    suppressClick.current = drag.current.moved; drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (keepReplying) return;
    const signal = stop();
    void play(["land", "happy"], signal);
  }
  const closePanel = () => { replyHidden.current = true; setPanel(false); handle.current?.focus({ preventScroll: true }); };
  if (pathname.startsWith("/admin") || phase === "hidden") return null;
  const { width, height } = typeof window === "undefined" ? { width: 1000, height: 800 } : viewport();
  const viewportLeft = typeof window === "undefined" ? 0 : window.visualViewport?.offsetLeft || 0;
  const viewportTop = typeof window === "undefined" ? 0 : window.visualViewport?.offsetTop || 0;
  const panelWidth = Math.min(304, width - 24);
  const panelX = Math.max(viewportLeft + 12, Math.min(viewportLeft + width - panelWidth - 12, position.x + SIZE / 2 - panelWidth / 2));
  const panelY = Math.max(viewportTop + 12, Math.min(viewportTop + height - panelHeight - 12, position.y > viewportTop + panelHeight + 12 ? position.y - panelHeight - 12 : position.y + SIZE));
  return <div className="pixel-cat-layer" data-phase={phase} data-action={action}>
    {portal && <div aria-hidden="true" className="pixel-cat-door" data-closing={portal.closing} style={{ left: portal.x, top: portal.y }} />}
    <div ref={actor} className="pixel-cat-actor" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <button ref={handle} type="button" className="pixel-cat-handle" aria-label="黑色小猫，点击聊天或拖动" aria-expanded={panel} disabled={phase !== "active"}
        onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
        onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } lastInteraction.current = Date.now(); setPanel(value => { replyHidden.current = value; return !value; }); }}>
        <PixelSprite action={action} facing={facing} paused={paused} />
      </button>
    </div>
    {panel && phase === "active" && <section ref={panelElement} className="pixel-cat-panel" aria-label="和小猫聊天" style={{ left: panelX, top: panelY, width: panelWidth, maxHeight: Math.max(0, height - 24) }} onKeyDown={event => { if (event.key === "Escape" && !event.nativeEvent.isComposing) closePanel(); }}>
      <button className="pixel-cat-close" type="button" onClick={closePanel} aria-label="收起聊天" title="收起聊天"><X size={14} aria-hidden="true" /></button>
      <div ref={conversation} className="pixel-cat-conversation" onScroll={event => { const el = event.currentTarget; followReply.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24; }}>
        <p className="pixel-cat-speech" role="status" aria-live="polite">{say}</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); if (input.trim()) { void ask(input.trim()); setInput(""); } }}>
        <textarea aria-label="对小猫说" placeholder="说点什么…" rows={1} value={input} onChange={event => setInput(event.target.value)} maxLength={800} onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            if (input.trim()) event.currentTarget.form.requestSubmit();
          }
        }} />
        <button className="pixel-cat-send" aria-label={busy && !input.trim() ? "停止回答" : "发送"} title={busy && !input.trim() ? "停止回答" : "发送"} disabled={!busy && !input.trim()} type={busy && !input.trim() ? "button" : "submit"} onClick={() => { if (busy && !input.trim()) { stop(); setAction("idle"); if (!streaming) setSay("先歇一会儿。"); } }}>{busy && !input.trim() ? <Square size={12} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}</button>
      </form>
      <div className="pixel-cat-tools" role="group" aria-label="小猫操作">
        <button type="button" aria-label="陪我看这页" title="陪我看这页" onClick={explore}><BookOpen size={15} aria-hidden="true" />读这页</button>
        <button type="button" aria-label={quiet ? "可以玩啦" : "安静一会儿"} title={quiet ? "可以玩啦" : "安静一会儿"} onClick={() => { const next = !quiet; setQuiet(next); if (next) { stop(); setAction("sit"); } }} aria-pressed={quiet}>{quiet ? <Volume2 size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}{quiet ? "继续" : "安静"}</button>
        {selectedText && <button type="button" aria-label="解释选中文字" disabled={busy} onClick={() => void ask("请解释我选中的这段文字。")}>解释选中</button>}
        <button type="button" aria-label="回家" title="回家" onClick={() => void goHome()}><House size={15} aria-hidden="true" />回家</button>
      </div>
    </section>}
  </div>;
}
