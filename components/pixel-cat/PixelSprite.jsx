import React from "react";
import { ACTIONS } from "../../lib/pixel-cat/catalog.mjs";

export default function PixelSprite({ action = "idle", size = 96, facing = 1, paused = false, frame = null }) {
  const row = Math.max(0, ACTIONS.findIndex((item) => item.id === action));
  const motion = ACTIONS[row];
  return <span key={action} aria-hidden="true" className="pixel-cat-sprite" style={{
    "--sprite-size": `${size}px`, "--sprite-row": row, "--sprite-rows": ACTIONS.length,
    animationName: motion.loop ? "cat-frames" : "cat-once",
    animationDuration: `${motion.cycle}ms`, animationIterationCount: motion.loop ? "infinite" : 1,
    animationTimingFunction: `steps(${motion.loop ? 8 : 7})`,
    transform: `scaleX(${facing})`,
    animationPlayState: paused ? "paused" : "running",
    ...(frame === null ? {} : { animation: "none", backgroundPositionX: `${-frame * size}px` }),
  }} />;
}
