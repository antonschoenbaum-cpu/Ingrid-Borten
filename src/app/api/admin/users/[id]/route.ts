import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/require-admin";
import {
  canUseSupabaseAdminUsers,
  deleteAdminUserById,
} from "@/lib/supabase-admin-users";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!canUseSupabaseAdminUsers()) {
    return NextResponse.json(
      { error: "Admin-brugere kræver SUPABASE_SERVICE_ROLE_KEY og SUPABASE_URL." },
      { status: 500 },
    );
  }

  const session = await auth();
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Manglende bruger-id." }, { status: 400 });
  }
  if (session?.user?.id === id) {
    return NextResponse.json({ error: "Du kan ikke slette dig selv." }, { status: 400 });
  }

  try {
    await deleteAdminUserById(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
