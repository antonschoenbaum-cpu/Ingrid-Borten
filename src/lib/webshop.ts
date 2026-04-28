import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeHexColor } from "@/lib/colors";

export type ProductType = "paintings" | "jewelry";

export type WebshopProduct = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  sold: boolean;
  stock: number;
  stripePriceId: string | null;
};

export type ArtistSettings = {
  paymentsEnabled: boolean;
  stripeAccountId: string | null;
  bankRegNumber: string;
  bankAccountNumber: string;
  onboardingComplete: boolean;
  shipmondoApiUser: string;
  shipmondoApiKey: string;
  artistAddress: string;
  artistZip: string;
  artistCity: string;
  bgColor: string;
};

function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}
function serviceRole(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}
function anonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

export function getSupabaseServiceClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRole(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseReadClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRole() || anonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function tableForProduct(type: ProductType): "paintings" | "jewelry" {
  return type === "paintings" ? "paintings" : "jewelry";
}

export async function readProductById(
  type: ProductType,
  id: string,
  useService = false,
): Promise<WebshopProduct | null> {
  const supabase = useService ? getSupabaseServiceClient() : getSupabaseReadClient();
  const { data, error } = await supabase
    .from(tableForProduct(type))
    .select("id,title,description,image,price,sold,stock,stripe_price_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    title: data.title as string,
    description: (data.description as string) ?? "",
    image: data.image as string,
    price: Number(data.price),
    sold: data.sold === true,
    stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 1,
    stripePriceId: (data.stripe_price_id as string | null | undefined) ?? null,
  };
}

export async function readArtistSettings(useService = false): Promise<ArtistSettings> {
  const supabase = useService ? getSupabaseServiceClient() : getSupabaseReadClient();
  const defaults: ArtistSettings = {
    paymentsEnabled: false,
    stripeAccountId: null,
    bankRegNumber: "",
    bankAccountNumber: "",
    onboardingComplete: false,
    shipmondoApiUser: "",
    shipmondoApiKey: "",
    artistAddress: "",
    artistZip: "",
    artistCity: "",
    bgColor: "#F5F0EB",
  };
  const { data, error } = await supabase
    .from("artist_settings")
    .select(
      "payments_enabled,stripe_account_id,bank_reg_number,bank_account_number,onboarding_complete,shipmondo_api_user,shipmondo_api_key,artist_address,artist_zip,artist_city,bg_color",
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
    shipmondoApiUser:
      (data.shipmondo_api_user as string | null | undefined) ??
      (process.env.SHIPMONDO_API_USER ?? ""),
    shipmondoApiKey:
      (data.shipmondo_api_key as string | null | undefined) ??
      (process.env.SHIPMONDO_API_KEY ?? ""),
    artistAddress: (data.artist_address as string | null | undefined) ?? "",
    artistZip: (data.artist_zip as string | null | undefined) ?? "",
    artistCity: (data.artist_city as string | null | undefined) ?? "",
    bgColor: normalizeHexColor((data.bg_color as string | null | undefined) ?? "#F5F0EB"),
  };
}

