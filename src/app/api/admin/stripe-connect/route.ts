import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/require-admin";
import { createClient } from "@supabase/supabase-js";

type Payload = {
  paymentsEnabled?: unknown;
  regNumber?: unknown;
  accountNumber?: unknown;
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

async function getOrCreateStripeAccountId(params: {
  regNumber: string;
  accountNumber: string;
  existingStripeAccountId: string | null;
}) {
  const stripe = getStripeClient();
  const { regNumber, accountNumber, existingStripeAccountId } = params;
  if (existingStripeAccountId) return existingStripeAccountId;

  const account = await stripe.accounts.create({
    type: "custom",
    country: "DK",
    email: (process.env.CONTACT_EMAIL ?? undefined) || undefined,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    external_account: {
      object: "bank_account",
      country: "DK",
      currency: "dkk",
      account_holder_name: (process.env.ARTIST_NAME ?? "Kunstner").trim() || "Kunstner",
      account_holder_type: "individual",
      account_number: `${regNumber}${accountNumber}`,
    },
    business_type: "individual",
    tos_acceptance: {
      service_agreement: "recipient",
    },
  });

  return account.id;
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

  const regNumber = normalizeDigits(asTrimmedString(body.regNumber));
  const accountNumber = normalizeDigits(asTrimmedString(body.accountNumber));
  const paymentsEnabled = typeof body.paymentsEnabled === "boolean" ? body.paymentsEnabled : undefined;
  const artistAddress = asTrimmedString(body.artistAddress);
  const artistZip = normalizeDigits(asTrimmedString(body.artistZip));
  const artistCity = asTrimmedString(body.artistCity);

  const wantsBankSetup = regNumber.length > 0 || accountNumber.length > 0;
  if (wantsBankSetup) {
    if (regNumber.length !== 4) {
      return NextResponse.json({ error: "Registreringsnummer skal være præcis 4 cifre." }, { status: 400 });
    }
    if (accountNumber.length < 1 || accountNumber.length > 10) {
      return NextResponse.json({ error: "Kontonummer skal være mellem 1 og 10 cifre." }, { status: 400 });
    }
  }

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

    let stripeAccountId = (existingRow?.stripe_account_id as string | null | undefined) ?? null;

    if (wantsBankSetup) {
      stripeAccountId = await getOrCreateStripeAccountId({
        regNumber,
        accountNumber,
        existingStripeAccountId: stripeAccountId,
      });
    }

    const payload = {
      id: "main",
      payments_enabled: paymentsEnabled,
      stripe_account_id: stripeAccountId,
      bank_reg_number: wantsBankSetup ? regNumber : undefined,
      bank_account_number: wantsBankSetup ? accountNumber : undefined,
      onboarding_complete: wantsBankSetup ? true : undefined,
      artist_address: wantsAddressSetup ? artistAddress : undefined,
      artist_zip: wantsAddressSetup ? artistZip : undefined,
      artist_city: wantsAddressSetup ? artistCity : undefined,
    };

    const { error: upsertError } = await supabase
      .from("artist_settings")
      .upsert(payload, { onConflict: "id" });
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

