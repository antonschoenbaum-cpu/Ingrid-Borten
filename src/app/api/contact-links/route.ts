import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOptionalHttpUrl } from "@/lib/contact-urls";
import { requireAdmin } from "@/lib/require-admin";
import {
  canUseSupabaseContactRead,
  canUseSupabaseContactWrite,
  readContactFromSupabase,
  upsertContactInSupabase,
} from "@/lib/supabase-contact";
import type { ContactLinks } from "@/types/content";

type Body = {
  facebookUrl?: unknown;
  instagramUrl?: unknown;
};

export async function GET() {
  if (!canUseSupabaseContactRead()) {
    return NextResponse.json(
      { error: "Kontakt-links er ikke konfigureret (Supabase mangler)." },
      { status: 503 },
    );
  }
  try {
    const row = await readContactFromSupabase();
    if (!row) {
      return NextResponse.json({ facebookUrl: "", instagramUrl: "" } satisfies ContactLinks);
    }
    return NextResponse.json(row);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Kunne ikke hente kontakt-links.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!canUseSupabaseContactWrite()) {
    return NextResponse.json(
      { error: "Kan ikke gemme: Supabase service role mangler." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  let facebookUrl: string;
  let instagramUrl: string;
  try {
    facebookUrl = normalizeOptionalHttpUrl(typeof body.facebookUrl === "string" ? body.facebookUrl : "");
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_URL") {
      return NextResponse.json({ error: "Ugyldig Facebook-adresse." }, { status: 400 });
    }
    throw e;
  }
  try {
    instagramUrl = normalizeOptionalHttpUrl(typeof body.instagramUrl === "string" ? body.instagramUrl : "");
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_URL") {
      return NextResponse.json({ error: "Ugyldig Instagram-adresse." }, { status: 400 });
    }
    throw e;
  }

  try {
    const saved = await upsertContactInSupabase({ facebookUrl, instagramUrl });
    revalidatePath("/kontakt");
    revalidatePath("/admin/kontakt");
    return NextResponse.json(saved);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Kunne ikke gemme.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
