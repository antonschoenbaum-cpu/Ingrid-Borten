/**
 * Supabase (manuel SQL i editor):
 * -- ALTER TABLE paintings ADD COLUMN sold boolean DEFAULT false;
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateAndStoreBackgroundColorFromGallery } from "@/lib/colors";
import { requireAdmin } from "@/lib/require-admin";
import { generateSeoDescription } from "@/lib/seo";
import {
  readPaintings,
  revalidatePublicContent,
  writePaintings,
} from "@/lib/store";
import {
  canUseSupabaseWrite,
  deletePaintingInSupabase,
  readPaintingsFromSupabase,
  updatePaintingInSupabase,
} from "@/lib/supabase-paintings";
import type { Painting } from "@/types/content";

function writeErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("EROFS") ||
    msg.includes("/var/task") ||
    msg.includes("read-only") ||
    msg.includes("ENOENT")
  ) {
    return "Gem fejlede: serveren kan ikke skrive til data/paintings.json i dette miljø. Brug en database (fx Supabase) til produktdata i produktion.";
  }
  if (msg.includes("relation") && msg.includes("paintings")) {
    return 'Supabase fejl: tabel "paintings" findes ikke. Opret tabellen først.';
  }
  return `Gem fejlede på serveren: ${msg}`;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const items = canUseSupabaseWrite()
    ? await readPaintingsFromSupabase()
    : await readPaintings();
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  const title = String(body.title ?? items[idx].title).trim();
  const description =
    typeof body.description === "string" ? body.description : items[idx].description;
  const image = String(body.image ?? items[idx].image).trim();
  const price =
    body.price !== undefined ? Number(body.price) : items[idx].price;
  const createdAt =
    typeof body.createdAt === "string" ? body.createdAt : items[idx].createdAt;
  const sold =
    typeof body.sold === "boolean" ? body.sold : (items[idx].sold ?? false);

  const prev = items[idx];
  let seoDescription: string | null | undefined;
  if (typeof body.seoDescription === "string") {
    seoDescription = body.seoDescription;
  } else {
    const titleChanged = title !== prev.title;
    const descriptionChanged = description !== prev.description;
    if (titleChanged || descriptionChanged) {
      seoDescription = await generateSeoDescription(title, description, "maleri");
    } else {
      seoDescription = prev.seoDescription ?? null;
    }
  }

  if (!title) {
    return NextResponse.json({ error: "Titel påkrævet" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Billede påkrævet" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Ugyldig pris" }, { status: 400 });
  }

  try {
    const updated: Painting = {
      id,
      title,
      description,
      seoDescription,
      image,
      price,
      createdAt,
      sold,
    };
    if (canUseSupabaseWrite()) {
      const saved = await updatePaintingInSupabase(updated);
      void generateAndStoreBackgroundColorFromGallery().catch(() => {});
      revalidatePublicContent();
      revalidatePath(`/malerier/${id}`);
      return NextResponse.json(saved);
    }
    items[idx] = updated;
    await writePaintings(items);
    revalidatePublicContent();
    revalidatePath(`/malerier/${id}`);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: writeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const items = canUseSupabaseWrite()
    ? await readPaintingsFromSupabase()
    : await readPaintings();
  const next = items.filter((p) => p.id !== id);
  if (next.length === items.length) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }
  try {
    if (canUseSupabaseWrite()) {
      await deletePaintingInSupabase(id);
    } else {
      await writePaintings(next);
    }
    revalidatePublicContent();
    revalidatePath(`/malerier/${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: writeErrorMessage(error) }, { status: 500 });
  }
}
