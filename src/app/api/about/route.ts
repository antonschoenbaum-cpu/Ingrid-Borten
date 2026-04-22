import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { readAbout, revalidateAboutPaths, writeAbout } from "@/lib/store";
import {
  canUseSupabaseAboutRead,
  canUseSupabaseAboutWrite,
  readAboutFromSupabase,
  upsertAboutInSupabase,
} from "@/lib/supabase-about";
import type { AboutData, CvEntry } from "@/types/content";

function isCvEntries(v: unknown): v is CvEntry[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof (e as CvEntry).id === "string" &&
      typeof (e as CvEntry).year === "string" &&
      typeof (e as CvEntry).text === "string",
  );
}

async function readAboutForAdmin(): Promise<AboutData> {
  if (canUseSupabaseAboutRead()) {
    try {
      const row = await readAboutFromSupabase();
      if (row) return row;
    } catch {
      // falder tilbage til fil
    }
  }
  return readAbout();
}

function persistErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("EROFS") ||
    msg.includes("/var/task") ||
    msg.includes("read-only") ||
    msg.includes("ENOENT")
  ) {
    return "Gem fejlede: serveren kan ikke skrive til data/about.json i dette miljø. Brug Supabase til Om-siden i produktion.";
  }
  if (msg.includes("relation") && msg.includes("about_content")) {
    return 'Supabase fejl: tabel "about_content" findes ikke. Kør sql/supabase-about-setup.sql.';
  }
  return `Gem fejlede på serveren: ${msg}`;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const about = await readAboutForAdmin();
  return NextResponse.json(about);
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const biography = String(body.biography ?? "").trim();
  const artistPhoto = String(body.artistPhoto ?? "").trim();
  const prev = await readAboutForAdmin();
  const cvEntriesRaw = body.cvEntries;
  const cvEntries: CvEntry[] = isCvEntries(cvEntriesRaw)
    ? cvEntriesRaw
    : Array.isArray(prev.cvEntries)
      ? prev.cvEntries
      : [];

  if (!biography) {
    return NextResponse.json({ error: "Biografi må ikke være tom" }, { status: 400 });
  }
  if (!artistPhoto) {
    return NextResponse.json({ error: "Portræt-URL påkrævet" }, { status: 400 });
  }

  const data: AboutData = {
    biography,
    artistPhoto,
    cvEntries,
  };

  try {
    if (canUseSupabaseAboutWrite()) {
      const saved = await upsertAboutInSupabase(data);
      revalidateAboutPaths();
      return NextResponse.json(saved);
    }
    await writeAbout(data);
    revalidateAboutPaths();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}
