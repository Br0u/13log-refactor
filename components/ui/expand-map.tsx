"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";

interface LocationMapProps {
  location?: string;
  coordinates?: string;
  className?: string;
  center?: [number, number];
  zoom?: number;
  viewport?: "desktop" | "mobile";
}

const MOBILE_MAP_QUERY = "(max-width: 960px)";
const DEFAULT_CENTER: [number, number] = [-79.3832, 43.6532];

function subscribeMobileViewport(listener: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const query = window.matchMedia(MOBILE_MAP_QUERY);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  query.addListener(listener);
  return () => query.removeListener(listener);
}

function getMobileViewportSnapshot() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(MOBILE_MAP_QUERY).matches;
}

function getServerViewportSnapshot() {
  return false;
}

function ActiveLocationMap({
  location = "Toronto, ON",
  coordinates = "43.6532° N, 79.3832° W",
  className,
  center = DEFAULT_CENTER,
  zoom = 11.2,
}: Omit<LocationMapProps, "viewport">) {
  const [isHovered, setIsHovered] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const pulseEl = document.createElement("div");
    pulseEl.className = "location-map__pulse";

    const coreWrap = document.createElement("div");
    coreWrap.className = "relative rounded-full border-2 border-white shadow-lg shadow-gray-500";

    const core = document.createElement("div");
    core.className = "h-0 w-0 rounded-full border-8 border-blue-500";
    coreWrap.appendChild(core);

    const markerRoot = document.createElement("div");
    markerRoot.className = "relative cursor-default";
    markerRoot.appendChild(pulseEl);
    markerRoot.appendChild(coreWrap);

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
    })();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
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
        className="location-map__surface relative h-[336px] w-full overflow-hidden rounded-xl border"
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
          className="location-map__basemap absolute inset-0 z-[1]"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        <motion.div
          className="location-map__shade absolute inset-0 z-[2]"
          animate={{ opacity: isHovered ? 0.14 : 0.2 }}
          transition={{ duration: 0.2 }}
          style={{ background: "linear-gradient(to top, hsl(var(--theme-hsl) / 0.88), transparent 60%)" }}
        />

        <div className="location-map__overlay pointer-events-none absolute inset-0 z-[3] flex flex-col justify-between p-4 md:p-5">
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
              className="location-map__label text-sm font-medium leading-tight text-[hsl(var(--primary-hsl))]"
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              {location}
            </motion.h3>

            <p className="location-map__coordinates text-xs leading-tight text-[hsl(var(--secondary-hsl))]">{coordinates}</p>

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

export function LocationMap({ viewport, ...props }: LocationMapProps) {
  const isMobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getServerViewportSnapshot,
  );
  const isActive = viewport === "mobile"
    ? isMobileViewport
    : viewport === "desktop"
      ? !isMobileViewport
      : true;

  return isActive ? <ActiveLocationMap {...props} /> : null;
}
