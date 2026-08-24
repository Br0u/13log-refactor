"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";

const MAX_PARTICLES = 84;
const INITIAL_PARTICLES = 40;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticle(id, seeded = false) {
  const petalDuration = Math.round(randomBetween(6500, 10500));
  const debrisDuration = Math.round(randomBetween(8000, 14000));
  const drift = randomBetween(-8, 10);
  const sway = randomBetween(1.4, 5.2);
  const swayDirection = Math.random() < 0.5 ? -1 : 1;
  const petalAngle = randomBetween(0, 360);
  const petalSpin = randomBetween(420, 980) * (Math.random() < 0.5 ? -1 : 1);
  const petalWidth = randomBetween(0.42, 1);

  return {
    id,
    x: randomBetween(-4, 104).toFixed(2),
    fall: randomBetween(92, 124).toFixed(2),
    drift: drift.toFixed(2),
    blur: randomBetween(0, 0.48).toFixed(2),
    petalAngle: petalAngle.toFixed(2),
    petalDelay: seeded ? -Math.round(randomBetween(0, petalDuration * 0.94)) : 0,
    petalDuration,
    petalFlutterDuration: Math.round(randomBetween(440, 920)),
    petalWidth: petalWidth.toFixed(2),
    petalLength: (petalWidth * randomBetween(1.25, 1.65)).toFixed(2),
    petalOpacity: randomBetween(0.38, 0.76).toFixed(2),
    petalSwayA: (drift * 0.18 + swayDirection * sway).toFixed(2),
    petalSwayB: (drift * 0.4 - swayDirection * sway * 0.48).toFixed(2),
    petalSwayC: (drift * 0.63 + swayDirection * sway * 0.7).toFixed(2),
    petalSwayD: (drift * 0.82 - swayDirection * sway * 0.3).toFixed(2),
    petalRotateA: (petalAngle + petalSpin * 0.18).toFixed(2),
    petalRotateB: (petalAngle + petalSpin * 0.4).toFixed(2),
    petalRotateC: (petalAngle + petalSpin * 0.63).toFixed(2),
    petalRotateD: (petalAngle + petalSpin * 0.82).toFixed(2),
    petalRotateEnd: (petalAngle + petalSpin).toFixed(2),
    debrisY: randomBetween(5, 92).toFixed(2),
    debrisDrift: randomBetween(72, 116).toFixed(2),
    debrisLift: randomBetween(-8, 8).toFixed(2),
    debrisDuration,
    debrisDelay: seeded ? -Math.round(randomBetween(0, debrisDuration * 0.94)) : 0,
    debrisAngle: randomBetween(-42, 42).toFixed(2),
    debrisSpin: (randomBetween(220, 720) * (Math.random() < 0.5 ? -1 : 1)).toFixed(2),
    debrisWidth: randomBetween(0.05, 0.12).toFixed(2),
    debrisLength: randomBetween(0.45, 1.35).toFixed(2),
    debrisOpacity: randomBetween(0.12, 0.36).toFixed(2),
  };
}

export default function HomeAtmosphereLayer() {
  const nextId = useRef(0);
  const seededRef = useRef(false);
  const timerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const motionQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    let disposed = false;

    const spawn = () => {
      if (disposed) return;
      const particle = createParticle(nextId.current);
      nextId.current += 1;
      setParticles((current) => [...current.slice(-(MAX_PARTICLES - 1)), particle]);
    };

    const seed = () => {
      const initialParticles = Array.from({ length: INITIAL_PARTICLES }, () => {
        const particle = createParticle(nextId.current, true);
        nextId.current += 1;
        return particle;
      });
      seededRef.current = true;
      setParticles(initialParticles);
    };

    const clearSchedule = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = () => {
      if (disposed || document.hidden || motionQuery?.matches) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        spawn();
        schedule();
      }, Math.round(randomBetween(140, 320)));
    };

    const syncActivity = () => {
      const paused = document.hidden || Boolean(motionQuery?.matches);
      clearSchedule();
      setIsPaused(paused);

      if (motionQuery?.matches) {
        seededRef.current = false;
        setParticles([]);
      } else if (!paused) {
        if (seededRef.current) spawn();
        else seed();
        schedule();
      }
    };

    document.addEventListener("visibilitychange", syncActivity);
    if (typeof motionQuery?.addEventListener === "function") {
      motionQuery.addEventListener("change", syncActivity);
    } else {
      motionQuery?.addListener?.(syncActivity);
    }
    syncActivity();

    return () => {
      disposed = true;
      clearSchedule();
      document.removeEventListener("visibilitychange", syncActivity);
      if (typeof motionQuery?.removeEventListener === "function") {
        motionQuery.removeEventListener("change", syncActivity);
      } else {
        motionQuery?.removeListener?.(syncActivity);
      }
    };
  }, []);

  const removeParticle = (id) => {
    setParticles((current) => current.filter((particle) => particle.id !== id));
  };

  return (
    <div
      className="home-atmosphere-layer"
      data-atmosphere-state={isPaused ? "paused" : "running"}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          className="home-atmosphere-particle"
          key={particle.id}
          onAnimationEnd={() => removeParticle(particle.id)}
          style={{
            "--particle-x": `${particle.x}vw`,
            "--particle-fall": `${particle.fall}vh`,
            "--particle-drift": `${particle.drift}rem`,
            "--particle-blur": `${particle.blur}px`,
            "--petal-angle": `${particle.petalAngle}deg`,
            "--petal-delay": `${particle.petalDelay}ms`,
            "--petal-duration": `${particle.petalDuration}ms`,
            "--petal-flutter-duration": `${particle.petalFlutterDuration}ms`,
            "--petal-width": `${particle.petalWidth}rem`,
            "--petal-length": `${particle.petalLength}rem`,
            "--petal-opacity": particle.petalOpacity,
            "--petal-sway-a": `${particle.petalSwayA}rem`,
            "--petal-sway-b": `${particle.petalSwayB}rem`,
            "--petal-sway-c": `${particle.petalSwayC}rem`,
            "--petal-sway-d": `${particle.petalSwayD}rem`,
            "--petal-rotate-a": `${particle.petalRotateA}deg`,
            "--petal-rotate-b": `${particle.petalRotateB}deg`,
            "--petal-rotate-c": `${particle.petalRotateC}deg`,
            "--petal-rotate-d": `${particle.petalRotateD}deg`,
            "--petal-rotate-end": `${particle.petalRotateEnd}deg`,
            "--debris-y": `${particle.debrisY}vh`,
            "--debris-drift": `${particle.debrisDrift}vw`,
            "--debris-lift": `${particle.debrisLift}vh`,
            "--debris-duration": `${particle.debrisDuration}ms`,
            "--debris-delay": `${particle.debrisDelay}ms`,
            "--debris-angle": `${particle.debrisAngle}deg`,
            "--debris-spin": `${particle.debrisSpin}deg`,
            "--debris-width": `${particle.debrisWidth}rem`,
            "--debris-length": `${particle.debrisLength}rem`,
            "--debris-opacity": particle.debrisOpacity,
          }}
        />
      ))}
    </div>
  );
}
