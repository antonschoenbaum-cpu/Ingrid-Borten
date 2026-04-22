import { NextRequest, NextResponse } from "next/server";
import { isTrackablePublicPath } from "@/lib/analytics-path";
import { recordAnalyticsEvent } from "@/lib/analytics-store";

const windowMs = 60_000;
const maxPerWindow = 100;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "local";
}

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= maxPerWindow) return false;
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

export async function POST(req: NextRequest) {
  if (!rateLimitOk(clientIp(req))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = body.type === "click" ? "click" : body.type === "pageview" ? "pageview" : null;
  if (!type) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = String(body.path ?? "");
  const target = body.target != null ? String(body.target).split("#")[0] : undefined;

  if (!isTrackablePublicPath(path)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (type === "click" && target && !isTrackablePublicPath(target)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordAnalyticsEvent({ type, path, target });
  return NextResponse.json({ ok: true });
}
