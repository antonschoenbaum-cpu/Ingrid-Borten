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
  const date = String(body.date ?? "").trim();
  const location = String(body.location ?? "").trim();
  const imageRaw = body.image;
  const image =
    imageRaw === null || imageRaw === undefined || imageRaw === ""
      ? null
      : String(imageRaw).trim() || null;

  if (!title || !date || !location) {
    return NextResponse.json(
      { error: "Titel, dato og sted er påkrævet" },
      { status: 400 },
    );
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
    date,
    location,
    image,
  };
  items.push(event);
  await writeEvents(items);
  revalidatePublicContent();
  revalidatePath(`/begivenheder`);
  return NextResponse.json(event);
}
