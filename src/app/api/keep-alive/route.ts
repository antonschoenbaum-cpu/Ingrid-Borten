import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Kør altid ved request-tid (aldrig cache/prerender).
export const dynamic = "force-dynamic";

/**
 * Keep-alive endpoint.
 *
 * Supabase-gratisniveauet sætter projektet på pause efter ca. 7 dages
 * inaktivitet, hvilket får siden til at holde op med at hente data.
 * Vercel Cron kalder dette endpoint dagligt (se vercel.json) og laver en
 * minimal database-forespørgsel, så projektet altid tælles som aktivt.
 */
export async function GET(req: NextRequest) {
  // Hvis CRON_SECRET er sat, kræv den korrekte Vercel Cron Authorization-header.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!/^https?:\/\//i.test(url) || key.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Supabase er ikke konfigureret." },
      { status: 503 },
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Minimal forespørgsel: kun antal rækker, ingen data hentes.
    const { error } = await supabase
      .from("paintings")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
