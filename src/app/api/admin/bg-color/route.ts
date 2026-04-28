import { NextRequest, NextResponse } from "next/server";
import {
  getStoredBackgroundColor,
  normalizeHexColor,
  saveBackgroundColor,
} from "@/lib/colors";
import { requireAdmin } from "@/lib/require-admin";

type Payload = {
  bgColor?: unknown;
};

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const bgColor = await getStoredBackgroundColor();
  return NextResponse.json({ bgColor });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const bgColor = normalizeHexColor(typeof body.bgColor === "string" ? body.bgColor : "");
  try {
    const saved = await saveBackgroundColor(bgColor);
    return NextResponse.json({ bgColor: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke gemme farve.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
