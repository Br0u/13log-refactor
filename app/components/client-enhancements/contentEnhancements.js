export function initCodeCopyButtons() {
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

export function initSpoilersAndPlaylist() {
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
