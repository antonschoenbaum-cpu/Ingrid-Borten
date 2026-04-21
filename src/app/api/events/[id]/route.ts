import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  readEvents,
  revalidatePublicContent,
  writeEvents,
} from "@/lib/store";
import type { EventItem } from "@/types/content";

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

  const items = await readEvents();
  const idx = items.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  const title = String(body.title ?? items[idx].title).trim();
  const description =
    typeof body.description === "string"
      ? body.description
      : items[idx].description;
  const date = String(body.date ?? items[idx].date).trim();
  const location = String(body.location ?? items[idx].location).trim();
  const imageRaw = body.image;
  let image: string | null | undefined = items[idx].image;
  if (imageRaw === null) image = null;
  else if (typeof imageRaw === "string") {
    const t = imageRaw.trim();
    image = t === "" ? null : t;
  }

  if (!title || !date || !location) {
    return NextResponse.json(
      { error: "Titel, dato og sted er påkrævet" },
      { status: 400 },
    );
  }

  const updated: EventItem = {
    id,
    title,
    description,
    date,
    location,
    image: image ?? null,
  };
  items[idx] = updated;
  await writeEvents(items);
  revalidatePublicContent();
  revalidatePath("/begivenheder");
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const items = await readEvents();
  const next = items.filter((e) => e.id !== id);
  if (next.length === items.length) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }
  await writeEvents(next);
  revalidatePublicContent();
  revalidatePath("/begivenheder");
  return NextResponse.json({ ok: true });
}
