import fs from "fs/promises";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import { isTrackablePublicPath } from "@/lib/analytics-path";

const root = process.cwd();
const filePath = path.join(root, "data", "analytics.json");

export type SiteAnalytics = {
  totalPageViews: number;
  totalClicks: number;
  byPath: Record<string, number>;
  clicksByTarget: Record<string, number>;
  byDay: Record<string, { pageViews: number; clicks: number }>;
};

const empty: SiteAnalytics = {
  totalPageViews: 0,
  totalClicks: 0,
  byPath: {},
  clicksByTarget: {},
  byDay: {},
};

function todayKeyCopenhagen(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" });
}

function pruneByDay(byDay: SiteAnalytics["byDay"], keepDays: number) {
  const keys = Object.keys(byDay).sort();
  if (keys.length <= keepDays) return;
  const drop = keys.length - keepDays;
  for (let i = 0; i < drop; i++) {
    delete byDay[keys[i]];
  }
}

export async function readSiteAnalytics(): Promise<SiteAnalytics> {
  noStore();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const j = JSON.parse(raw) as Partial<SiteAnalytics>;
    return {
      totalPageViews: Number(j.totalPageViews) || 0,
      totalClicks: Number(j.totalClicks) || 0,
      byPath: typeof j.byPath === "object" && j.byPath ? j.byPath : {},
      clicksByTarget:
        typeof j.clicksByTarget === "object" && j.clicksByTarget ? j.clicksByTarget : {},
      byDay: typeof j.byDay === "object" && j.byDay ? j.byDay : {},
    };
  } catch {
    return { ...empty };
  }
}

type TrackPayload = { type: "pageview" | "click"; path: string; target?: string };

export async function recordAnalyticsEvent(payload: TrackPayload): Promise<boolean> {
  if (!isTrackablePublicPath(payload.path)) return false;

  let data = await readSiteAnalytics();
  const day = todayKeyCopenhagen();
  data.byDay[day] = data.byDay[day] ?? { pageViews: 0, clicks: 0 };

  if (payload.type === "pageview") {
    data.totalPageViews += 1;
    data.byPath[payload.path] = (data.byPath[payload.path] ?? 0) + 1;
    data.byDay[day].pageViews += 1;
  } else {
    const tgt = (payload.target ?? "").split("#")[0];
    if (!tgt || !isTrackablePublicPath(tgt)) return false;
    data.totalClicks += 1;
    data.clicksByTarget[tgt] = (data.clicksByTarget[tgt] ?? 0) + 1;
    data.byDay[day].clicks += 1;
  }

  pruneByDay(data.byDay, 120);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return true;
}

export function sortCounts(map: Record<string, number>, limit: number): [string, number][] {
  return Object.entries(map)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function lastNDaysKeys(n: number): string[] {
  const out: string[] = [];
  const tz = "Europe/Copenhagen";
  for (let i = n - 1; i >= 0; i--) {
    const t = Date.now() - i * 86400000;
    out.push(new Date(t).toLocaleDateString("en-CA", { timeZone: tz }));
  }
  return out;
}
