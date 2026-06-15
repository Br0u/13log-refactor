export function initTocRail() {
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
    if (isPostPage || !isLinkPage) return;

    const main = document.querySelector("main");
    if (!main) return;
    boundHeadings = Array.from(main.querySelectorAll(".link-section-title, .post-content h2, .post-content h3")).filter(
      (h) => !h.closest(".toc")
    );

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
    if (detachActivate) {
      detachActivate();
      detachActivate = null;
    }
    boundHeadings = [];
    list.innerHTML = "";
    rail.hidden = true;
    window.removeEventListener("resize", build);
  };
}
