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
import {
  canUseSupabaseEventsWrite,
  deleteEventInSupabase,
  readEventsFromSupabase,
  updateEventInSupabase,
} from "@/lib/supabase-events";
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

function persistErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("EROFS") ||
    msg.includes("/var/task") ||
    msg.includes("read-only") ||
    msg.includes("ENOENT")
  ) {
    return "Handling fejlede: serveren kan ikke skrive til data/events.json i dette miljø. Brug Supabase til begivenheder i produktion.";
  }
  if (msg.includes("relation") && msg.includes("events")) {
    return 'Supabase fejl: tabel "events" findes ikke. Opret tabellen først.';
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

  const items = canUseSupabaseEventsWrite()
    ? await readEventsFromSupabase()
    : await readEvents();
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

  try {
    if (canUseSupabaseEventsWrite()) {
      const saved = await updateEventInSupabase(updated);
      revalidatePublicContent();
      revalidatePath("/begivenheder");
      return NextResponse.json(saved);
    }
    items[idx] = updated;
    await writeEvents(items);
    revalidatePublicContent();
    revalidatePath("/begivenheder");
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const items = canUseSupabaseEventsWrite()
    ? await readEventsFromSupabase()
    : await readEvents();
  const exists = items.some((e) => e.id === id);
  if (!exists) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  }

  try {
    if (canUseSupabaseEventsWrite()) {
      await deleteEventInSupabase(id);
    } else {
      const next = items.filter((e) => e.id !== id);
      await writeEvents(next);
    }
    revalidatePublicContent();
    revalidatePath("/begivenheder");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}
