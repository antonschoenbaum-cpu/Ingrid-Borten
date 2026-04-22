"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isTrackablePublicPath } from "@/lib/analytics-path";

function track(body: object) {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

/**
 * Førsteparts statistik: sidevisninger og klik på interne links.
 * Ingen tredjeparts cookies; data gemmes i data/analytics.json på serveren.
 */
export function PublicAnalytics() {
  const pathname = usePathname();
  const lastPageview = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname || !isTrackablePublicPath(pathname)) return;
    const now = Date.now();
    const prev = lastPageview.current;
    if (prev && prev.path === pathname && now - prev.at < 2500) return;
    lastPageview.current = { path: pathname, at: now };
    track({ type: "pageview", path: pathname });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a[href]");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const target = href.split("#")[0] ?? href;
      if (!isTrackablePublicPath(target)) return;
      if (target.startsWith("/admin") || target.startsWith("/api")) return;
      const from =
        typeof window !== "undefined" ? window.location.pathname : "/";
      if (!isTrackablePublicPath(from)) return;
      track({ type: "click", path: from, target });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
