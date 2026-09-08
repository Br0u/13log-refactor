"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import styles from "../../app/about/about.module.css";

export default function HangingPhoto({ photo, index }) {
  const reduced = useReducedMotion();
  const dragged = useRef(false);
  const rest = [-1.5, 1.2, -.8, 1.4, -.6][index % 5];
  const manual = useMotionValue(rest);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Scroll supplies a bounded nudge; the shared spring also handles hand gestures.
  const target = useTransform([manual, velocity], ([angle, speed]) =>
    reduced ? 0 : angle + Math.sign(rest) * Math.max(-3.2, Math.min(3.2, speed / 850))
  );
  const rotate = useSpring(target, {
    stiffness: 42 + index * 3, damping: 5.8, mass: 1.4 + (index % 3) * .12,
  });
  const settle = () => manual.set(rest);

  return (
    <figure className={styles.photo} data-frame={index < 2 ? "wood" : "black"}>
      <motion.a href="/photos/random" className={styles.hangingFrame}
        aria-label={`${photo.caption}，查看相册`} draggable={false}
        style={{ rotate: reduced ? 0 : rotate }}
        onPointerDown={() => { dragged.current = false; }}
        onPointerEnter={reduced ? undefined : (event) => {
          if (event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          manual.set(rest + (event.clientX < box.left + box.width / 2 ? 2.5 : -2.5));
        }}
        onPointerLeave={reduced ? undefined : settle}
        onPointerCancel={settle}
        onPan={reduced ? undefined : (_, info) => {
          if (Math.abs(info.offset.x) > 5) dragged.current = true;
          manual.set(rest + Math.max(-10, Math.min(10, info.offset.x / 9)));
        }}
        onPanEnd={reduced ? undefined : settle}
        onClick={(event) => {
          if (dragged.current && event.detail !== 0) event.preventDefault();
        }}>
        <svg className={styles.hangingCord} viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M25 60 100 2 175 60" />
        </svg>
        <span className={styles.frameFace}>
          <span className={styles.photoMat}>
            <Image src={photo.imageUrl} alt={photo.caption} width={360} height={460}
              sizes="(max-width: 600px) 65vw, 300px" loading="lazy" draggable={false} />
          </span>
        </span>
      </motion.a>
      <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.caption}</figcaption>
    </figure>
  );
}
