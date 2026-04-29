import { NextRequest, NextResponse } from "next/server";
import { createShipmentForOrder } from "@/lib/shipmondo";
import { requireAdmin } from "@/lib/require-admin";

type Body = { order_id?: unknown };

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }
  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  if (!orderId) return NextResponse.json({ error: "order_id mangler." }, { status: 400 });

  try {
    const result = await createShipmentForOrder(orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

