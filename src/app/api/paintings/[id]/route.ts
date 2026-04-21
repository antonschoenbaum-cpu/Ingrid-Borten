/**
 * Supabase (manuel SQL i editor):
 * -- ALTER TABLE paintings ADD COLUMN sold boolean DEFAULT false;
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  readPaintings,
  revalidatePublicContent,
  writePaintings,
} from "@/lib/store";
import type { Painting } from "@/types/content";

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

  const items = await readPaintings();
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

  if (!title) {
    return NextResponse.json({ error: "Titel påkrævet" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Billede påkrævet" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Ugyldig pris" }, { status: 400 });
  }

  const updated: Painting = {
    id,
    title,
    description,
    image,
    price,
    createdAt,
    sold,
  };
  items[idx] = updated;
  await writePaintings(items);
  revalidatePublicContent();
  revalidatePath(`/malerier/${id}`);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const items = await readPaintings();
  const next = items.filter((p) => p.id !== id);
  if (next.length === items.length) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }
  await writePaintings(next);
  revalidatePublicContent();
  revalidatePath(`/malerier/${id}`);
  return NextResponse.json({ ok: true });
}
