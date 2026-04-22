/**
 * Supabase (manuel SQL i editor):
 * -- ALTER TABLE jewelry ADD COLUMN sold boolean DEFAULT false;
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { slugIdFromTitle } from "@/lib/ids";
import { requireAdmin } from "@/lib/require-admin";
import {
  readJewelry,
  revalidatePublicContent,
  writeJewelry,
} from "@/lib/store";
import {
  canUseSupabaseJewelryWrite,
  createJewelryInSupabase,
  readJewelryFromSupabase,
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
    return "Gem fejlede: serveren kan ikke skrive til data/jewelry.json i dette miljø. Brug Supabase til smykker i produktion.";
  }
  if (msg.includes("relation") && msg.includes("jewelry")) {
    return 'Supabase fejl: tabel "jewelry" findes ikke. Opret tabellen først.';
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
  const image = String(body.image ?? "").trim();
  const price = Number(body.price);
  const createdAt =
    typeof body.createdAt === "string" && body.createdAt
      ? body.createdAt
      : new Date().toISOString().slice(0, 10);

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
    const items = canUseSupabaseJewelryWrite()
      ? await readJewelryFromSupabase()
      : await readJewelry();
    let id = slugIdFromTitle(title);
    while (items.some((p) => p.id === id)) {
      id = `${id}-x`;
    }

    const sold = typeof body.sold === "boolean" ? body.sold : false;

    const jewelry: Jewelry = {
      id,
      title,
      description,
      image,
      price,
      createdAt,
      sold,
    };

    if (canUseSupabaseJewelryWrite()) {
      const inserted = await createJewelryInSupabase(jewelry);
      revalidatePublicContent();
      revalidatePath(`/smykker/${id}`);
      return NextResponse.json(inserted);
    }

    items.push(jewelry);
    await writeJewelry(items);
    revalidatePublicContent();
    revalidatePath(`/smykker/${id}`);
    return NextResponse.json(jewelry);
  } catch (error) {
    return NextResponse.json({ error: persistErrorMessage(error) }, { status: 500 });
  }
}
