import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ArtistSettings = {
  paymentsEnabled: boolean;
  stripeAccountId: string | null;
  bankRegNumber: string;
  bankAccountNumber: string;
  onboardingComplete: boolean;
  artistAddress: string;
  artistZip: string;
  artistCity: string;
};

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();
}

function supabaseAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

function supabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

function hasValidUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function canUseRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

function getReadClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey() || supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readArtistSettings(): Promise<ArtistSettings> {
  const defaults: ArtistSettings = {
    paymentsEnabled: false,
    stripeAccountId: null,
    bankRegNumber: "",
    bankAccountNumber: "",
    onboardingComplete: false,
    artistAddress: "",
    artistZip: "",
    artistCity: "",
  };
  if (!canUseRead()) return defaults;

  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("artist_settings")
    .select(
      "payments_enabled,stripe_account_id,bank_reg_number,bank_account_number,onboarding_complete,artist_address,artist_zip,artist_city",
    )
    .eq("id", "main")
    .maybeSingle();
  if (error || !data) return defaults;

  return {
    paymentsEnabled: data.payments_enabled === true,
    stripeAccountId: (data.stripe_account_id as string | null | undefined) ?? null,
    bankRegNumber: (data.bank_reg_number as string | null | undefined) ?? "",
    bankAccountNumber: (data.bank_account_number as string | null | undefined) ?? "",
    onboardingComplete: data.onboarding_complete === true,
    artistAddress: (data.artist_address as string | null | undefined) ?? "",
    artistZip: (data.artist_zip as string | null | undefined) ?? "",
    artistCity: (data.artist_city as string | null | undefined) ?? "",
  };
}

