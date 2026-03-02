"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

interface LocationMapProps {
  location?: string;
  coordinates?: string;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export function LocationMap({
  location = "Toronto, ON",
  coordinates = "43.6532° N, 79.3832° W",
  className,
  center = [-79.3832, 43.6532],
  zoom = 11.2,
}: LocationMapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let pulseFrame = 0;

    const pulseEl = document.createElement("div");
    pulseEl.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400";

    const coreWrap = document.createElement("div");
    coreWrap.className = "relative rounded-full border-2 border-white shadow-lg shadow-gray-500";

    const core = document.createElement("div");
    core.className = "h-0 w-0 rounded-full border-8 border-blue-500";
    coreWrap.appendChild(core);

    const markerRoot = document.createElement("div");
    markerRoot.className = "relative cursor-default";
    markerRoot.appendChild(pulseEl);
    markerRoot.appendChild(coreWrap);

    const animatePulse = (timeMs: number) => {
      const t = timeMs * 0.0045;
      const progress = (Math.sin(t) + 1) / 2;
      const size = 48 + progress * 20;
      const opacity = 0.2 + (1 - progress) * 0.2;
      pulseEl.style.width = `${size}px`;
      pulseEl.style.height = `${size}px`;
      pulseEl.style.opacity = `${opacity}`;
      pulseFrame = window.requestAnimationFrame(animatePulse);
    };

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = new maplibre.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center,
        zoom,
        pitch: 0,
        bearing: 0,
        fadeDuration: 0,
        attributionControl: false,
        interactive: false,
      });

      const marker = new maplibre.Marker({ element: markerRoot, anchor: "center" }).setLngLat(center).addTo(map);

      map.once("load", () => map.resize());
      observer = new ResizeObserver(() => map.resize());
      observer.observe(mapContainerRef.current);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      pulseFrame = window.requestAnimationFrame(animatePulse);
    })();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (pulseFrame) window.cancelAnimationFrame(pulseFrame);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.resize();
    mapInstanceRef.current.jumpTo({ center, zoom, pitch: 0, bearing: 0 });
    if (markerRef.current) {
      markerRef.current.setLngLat(center);
    }
  }, [center, zoom]);

  return (
    <div
      className={`relative w-full select-none ${className || ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative h-[336px] w-full overflow-hidden rounded-xl border"
        style={{
          borderColor: "hsl(var(--border-hsl) / 0.85)",
          backgroundColor: "hsl(var(--theme-hsl) / 0.45)",
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        animate={{
          y: isHovered ? -3 : 0,
          rotateX: isHovered ? 1.8 : 0,
          rotateY: isHovered ? -1.2 : 0,
          boxShadow: isHovered ? "0 16px 34px rgba(0,0,0,0.14)" : "0 8px 20px rgba(0,0,0,0.08)",
        }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <div
          className="absolute inset-0 z-[1]"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        <motion.div
          className="absolute inset-0 z-[2]"
          animate={{ opacity: isHovered ? 0.14 : 0.2 }}
          transition={{ duration: 0.2 }}
          style={{ background: "linear-gradient(to top, hsl(var(--theme-hsl) / 0.88), transparent 60%)" }}
        />

        <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-4 md:p-5">
          <div className="flex items-start justify-between">
            <motion.div animate={{ opacity: isHovered ? 1 : 0.5 }} transition={{ duration: 0.2 }}>
              <Map size={18} className="text-[hsl(var(--secondary-hsl))]" />
            </motion.div>

            <motion.div
              className="flex items-center gap-1.5 rounded-full px-2 py-1 backdrop-blur-sm"
              style={{ backgroundColor: "hsl(var(--foreground-hsl) / 0.08)" }}
              animate={{ scale: isHovered ? 1.03 : 1 }}
              transition={{ duration: 0.18 }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Live</span>
            </motion.div>
          </div>

          <div className="space-y-1.5">
            <motion.h3
              className="text-sm font-medium leading-tight text-[hsl(var(--primary-hsl))]"
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              {location}
            </motion.h3>

            <p className="text-xs leading-tight text-[hsl(var(--secondary-hsl))]">{coordinates}</p>

            <motion.div
              className="h-px bg-gradient-to-r from-neutral-700/60 via-neutral-500/30 to-transparent"
              initial={{ scaleX: 0.75, originX: 0 }}
              animate={{ scaleX: isHovered ? 1 : 0.75 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
