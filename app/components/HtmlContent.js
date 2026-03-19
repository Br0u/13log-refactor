"use client";

import { useEffect, useRef } from "react";

export default function HtmlContent({ html, className = "post-content", executeScripts = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!executeScripts || !ref.current) return;

    const root = ref.current;
    const scripts = Array.from(root.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const src = oldScript.getAttribute("src");
      if (src && document.querySelector(`script[src="${src}"]`)) {
        oldScript.remove();
        return;
      }
      const script = document.createElement("script");
      for (const attr of oldScript.attributes) {
        script.setAttribute(attr.name, attr.value);
      }
      script.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(script, oldScript);
    });
  }, [html, executeScripts]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html || "" }} />;
}
