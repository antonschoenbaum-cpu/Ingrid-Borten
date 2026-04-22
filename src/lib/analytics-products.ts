import type { SiteAnalytics } from "@/lib/analytics-store";

type ProductKind = "malerier" | "smykker";

export type ProductAnalyticsRow = {
  path: string;
  id: string;
  /** Antal gange værkets side er vist (pageview på /malerier/id eller /smykker/id). */
  views: number;
  /** Antal gange nogen har klikket et internt link hertil fra jeres egen side. */
  clicks: number;
};

function collectProductPaths(
  counts: Record<string, number>,
  kind: ProductKind,
): Set<string> {
  const prefix = `/${kind}/`;
  const out = new Set<string>();
  for (const path of Object.keys(counts)) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (!rest || rest.includes("/")) continue;
    out.add(`/${kind}/${rest}`);
  }
  return out;
}

/** Top produktsider under /malerier eller /smykker — sorteret efter visninger, derefter klik. */
export function topProductRows(
  a: SiteAnalytics,
  kind: ProductKind,
  limit: number,
): ProductAnalyticsRow[] {
  const paths = new Set<string>([
    ...collectProductPaths(a.byPath, kind),
    ...collectProductPaths(a.clicksByTarget, kind),
  ]);
  const rows: ProductAnalyticsRow[] = [...paths].map((path) => {
    const id = path.split("/").pop() ?? path;
    return {
      path,
      id,
      views: a.byPath[path] ?? 0,
      clicks: a.clicksByTarget[path] ?? 0,
    };
  });
  rows.sort((x, y) => {
    if (y.views !== x.views) return y.views - x.views;
    return y.clicks - x.clicks;
  });
  return rows.slice(0, limit);
}
