import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/require-admin";
import { createClient } from "@supabase/supabase-js";

type Payload = {
  paymentsEnabled?: unknown;
  connectStripe?: unknown;
  artistAddress?: unknown;
  artistZip?: unknown;
  artistCity?: unknown;
};

function asTrimmedString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function getSupabaseAdmin() {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error("Supabase mangler (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getStripeClient() {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY mangler.");
  return new Stripe(key);
}

function getPublicSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  if (!raw) {
    throw new Error("NEXT_PUBLIC_SITE_URL mangler (bruges til Stripe onboarding-URL'er).");
  }
  return raw;
}

async function createStripeOnboardingLink(): Promise<string> {
  const stripe = getStripeClient();
  const supabase = getSupabaseAdmin();
  const siteUrl = getPublicSiteUrl();

  const { data: existingRow, error: selectError } = await supabase
    .from("artist_settings")
    .select("stripe_account_id")
    .eq("id", "main")
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);

  let accountId = (existingRow?.stripe_account_id as string | null | undefined) ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      country: "DK",
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    const { error: upsertError } = await supabase.from("artist_settings").upsert(
      { id: "main", stripe_account_id: accountId },
      { onConflict: "id" },
    );
    if (upsertError) throw new Error(upsertError.message);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/admin/betaling`,
    return_url: `${siteUrl}/admin/betaling?onboarding=complete`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  if (body.connectStripe === true) {
    try {
      const url = await createStripeOnboardingLink();
      return NextResponse.json({ url });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ukendt fejl";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const paymentsEnabled = typeof body.paymentsEnabled === "boolean" ? body.paymentsEnabled : undefined;
  const artistAddress = asTrimmedString(body.artistAddress);
  const artistZip = normalizeDigits(asTrimmedString(body.artistZip));
  const artistCity = asTrimmedString(body.artistCity);

  const wantsAddressSetup = artistAddress || artistZip || artistCity;
  if (wantsAddressSetup) {
    if (!artistAddress || !artistZip || !artistCity) {
      return NextResponse.json(
        { error: "Udfyld vejnavn/nummer, postnummer og by." },
        { status: 400 },
      );
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: existingRow, error: selectError } = await supabase
      .from("artist_settings")
      .select("stripe_account_id")
      .eq("id", "main")
      .maybeSingle();
    if (selectError) throw new Error(selectError.message);

    const stripeAccountId = (existingRow?.stripe_account_id as string | null | undefined) ?? null;

    const payload: Record<string, unknown> = { id: "main" };
    if (paymentsEnabled !== undefined) payload.payments_enabled = paymentsEnabled;
    if (wantsAddressSetup) {
      payload.artist_address = artistAddress;
      payload.artist_zip = artistZip;
      payload.artist_city = artistCity;
    }

    const { error: upsertError } = await supabase.from("artist_settings").upsert(payload, { onConflict: "id" });
    if (upsertError) throw new Error(upsertError.message);

    return NextResponse.json({
      ok: true,
      stripeAccountId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("artist_settings")
      .select(
        "payments_enabled,stripe_account_id,bank_reg_number,bank_account_number,onboarding_complete,artist_address,artist_zip,artist_city",
      )
      .eq("id", "main")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      paymentsEnabled: data?.payments_enabled === true,
      stripeAccountId: (data?.stripe_account_id as string | null | undefined) ?? null,
      bankRegNumber: (data?.bank_reg_number as string | null | undefined) ?? "",
      bankAccountNumber: (data?.bank_account_number as string | null | undefined) ?? "",
      onboardingComplete: data?.onboarding_complete === true,
      artistAddress: (data?.artist_address as string | null | undefined) ?? "",
      artistZip: (data?.artist_zip as string | null | undefined) ?? "",
      artistCity: (data?.artist_city as string | null | undefined) ?? "",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
