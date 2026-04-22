/*
-- Supabase migration (reference):
-- ALTER TABLE events ADD COLUMN start_date timestamptz;
-- ALTER TABLE events ADD COLUMN end_date date;
-- ALTER TABLE events DROP COLUMN event_date;
*/

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { slugIdFromTitle } from "@/lib/ids";
import { requireAdmin } from "@/lib/require-admin";
import {
  readEvents,
  revalidatePublicContent,
  writeEvents,
} from "@/lib/store";
import {
  canUseSupabaseEventsWrite,
  createEventInSupabase,
  readEventsFromSupabase,
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
    return "Gem fejlede: serveren kan ikke skrive til data/events.json i dette miljø. Brug Supabase til begivenheder i produktion.";
  }
  if (msg.includes("relation") && msg.includes("events")) {
    return 'Supabase fejl: tabel "events" findes ikke. Opret tabellen først.';
  }
  return `Gem fejlede på serveren: ${msg}`;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "");
  const start_date = normalizeStartDate(String(body.start_date ?? "").trim());
  const end_date = normalizeEndDateYmd(String(body.end_date ?? "").trim());
  const location = String(body.location ?? "").trim();
  const imageRaw = body.image;
  const image =
    imageRaw === null || imageRaw === undefined || imageRaw === ""
      ? null
      : String(imageRaw).trim() || null;

  const verr = validateEventInput({ title, location, start_date, end_date });
  if (verr) {
    return NextResponse.json({ error: verr }, { status: 400 });
  }

  try {
    const items = canUseSupabaseEventsWrite()
      ? await readEventsFromSupabase()
      : await readEvents();
    let id = `evt-${slugIdFromTitle(title)}`;
    while (items.some((e) => e.id === id)) {
      id = `${id}-x`;
    }

    const event: EventItem = {
      id,
      title,
      description,
      start_date,
      end_date,
      location,
      image,
    };

    if (canUseSupabaseEventsWrite()) {
      const inserted = await createEventInSupabase(event);
      revalidatePublicContent();
      revalidatePath(`/begivenheder`);
      return NextResponse.json(inserted);
    }

    items.push(event);
    await writeEvents(items);
    revalidatePublicContent();
    revalidatePath(`/begivenheder`);
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}
