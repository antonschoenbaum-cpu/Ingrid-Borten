import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { readAbout, revalidateAboutPaths, writeAbout } from "@/lib/store";
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

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const about = await readAbout();
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
  const prev = await readAbout();
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
  await writeAbout(data);
  revalidateAboutPaths();
  return NextResponse.json(data);
}
