/*
-- Supabase migration (reference):
-- ALTER TABLE events ADD COLUMN start_date timestamptz;
-- ALTER TABLE events ADD COLUMN end_date date;
-- ALTER TABLE events DROP COLUMN event_date;
*/

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import {
  readEvents,
  revalidatePublicContent,
  writeEvents,
} from "@/lib/store";
import type { EventItem } from "@/types/content";

function normalizeStartDate(s: string): string {
  const t = s.trim();
  if (t.length === 16 && t[13] === ":") return `${t}:00`;
  return t;
}

function normalizeEndDateYmd(s: string): string {
  return s.trim().slice(0, 10);
}

function validateEventInput(input: {
  title: string;
  location: string;
  start_date: string;
  end_date: string;
}): string | null {
  const { title, location, start_date, end_date } = input;
  if (!title || !location || !start_date || !end_date) {
    return "Titel, startdato med tid, slutdato og sted er påkrævet";
  }
  const end = normalizeEndDateYmd(end_date);
  const startDay = start_date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return "Ugyldig slutdato";
  }
  if (end < startDay) {
    return "Slutdato kan ikke være før startdato";
  }
  return null;
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

  const items = await readEvents();
  const idx = items.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  const cur = items[idx];
  const title = String(body.title ?? cur.title).trim();
  const description =
    typeof body.description === "string" ? body.description : cur.description;
  const start_date = normalizeStartDate(
    String(body.start_date ?? cur.start_date).trim(),
  );
  const end_date = normalizeEndDateYmd(
    String(body.end_date ?? cur.end_date).trim(),
  );
  const location = String(body.location ?? cur.location).trim();
  const imageRaw = body.image;
  let image: string | null | undefined = cur.image;
  if (imageRaw === null) image = null;
  else if (typeof imageRaw === "string") {
    const t = imageRaw.trim();
    image = t === "" ? null : t;
  }

  const verr = validateEventInput({ title, location, start_date, end_date });
  if (verr) {
    return NextResponse.json({ error: verr }, { status: 400 });
  }

  const updated: EventItem = {
    id,
    title,
    description,
    start_date,
    end_date,
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
