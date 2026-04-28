import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Jewelry } from "@/types/content";

/*
 * SQL: se sql/supabase-jewelry-setup.sql
 */

type JewelryRow = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  created_at: string;
  sold: boolean | null;
  stock: number | null;
  stripe_price_id: string | null;
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

export function canUseSupabaseJewelryRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

export function canUseSupabaseJewelryWrite(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && supabaseServiceRoleKey().length > 0;
}

function getReadClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey() || supabaseAnonKey();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getWriteClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapRowToJewelry(r: JewelryRow): Jewelry {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    image: r.image,
    price: Number(r.price),
    createdAt: String(r.created_at).slice(0, 10),
    sold: r.sold === true,
    stock: Number.isFinite(Number(r.stock)) ? Number(r.stock) : 1,
    stripePriceId: r.stripe_price_id ?? null,
  };
}

export async function readJewelryFromSupabase(): Promise<Jewelry[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("jewelry")
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRowToJewelry(r as JewelryRow));
}

export async function createJewelryInSupabase(j: Jewelry): Promise<Jewelry> {
  const supabase = getWriteClient();
  const payload = {
    id: j.id,
    title: j.title,
    description: j.description,
    image: j.image,
    price: j.price,
    created_at: j.createdAt,
    sold: j.sold,
    stock: j.stock ?? 1,
    stripe_price_id: j.stripePriceId ?? null,
  };
  const { data, error } = await supabase
    .from("jewelry")
    .insert(payload)
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToJewelry(data as JewelryRow);
}

export async function updateJewelryInSupabase(j: Jewelry): Promise<Jewelry> {
  const supabase = getWriteClient();
  const payload = {
    title: j.title,
    description: j.description,
    image: j.image,
    price: j.price,
    created_at: j.createdAt,
    sold: j.sold,
    stock: j.stock ?? 1,
    stripe_price_id: j.stripePriceId ?? null,
  };
  const { data, error } = await supabase
    .from("jewelry")
    .update(payload)
    .eq("id", j.id)
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToJewelry(data as JewelryRow);
}

export async function deleteJewelryInSupabase(id: string): Promise<void> {
  const supabase = getWriteClient();
  const { error } = await supabase.from("jewelry").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
