"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PixelSprite from "./PixelSprite";
import { ACTION_GROUPS, ACTIONS, ACTION_META, BEHAVIORS, SCENE_GROUPS, SCENE_IDS } from "../../lib/pixel-cat/catalog.mjs";

export default function CatGallery() {
  const [action, setAction] = useState("phone");
  const [scenesOnly, setScenesOnly] = useState(true);
  const [behavior, setBehavior] = useState(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [facing, setFacing] = useState(1);
  const [frame, setFrame] = useState(null);
  const [night, setNight] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (!behavior || paused || frame !== null) return;
    setAction(behavior.actions[step % behavior.actions.length]);
    const timer = setTimeout(() => setStep(value => value + 1), ACTION_META[behavior.actions[step % behavior.actions.length]].duration);
    return () => clearTimeout(timer);
  }, [behavior, step, paused, frame]);
  const label = ACTIONS.find(item => item.id === action)?.label;
  return <div className="cat-gallery">
    <header><p className="cat-gallery-kicker">A SMALL COMPANION</p><h1>小猫的排练室</h1><p>黄眼睛，红嘴巴。{ACTIONS.length} 个动作与场景，{ACTIONS.length * 8} 帧像素，{BEHAVIORS.length} 组连续行为。</p><p>新添 {SCENE_IDS.length} 个小场景，从一碗热面到一趟太空旅行。对小猫说「玩手机」「吃面条」「玩毛线球」，它就会演给你看。</p></header>
    <div className="cat-stage" data-scene={SCENE_IDS.includes(action)} style={night ? { backgroundColor: "#20232a", "--secondary": "#b4bdc9" } : {}}>
      <PixelSprite key={`${replay}-${step}`} action={action} size={192} facing={facing} paused={paused} frame={frame} />
      <span className="cat-stage-caption">{behavior ? `${behavior.label} · ` : ""}{label} / {frame === null ? "48 × 48 → 4×" : `FRAME ${frame + 1} / 8`}</span>
    </div>
    <div className="cat-gallery-toolbar">
      <button type="button" aria-pressed={paused} onClick={() => { setPaused(!paused); setFrame(null); }}>{paused ? "播放" : "暂停"}</button>
      <button type="button" onClick={() => { setReplay(value => value + 1); setStep(0); setPaused(false); setFrame(null); }}>重播</button>
      <button type="button" onClick={() => { setPaused(true); setFrame(value => ((value ?? -1) + 1) % 8); }}>逐帧查看</button>
      <button type="button" onClick={() => setFacing(value => -value)}>换个朝向</button>
      <button type="button" aria-pressed={night} onClick={() => setNight(!night)}>深色背景</button>
      <Link href="/">去首页叫它出门 ↗</Link>
    </div>
    <h2>连续行为</h2>
    <div className="cat-gallery-toolbar">{BEHAVIORS.map(item => <button key={item.id} type="button" aria-pressed={behavior?.id === item.id} onClick={() => { setBehavior(item); setStep(0); setPaused(false); setFrame(null); }}>{item.label}</button>)}</div>
    <div className="cat-gallery-toolbar" role="group" aria-label="素材分类">
      <button type="button" aria-pressed={scenesOnly} onClick={() => setScenesOnly(true)}>场景剧场 · {SCENE_IDS.length}</button>
      <button type="button" aria-pressed={!scenesOnly} onClick={() => setScenesOnly(false)}>全部素材 · {ACTIONS.length}</button>
    </div>
    {(scenesOnly ? SCENE_GROUPS : ACTION_GROUPS).map(([group, entries]) => <section key={group}>
      <h2>{group} <small className="cat-gallery-kicker">/ {entries.length}</small></h2>
      <div className="cat-action-grid">{entries.map(([id, name]) => <button key={id} type="button" aria-pressed={action === id} onClick={() => { setBehavior(null); setAction(id); setReplay(value => value + 1); setFrame(null); }}>
        <PixelSprite action={id} paused={paused} /><span>{name}</span><small>{id}</small>
      </button>)}</div>
    </section>)}
  </div>;
}
