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

  const prev = await readAboutForAdmin();
  const biography =
    typeof body.biography === "string" ? body.biography.trim() : prev.biography;
  const artistPhoto =
    typeof body.artistPhoto === "string" ? body.artistPhoto.trim() : prev.artistPhoto;
  const heroTitle =
    typeof body.heroTitle === "string" ? body.heroTitle.trim().slice(0, 120) : (prev.heroTitle ?? "");
  const heroSubtitle =
    typeof body.heroSubtitle === "string"
      ? body.heroSubtitle.trim().slice(0, 160)
      : (prev.heroSubtitle ?? "");
  const heroDescription =
    typeof body.heroDescription === "string"
      ? body.heroDescription.trim().slice(0, 300)
      : (prev.heroDescription ?? "");
  const heroImage1 = typeof body.heroImage1 === "string" ? body.heroImage1.trim() : (prev.heroImage1 ?? "");
  const heroImage2 = typeof body.heroImage2 === "string" ? body.heroImage2.trim() : (prev.heroImage2 ?? "");
  const heroImage3 = typeof body.heroImage3 === "string" ? body.heroImage3.trim() : (prev.heroImage3 ?? "");
  const heroImage4 = typeof body.heroImage4 === "string" ? body.heroImage4.trim() : (prev.heroImage4 ?? "");
  const heroImage5 = typeof body.heroImage5 === "string" ? body.heroImage5.trim() : (prev.heroImage5 ?? "");
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
    heroTitle,
    heroSubtitle,
    heroDescription,
    heroImage1,
    heroImage2,
    heroImage3,
    heroImage4,
    heroImage5,
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
