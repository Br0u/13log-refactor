export function initLinkPreview() {
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
