"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import styles from "../../app/about/about.module.css";

export default function AboutScroll({ children }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const { scrollY } = useScroll();
  const openingEnd = useMotionValue(1);
  const scrollYProgress = useTransform([scrollY, openingEnd], ([position, end]) => Math.max(0, Math.min(1, position / end)));
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 32, mass: .85 });
  const titleOpacity = useTransform(progress, [0, .16], [1, 0]);
  useEffect(() => {
    const track = ref.current;
    const measure = () => {
      const bounds = track.getBoundingClientRect();
      openingEnd.set(Math.max(1, bounds.bottom + window.scrollY - window.innerHeight));
    };
    measure();
    setReady(true);
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(track.parentElement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [openingEnd]);
  const animated = ready && !reduceMotion;

  return (
    <div ref={ref} className={styles.scrollTrack} data-scroll-animated={animated || undefined} data-scroll-static={reduceMotion || undefined}>
      <div className={styles.scrollStage}>
        <motion.div className={styles.scrollFrame} style={animated ? { "--unroll": progress } : undefined}>
          <div className={styles.topRod} aria-hidden="true" />
          <div className={styles.paper}>
            {children}
          </div>
          <div className={styles.paperEdge} aria-hidden="true" />
          <div className={styles.bottomRod} aria-hidden="true" />
          <motion.div className={styles.rollTitle} style={{ opacity: titleOpacity }} aria-hidden="true">一卷小记</motion.div>
        </motion.div>
      </div>
    </div>
  );
}
