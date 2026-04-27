import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

type RequestBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmNewPassword?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

async function updatePasswordInVercel(newPassword: string): Promise<boolean> {
  const token = (process.env.VERCEL_TOKEN ?? "").trim();
  const projectId = (process.env.VERCEL_PROJECT_ID ?? "").trim();
  const teamId = (process.env.VERCEL_TEAM_ID ?? "").trim();

  if (!token || !projectId) return false;

  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const environments = ["production", "preview", "development"] as const;
  const createCalls = environments.map((target) =>
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "ADMIN_PASSWORD",
        value: newPassword,
        target: [target],
        type: "encrypted",
      }),
    }),
  );

  const results = await Promise.allSettled(createCalls);
  return results.every((r) => r.status === "fulfilled" && r.value.ok);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const currentFromEnv = process.env.ADMIN_PASSWORD ?? "";
  if (!currentFromEnv) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD er ikke sat i miljøvariabler." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const currentPassword = asString(body.currentPassword).trim();
  const newPassword = asString(body.newPassword).trim();
  const confirmNewPassword = asString(body.confirmNewPassword).trim();

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return NextResponse.json({ error: "Alle felter er påkrævet." }, { status: 400 });
  }
  if (newPassword !== confirmNewPassword) {
    return NextResponse.json(
      { error: "Ny adgangskode og bekræftelse er ikke ens." },
      { status: 400 },
    );
  }
  if (currentPassword !== currentFromEnv) {
    return NextResponse.json({ error: "Nuværende adgangskode er forkert." }, { status: 401 });
  }

  try {
    const updated = await updatePasswordInVercel(newPassword);
    if (updated) {
      return NextResponse.json({
        ok: true,
        message:
          "Adgangskoden er opdateret via Vercel API. Redeploy siden for at bruge den nye adgangskode.",
      });
    }
  } catch {
    // Falder tilbage til manuel besked.
  }

  return NextResponse.json({
    ok: true,
    message: `Din nye adgangskode er: ${newPassword} - opdater ADMIN_PASSWORD i Vercel dashboard under Settings -> Environment Variables, og redeploy siden`,
  });
}
