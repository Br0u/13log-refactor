"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Gamepad2, Images, Link2, UserRound } from "lucide-react";

const MOBILE_NAV_QUERY = "(max-width: 960px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const HIDE_AFTER_DELTA = 24;
const SHOW_AFTER_DELTA = 8;
const TOP_REVEAL_OFFSET = 96;
const BOTTOM_REVEAL_OFFSET = 72;

const NAV_ITEMS = [
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
  { href: "/link", label: "Link" },
  { href: "/playzone", label: "Playzone" },
  { href: "/photos", label: "Photos" },
];

const NAV_ICONS = {
  "/posts": FileText,
  "/about": UserRound,
  "/link": Link2,
  "/playzone": Gamepad2,
  "/photos": Images,
};

function isActive(pathname, href) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeMediaQuery(query, listener) {
  if (!query) return () => {};
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }
  if (typeof query.addListener === "function") {
    query.addListener(listener);
    return () => query.removeListener(listener);
  }
  return () => {};
}

function useMobileNavVisibility(pathname) {
  const [state, setState] = useState("visible");
  const lastScrollYRef = useRef(0);
  const directionalTravelRef = useRef(0);
  const animationFrameRef = useRef(null);

  const reveal = useCallback(() => {
    setState((current) => current === "visible" ? current : "visible");
  }, []);

  useEffect(() => {
    const mobileQuery = typeof window.matchMedia === "function"
      ? window.matchMedia(MOBILE_NAV_QUERY)
      : null;
    const reducedMotionQuery = typeof window.matchMedia === "function"
      ? window.matchMedia(REDUCED_MOTION_QUERY)
      : null;

    lastScrollYRef.current = Math.max(0, window.scrollY || window.pageYOffset || 0);
    directionalTravelRef.current = 0;
    reveal();

    const updateVisibility = () => {
      animationFrameRef.current = null;
      const nextScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (!mobileQuery?.matches || reducedMotionQuery?.matches) {
        lastScrollYRef.current = nextScrollY;
        directionalTravelRef.current = 0;
        reveal();
        return;
      }

      const delta = nextScrollY - lastScrollYRef.current;
      const documentHeight = document.documentElement.scrollHeight;
      const nearTop = nextScrollY <= TOP_REVEAL_OFFSET;
      const nearBottom = nextScrollY + window.innerHeight >= documentHeight - BOTTOM_REVEAL_OFFSET;

      if (nearTop || nearBottom) {
        directionalTravelRef.current = 0;
        reveal();
      } else if (delta < 0) {
        directionalTravelRef.current = Math.min(0, directionalTravelRef.current) + delta;
        if (directionalTravelRef.current <= -SHOW_AFTER_DELTA) {
          directionalTravelRef.current = 0;
          reveal();
        }
      } else if (delta > 0) {
        directionalTravelRef.current = Math.max(0, directionalTravelRef.current) + delta;
        if (directionalTravelRef.current >= HIDE_AFTER_DELTA) {
          directionalTravelRef.current = 0;
          setState((current) => current === "hidden" ? current : "hidden");
        }
      }

      lastScrollYRef.current = nextScrollY;
    };

    const queueVisibilityUpdate = () => {
      if (animationFrameRef.current !== null) return;
      animationFrameRef.current = window.requestAnimationFrame(updateVisibility);
    };

    const onMediaChange = () => {
      lastScrollYRef.current = Math.max(0, window.scrollY || window.pageYOffset || 0);
      directionalTravelRef.current = 0;
      if (!mobileQuery?.matches || reducedMotionQuery?.matches) {
        reveal();
      }
    };

    const unsubscribeMobile = subscribeMediaQuery(mobileQuery, onMediaChange);
    const unsubscribeReducedMotion = subscribeMediaQuery(reducedMotionQuery, onMediaChange);
    window.addEventListener("scroll", queueVisibilityUpdate, { passive: true });

    return () => {
      unsubscribeMobile();
      unsubscribeReducedMotion();
      window.removeEventListener("scroll", queueVisibilityUpdate);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [pathname, reveal]);

  return { reveal, state };
}

export default function HeaderNav() {
  const pathname = usePathname();
  const { reveal, state } = useMobileNavVisibility(pathname);

  return (
    <>
      <div
        className="mobile-nav-scrim"
        data-mobile-nav-state={state}
        aria-hidden="true"
      />
      <ul
        id="menu"
        aria-label="Primary"
        data-mobile-nav-state={state}
        onFocusCapture={reveal}
        onPointerDownCapture={reveal}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = NAV_ICONS[item.href];

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {Icon ? <Icon className="site-nav-icon" aria-hidden="true" size={22} strokeWidth={1.8} /> : null}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
