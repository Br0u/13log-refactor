"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";

const MAX_DROPS = 46;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createDrop(id) {
  const duration = Math.round(randomBetween(1450, 3100));

  return {
    id,
    x: randomBetween(-4, 104).toFixed(2),
    fall: randomBetween(92, 124).toFixed(2),
    drift: randomBetween(-3.2, 4.8).toFixed(2),
    length: randomBetween(1.3, 3.8).toFixed(2),
    width: randomBetween(0.035, 0.075).toFixed(3),
    angle: randomBetween(8, 18).toFixed(2),
    opacity: randomBetween(0.18, 0.42).toFixed(2),
    blur: randomBetween(0, 0.28).toFixed(2),
    duration,
  };
}

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HomeRainLayer() {
  const nextId = useRef(0);
  const timerRef = useRef(null);
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const spawn = () => {
      const drop = createDrop(nextId.current);
      nextId.current += 1;
      setDrops((current) => [...current.slice(-(MAX_DROPS - 1)), drop]);
    };

    const schedule = () => {
      timerRef.current = window.setTimeout(() => {
        spawn();
        schedule();
      }, Math.round(randomBetween(260, 680)));
    };

    spawn();
    schedule();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const removeDrop = (id) => {
    setDrops((current) => current.filter((drop) => drop.id !== id));
  };

  return (
    <div className="home-rain-layer" aria-hidden="true">
      {drops.map((drop) => (
        <span
          className="home-rain-drop"
          key={drop.id}
          onAnimationEnd={() => removeDrop(drop.id)}
          style={{
            "--rain-x": `${drop.x}vw`,
            "--rain-fall": `${drop.fall}vh`,
            "--rain-drift": `${drop.drift}rem`,
            "--rain-length": `${drop.length}rem`,
            "--rain-width": `${drop.width}rem`,
            "--rain-angle": `${drop.angle}deg`,
            "--rain-opacity": drop.opacity,
            "--rain-blur": `${drop.blur}px`,
            "--rain-duration": `${drop.duration}ms`,
            animationDuration: `${drop.duration}ms`,
          }}
        />
      ))}
    </div>
  );
}
