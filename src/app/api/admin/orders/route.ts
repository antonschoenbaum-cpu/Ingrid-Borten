import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listOrders } from "@/lib/orders";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

