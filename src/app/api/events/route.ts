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

  const err = validateEventInput({ title, location, start_date, end_date });
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const items = await readEvents();
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
  items.push(event);
  await writeEvents(items);
  revalidatePublicContent();
  revalidatePath(`/begivenheder`);
  return NextResponse.json(event);
}
