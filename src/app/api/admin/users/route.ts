import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/require-admin";
import {
  canUseSupabaseAdminUsers,
  createAdminUser,
  listAdminUsers,
} from "@/lib/supabase-admin-users";

type CreateBody = {
  username?: unknown;
  password?: unknown;
};

function toString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!canUseSupabaseAdminUsers()) {
    return NextResponse.json(
      { error: "Admin-brugere kræver SUPABASE_SERVICE_ROLE_KEY og SUPABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const users = await listAdminUsers();
    const session = await auth();
    return NextResponse.json({
      users,
      currentUserId: session?.user?.id ?? null,
      currentUsername: session?.user?.name ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!canUseSupabaseAdminUsers()) {
    return NextResponse.json(
      { error: "Admin-brugere kræver SUPABASE_SERVICE_ROLE_KEY og SUPABASE_URL." },
      { status: 500 },
    );
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const username = toString(body.username);
  const password = toString(body.password);

  if (!username || !password) {
    return NextResponse.json({ error: "Brugernavn og adgangskode er påkrævet." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Adgangskoden skal være mindst 8 tegn." },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hash(password, 10);
    const session = await auth();
    const createdBy = session?.user?.name ?? "admin";
    await createAdminUser({ username, passwordHash, createdBy });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    if (msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Brugernavnet findes allerede." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
