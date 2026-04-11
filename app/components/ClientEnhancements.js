"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initCodeCopyButtons, initSpoilersAndPlaylist } from "./client-enhancements/contentEnhancements";
import { initLinkPreview } from "./client-enhancements/linkPreview";
import { initTocRail } from "./client-enhancements/tocRail";

function initTheme() {
  const pref = localStorage.getItem("pref-theme");
  const body = document.body;
  if (pref === "dark") {
    body.classList.add("dark");
  } else if (pref === "light") {
    body.classList.remove("dark");
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    body.classList.add("dark");
  }
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return () => {};

  const onClick = () => {
    const dark = document.body.classList.contains("dark");
    if (dark) {
      document.body.classList.remove("dark");
      localStorage.setItem("pref-theme", "light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("pref-theme", "dark");
    }
  };

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}

function initTopLink() {
  const topLink = document.getElementById("top-link");
  if (!topLink) return () => {};

  const onScroll = () => {
    const visible = document.documentElement.scrollTop > 800 || document.body.scrollTop > 800;
    topLink.style.visibility = visible ? "visible" : "hidden";
    topLink.style.opacity = visible ? "1" : "0";
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}

function initMenuScrollMemory() {
  const menu = document.getElementById("menu");
  if (!menu) return () => {};

  const saved = localStorage.getItem("menu-scroll-position");
  if (saved) menu.scrollLeft = Number(saved) || 0;

  const onScroll = () => {
    localStorage.setItem("menu-scroll-position", String(menu.scrollLeft));
  };

  menu.addEventListener("scroll", onScroll);
  return () => menu.removeEventListener("scroll", onScroll);
}

function initAnchorSmoothScroll() {
  const handlers = [];

  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    const onClick = (e) => {
      const href = anchor.getAttribute("href") || "";
      const id = href.slice(1);
      if (!id) return;

      const target = document.querySelector(`[id='${decodeURIComponent(id)}']`);
      if (!target) return;

      e.preventDefault();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      if (id === "top") {
        history.replaceState(null, "", " ");
      } else {
        history.pushState(null, "", `#${id}`);
      }
    };

    anchor.addEventListener("click", onClick);
    handlers.push({ anchor, onClick });
  });

  return () => {
    handlers.forEach(({ anchor, onClick }) => {
      anchor.removeEventListener("click", onClick);
    });
  };
}

export default function ClientEnhancements() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups = [];
    const isPostPage = pathname.startsWith("/posts/");
    const isLinkPage = pathname === "/link" || pathname.startsWith("/link/");
    const isPlayzonePage = pathname === "/playzone" || pathname.startsWith("/playzone/");

    initTheme();
    cleanups.push(initThemeToggle());
    cleanups.push(initMenuScrollMemory());
    cleanups.push(initAnchorSmoothScroll());
    cleanups.push(initTopLink());
    cleanups.push(initSpoilersAndPlaylist());
    if (isPostPage || isLinkPage) {
      cleanups.push(initTocRail());
    }

    initCodeCopyButtons();
    if (isLinkPage || isPlayzonePage) {
      initLinkPreview();
    }

    return () => {
      cleanups.forEach((fn) => {
        if (typeof fn === "function") fn();
      });
    };
  }, [pathname]);

  return null;
}
