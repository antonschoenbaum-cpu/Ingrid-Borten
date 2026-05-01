import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/require-admin";
import { createClient } from "@supabase/supabase-js";
import { resendFromHeader } from "@/lib/resend-from";

type Payload = {
  paymentsEnabled?: unknown;
  payoutMobile?: unknown;
  artistAddress?: unknown;
  artistZip?: unknown;
  artistCity?: unknown;
  requestPayout?: unknown;
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

function dkkFromOre(ore: number): string {
  return (ore / 100).toLocaleString("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

  if (body.requestPayout === true) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: row, error: selErr } = await supabase
        .from("artist_settings")
        .select("pending_payout,payout_mobile")
        .eq("id", "main")
        .maybeSingle();
      if (selErr) throw new Error(selErr.message);
      const pendingOre = Number(row?.pending_payout ?? 0);
      const mobile = asTrimmedString(row?.payout_mobile as string | undefined);
      if (!Number.isFinite(pendingOre) || pendingOre <= 0) {
        return NextResponse.json({ error: "Der er ingen afventende udbetaling." }, { status: 400 });
      }
      if (mobile.length !== 8) {
        return NextResponse.json(
          { error: "Udfyld et gyldigt 8-cifret MobilePay-nummer først." },
          { status: 400 },
        );
      }

      const key = (process.env.RESEND_API_KEY ?? "").trim();
      const to = (process.env.CONTACT_EMAIL ?? "").trim();
      const artistName = (process.env.ARTIST_NAME ?? "Kunstner").trim() || "Kunstner";
      if (!key || !to) {
        throw new Error("RESEND_API_KEY eller CONTACT_EMAIL mangler.");
      }
      const resend = new Resend(key);
      const kr = dkkFromOre(pendingOre);
      await resend.emails.send({
        from: resendFromHeader(),
        to,
        subject: `Udbetalingsanmodning — ${artistName}`,
        text: `Kunstner ${artistName} anmoder om udbetaling af ${kr} kr. til MobilePay ${mobile}`,
      });

      const { error: upErr } = await supabase
        .from("artist_settings")
        .update({ pending_payout: 0 })
        .eq("id", "main");
      if (upErr) throw new Error(upErr.message);

      return NextResponse.json({ ok: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ukendt fejl";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const paymentsEnabled = typeof body.paymentsEnabled === "boolean" ? body.paymentsEnabled : undefined;
  const payoutMobileRaw = normalizeDigits(asTrimmedString(body.payoutMobile));
  const wantsPayoutMobile = body.payoutMobile !== undefined;
  const artistAddress = asTrimmedString(body.artistAddress);
  const artistZip = normalizeDigits(asTrimmedString(body.artistZip));
  const artistCity = asTrimmedString(body.artistCity);

  if (wantsPayoutMobile) {
    if (payoutMobileRaw.length !== 8) {
      return NextResponse.json({ error: "MobilePay-nummer skal være præcis 8 cifre." }, { status: 400 });
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
    const payload: Record<string, unknown> = { id: "main" };
    if (paymentsEnabled !== undefined) payload.payments_enabled = paymentsEnabled;
    if (wantsPayoutMobile) payload.payout_mobile = payoutMobileRaw;
    if (wantsAddressSetup) {
      payload.artist_address = artistAddress;
      payload.artist_zip = artistZip;
      payload.artist_city = artistCity;
    }

    const { error: upsertError } = await supabase.from("artist_settings").upsert(payload, { onConflict: "id" });
    if (upsertError) throw new Error(upsertError.message);

    return NextResponse.json({ ok: true });
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
        "payments_enabled,pending_payout,total_earned,payout_mobile,artist_address,artist_zip,artist_city",
      )
      .eq("id", "main")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      paymentsEnabled: data?.payments_enabled === true,
      pendingPayoutOre: Number(data?.pending_payout ?? 0),
      totalEarnedOre: Number(data?.total_earned ?? 0),
      payoutMobile: (data?.payout_mobile as string | null | undefined) ?? "",
      artistAddress: (data?.artist_address as string | null | undefined) ?? "",
      artistZip: (data?.artist_zip as string | null | undefined) ?? "",
      artistCity: (data?.artist_city as string | null | undefined) ?? "",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
