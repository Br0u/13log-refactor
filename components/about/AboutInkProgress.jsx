"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import styles from "../../app/about/about.module.css";

const stroke = "M14 4 C10 44 17 70 13 105 S10 165 14 201 S17 250 12 294 S10 355 14 399 S17 451 13 498 S11 555 14 596";

function InkNode({ label, position, progress, reduceMotion }) {
  const above = useRef(progress.get() >= position);
  const [reached, setReached] = useState(above.current);
  const [bloom, setBloom] = useState(0);
  useEffect(() => {
    above.current = progress.get() >= position;
    setReached(above.current);
  }, [position, progress]);
  useMotionValueEvent(progress, "change", (value) => {
    if (!above.current && value >= position) {
      above.current = true;
      setReached(true);
      if (!reduceMotion) setBloom((count) => count + 1);
    } else if (above.current && value < position - .008) {
      // Rearm only after leaving the node, so tiny scroll reversals do not flicker.
      above.current = false;
      setReached(false);
    }
  });

  return (
    <div className={styles.inkNode} style={{ top: `${position * 100}%` }} data-reached={reached || undefined}>
      <i className={styles.inkPoint} />
      <span className={styles.inkNodeLabel}>{label}</span>
      {bloom > 0 && !reduceMotion && <i key={bloom} className={styles.inkBloom} />}
    </div>
  );
}

export default function AboutInkProgress() {
  const [ready, setReady] = useState(false);
  const [nodes, setNodes] = useState([]);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ trackContentSize: true });
  const settled = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: .35, restDelta: .0001, restSpeed: .0001 });
  const progress = reduceMotion ? scrollYProgress : settled;
  const clipPath = useTransform(progress, (value) => `inset(0 0 ${(1 - Math.max(0, Math.min(1, value))) * 100}% 0)`);
  const opacity = useTransform(progress, [0, .04], [0, 1]);
  useEffect(() => {
    const elements = [...document.querySelectorAll("[data-ink-node]")];
    const measure = () => {
      const end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setNodes(elements.map((element) => ({
        label: element.getAttribute("data-ink-node"),
        position: Math.max(0, Math.min(1, (element.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2) / end)),
      })));
    };
    measure();
    setReady(true);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!ready) return null;

  return (
    <motion.div className={styles.inkProgress} style={{ opacity }} aria-hidden="true">
      <svg viewBox="0 0 28 600" preserveAspectRatio="none" focusable="false">
        <path className={styles.inkGuide} d={stroke} />
        <motion.g style={{ clipPath }}>
          <path className={styles.inkBleed} d={stroke} />
          <path className={styles.inkStroke} d={stroke} />
          <path className={styles.inkDry} d="M15 8 C12 83 15 141 12 205 S16 290 13 350 S15 437 12 492 S13 560 14 593" />
        </motion.g>
      </svg>
      {nodes.map((node) => <InkNode key={node.label} {...node} progress={progress} reduceMotion={reduceMotion} />)}
    </motion.div>
  );
}
