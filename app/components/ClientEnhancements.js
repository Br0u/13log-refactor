"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

function initCodeCopyButtons() {
  document.querySelectorAll("pre > code").forEach((codeblock) => {
    const pre = codeblock.parentElement;
    if (!pre || pre.querySelector(".copy-code")) return;
    const btn = document.createElement("button");
    btn.className = "copy-code";
    btn.textContent = "copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeblock.textContent || "");
      } catch {
        const range = document.createRange();
        range.selectNodeContents(codeblock);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("copy");
        selection?.removeAllRanges();
      }
      btn.textContent = "copied!";
      setTimeout(() => {
        btn.textContent = "copy";
      }, 1200);
    });
    pre.appendChild(btn);
  });
}

function initSpoilersAndPlaylist() {
  const cleanups = [];

  document.querySelectorAll(".spoiler").forEach((spoiler) => {
    const setRevealed = (revealed) => {
      spoiler.classList.toggle("is-revealed", revealed);
      spoiler.setAttribute("aria-expanded", revealed ? "true" : "false");
    };
    const toggle = () => setRevealed(!spoiler.classList.contains("is-revealed"));

    const onClick = (event) => {
      event.preventDefault();
      toggle();
    };
    const onKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    };

    spoiler.addEventListener("click", onClick);
    spoiler.addEventListener("keydown", onKeydown);
    cleanups.push(() => {
      spoiler.removeEventListener("click", onClick);
      spoiler.removeEventListener("keydown", onKeydown);
    });
  });

  document.querySelectorAll(".playlist-player").forEach((player) => {
    const audio = player.querySelector(".playlist-audio");
    const titleEl = player.querySelector(".playlist-title");
    const baseTitle = titleEl ? titleEl.textContent.trim() : "";

    player.querySelectorAll(".song-item").forEach((item) => {
      const activate = () => {
        const src = item.getAttribute("data-src");
        const title = item.getAttribute("data-title") || "";
        if (!audio || !src) return;
        audio.src = src;
        audio.play().catch(() => {});
        if (titleEl && baseTitle) {
          titleEl.textContent = `${baseTitle} - ${title}`;
        }
      };

      const onClick = () => activate();
      const onKeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      };

      item.addEventListener("click", onClick);
      item.addEventListener("keydown", onKeydown);
      cleanups.push(() => {
        item.removeEventListener("click", onClick);
        item.removeEventListener("keydown", onKeydown);
      });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

function initPostsFilter() {
  const root = document.querySelector("[data-posts-filter]");
  if (!root) return () => {};

  const chips = Array.from(root.querySelectorAll(".posts-filter__chip"));
  const cards = Array.from(document.querySelectorAll(".posts-masonry article[data-post-tags]"));

  const applyFilter = (tag) => {
    cards.forEach((card) => {
      const raw = card.getAttribute("data-post-tags") || "";
      const tags = raw ? raw.split("|").filter(Boolean) : [];
      const matched = tag === "__all" || tags.includes(tag);
      card.classList.toggle("is-filter-hidden", !matched);
    });

    chips.forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.filter === tag);
    });
  };

  const handlers = [];
  chips.forEach((chip) => {
    const onClick = () => applyFilter(chip.dataset.filter || "__all");
    chip.addEventListener("click", onClick);
    handlers.push({ chip, onClick });
  });

  return () => {
    handlers.forEach(({ chip, onClick }) => chip.removeEventListener("click", onClick));
  };
}

function initTocRail() {
  const rail = document.getElementById("page-toc-rail");
  const list = document.getElementById("page-toc-rail-list");
  if (!rail || !list) return () => {};

  const minDesktopWidth = 1200;
  let boundHeadings = [];
  let detachActivate = null;

  const slugify = (text) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\- ]+/g, "")
      .replace(/\s+/g, "-");

  const ensureHeadingId = (heading) => {
    if (heading.id) return heading.id;
    let id = slugify(heading.textContent || "") || `section-${Math.random().toString(36).slice(2, 8)}`;
    const base = id;
    let i = 2;
    while (document.getElementById(id)) {
      id = `${base}-${i}`;
      i += 1;
    }
    heading.id = id;
    return id;
  };

  const build = () => {
    list.innerHTML = "";
    rail.hidden = true;
    if (detachActivate) {
      detachActivate();
      detachActivate = null;
    }

    if (window.innerWidth < minDesktopWidth) return;

    const pathname = window.location.pathname || "";
    const isPostPage = pathname.startsWith("/posts/");
    const isLinkPage = pathname === "/link" || pathname.startsWith("/link/");
    const tocEnabled = isPostPage || isLinkPage;
    if (!tocEnabled) return;

    if (isLinkPage) {
      const main = document.querySelector("main");
      if (!main) return;
      boundHeadings = Array.from(main.querySelectorAll(".link-section-title, .post-content h2, .post-content h3")).filter(
        (h) => !h.closest(".toc")
      );
    } else {
      const container = document.querySelector("main .post-content");
      if (!container) return;

      boundHeadings = Array.from(container.querySelectorAll("h2, h3")).filter((h) => !h.closest(".toc"));
      if (!boundHeadings.length) {
        boundHeadings = Array.from(container.querySelectorAll("h1")).filter((h) => !h.closest(".toc"));
      }
    }

    if (!boundHeadings.length) return;

    const frag = document.createDocumentFragment();
    boundHeadings.forEach((heading) => {
      const id = ensureHeadingId(heading);
      const li = document.createElement("li");
      li.className = "page-toc-rail__item";
      if (heading.tagName.toLowerCase() === "h3") li.classList.add("is-sub");

      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = heading.textContent || id;
      link.className = "page-toc-rail__link";

      li.appendChild(link);
      frag.appendChild(li);
    });

    list.appendChild(frag);
    rail.hidden = false;

    const links = Array.from(list.querySelectorAll(".page-toc-rail__link"));
    const activate = () => {
      let current = "";
      const offset = window.scrollY + 140;
      for (const heading of boundHeadings) {
        if (heading.offsetTop <= offset) current = heading.id;
        else break;
      }
      if (!current && boundHeadings[0]) current = boundHeadings[0].id;

      links.forEach((link) => {
        const active = current && link.getAttribute("href") === `#${current}`;
        link.classList.toggle("is-active", !!active);
        if (link.parentElement) {
          link.parentElement.classList.toggle("is-current", !!active);
        }
      });
    };

    window.addEventListener("scroll", activate, { passive: true });
    detachActivate = () => window.removeEventListener("scroll", activate);
    activate();
  };

  window.addEventListener("resize", build);
  build();

  return () => {
    if (detachActivate) detachActivate();
    window.removeEventListener("resize", build);
  };
}

function initLinkPreview() {
  const cards = Array.from(document.querySelectorAll("[data-link-card][data-preview-enabled='true']"));
  if (!cards.length) return;

  const CACHE_KEY = "link-preview-cache-v1";
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  let cache = {};

  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch {
    cache = {};
  }

  const now = Date.now();
  Object.keys(cache).forEach((k) => {
    if (!cache[k] || now - cache[k].ts > CACHE_TTL) delete cache[k];
  });

  const persist = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  };

  const apply = (card, meta) => {
    const titleEl = card.querySelector("[data-preview-title]");
    const descEl = card.querySelector("[data-preview-desc]");
    const container = card.querySelector("[data-preview-container]");
    if (!container) return;

    if (titleEl && !titleEl.textContent.trim() && meta.title) titleEl.textContent = meta.title;
    if (descEl && !descEl.textContent.trim() && meta.description) {
      descEl.textContent = meta.description;
      descEl.classList.remove("is-empty");
    }

    const src =
      meta.image ||
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(card.getAttribute("data-preview-url") || "")}&sz=128`;
    if (!src) return;

    let img = container.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = "";
      container.appendChild(img);
    }
    if (!img.getAttribute("src")) img.src = src;
    container.classList.remove("is-empty");
  };

  const fetchMeta = async (url) => {
    const providers = [
      {
        url: `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
        map: (payload) => {
          if (!payload || payload.status !== "success" || !payload.data) return null;
          const d = payload.data;
          return {
            title: d.title || "",
            description: d.description || "",
            image: typeof d.image === "string" ? d.image : d.image?.url || "",
          };
        },
      },
      {
        url: `https://api.ogfetch.com/preview?url=${encodeURIComponent(url)}`,
        map: (payload) => ({
          title: payload?.title || "",
          description: payload?.description || "",
          image: payload?.image || "",
        }),
      },
    ];

    for (const provider of providers) {
      try {
        const resp = await fetch(provider.url);
        if (!resp.ok) continue;
        const payload = await resp.json();
        const meta = provider.map(payload);
        if (meta && (meta.title || meta.description || meta.image)) return meta;
      } catch {}
    }
    return null;
  };

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const url = card.getAttribute("data-preview-url") || "";
        const cached = cache[url]?.data;
        if (cached) {
          apply(card, cached);
          card.classList.remove("link-board-card--preview-pending");
        } else {
          const meta = await fetchMeta(url);
          if (meta) {
            cache[url] = { ts: Date.now(), data: meta };
            persist();
            apply(card, meta);
          } else {
            card.classList.add("link-board-card--preview-failed");
          }
          card.classList.remove("link-board-card--preview-pending");
        }
        obs.unobserve(card);
      });
    },
    { rootMargin: "260px 0px" }
  );

  cards.forEach((card) => io.observe(card));
}

export default function ClientEnhancements() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups = [];

    initTheme();
    cleanups.push(initThemeToggle());
    cleanups.push(initMenuScrollMemory());
    cleanups.push(initAnchorSmoothScroll());
    cleanups.push(initTopLink());
    cleanups.push(initSpoilersAndPlaylist());
    cleanups.push(initPostsFilter());
    cleanups.push(initTocRail());

    initCodeCopyButtons();
    initLinkPreview();

    return () => {
      cleanups.forEach((fn) => {
        if (typeof fn === "function") fn();
      });
    };
  }, [pathname]);

  return null;
}


