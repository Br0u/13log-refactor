"use client";

import React, { useRef } from "react";

const LAYERS = ["fallback", "far", "middle", "front"] as const;

export default function HomeBackgroundDepth() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      aria-hidden="true"
      className="home-depth-background"
      data-parallax-active="false"
      ref={sceneRef}
    >
      {LAYERS.map((layer) => (
        <div
          className={`home-depth-background__layer home-depth-background__layer--${layer}`}
          data-depth-layer={layer}
          key={layer}
        />
      ))}
    </div>
  );
}
