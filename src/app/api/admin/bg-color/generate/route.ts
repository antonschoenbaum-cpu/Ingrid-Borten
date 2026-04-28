import { NextResponse } from "next/server";
import { generateAndStoreBackgroundColorFromGallery } from "@/lib/colors";
import { requireAdmin } from "@/lib/require-admin";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const bgColor = await generateAndStoreBackgroundColorFromGallery();
    return NextResponse.json({ bgColor });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke generere farve.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
