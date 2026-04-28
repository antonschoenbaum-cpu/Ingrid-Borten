/**
 * Supabase (manuel SQL i editor):
 * -- ALTER TABLE jewelry ADD COLUMN sold boolean DEFAULT false;
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateAndStoreBackgroundColorFromGallery } from "@/lib/colors";
import { requireAdmin } from "@/lib/require-admin";
import { generateSeoDescription } from "@/lib/seo";
import {
  readJewelry,
  revalidatePublicContent,
  writeJewelry,
} from "@/lib/store";
import {
  canUseSupabaseJewelryWrite,
  deleteJewelryInSupabase,
  readJewelryFromSupabase,
  updateJewelryInSupabase,
} from "@/lib/supabase-jewelry";
import type { Jewelry } from "@/types/content";

function persistErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("EROFS") ||
    msg.includes("/var/task") ||
    msg.includes("read-only") ||
    msg.includes("ENOENT")
  ) {
    return "Handling fejlede: serveren kan ikke skrive til data/jewelry.json i dette miljø. Brug Supabase til smykker i produktion.";
  }
  if (msg.includes("relation") && msg.includes("jewelry")) {
    return 'Supabase fejl: tabel "jewelry" findes ikke. Opret tabellen først.';
  }
  return `Handling fejlede på serveren: ${msg}`;
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

  const items = canUseSupabaseJewelryWrite()
    ? await readJewelryFromSupabase()
    : await readJewelry();
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
  const seoDescription =
    typeof body.seoDescription === "string"
      ? body.seoDescription
      : await generateSeoDescription(title, description, "smykke");

  if (!title) {
    return NextResponse.json({ error: "Titel påkrævet" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Billede påkrævet" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Ugyldig pris" }, { status: 400 });
  }

  const updated: Jewelry = {
    id,
    title,
    description,
    seoDescription,
    image,
    price,
    createdAt,
    sold,
  };

  try {
    if (canUseSupabaseJewelryWrite()) {
      const saved = await updateJewelryInSupabase(updated);
      void generateAndStoreBackgroundColorFromGallery().catch(() => {});
      revalidatePublicContent();
      revalidatePath(`/smykker/${id}`);
      return NextResponse.json(saved);
    }
    items[idx] = updated;
    await writeJewelry(items);
    revalidatePublicContent();
    revalidatePath(`/smykker/${id}`);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const items = canUseSupabaseJewelryWrite()
    ? await readJewelryFromSupabase()
    : await readJewelry();
  const exists = items.some((p) => p.id === id);
  if (!exists) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  try {
    if (canUseSupabaseJewelryWrite()) {
      await deleteJewelryInSupabase(id);
    } else {
      const next = items.filter((p) => p.id !== id);
      await writeJewelry(next);
    }
    revalidatePublicContent();
    revalidatePath(`/smykker/${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}
