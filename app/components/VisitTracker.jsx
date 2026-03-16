"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function VisitTracker() {
  const pathname = usePathname();
  const sentPathRef = useRef("");

  useEffect(() => {
    if (!pathname || sentPathRef.current === pathname) return;
    if (pathname.startsWith("/admin")) return;

    sentPathRef.current = pathname;
    fetch("/api/visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path: pathname,
        referer: document.referrer || "",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
