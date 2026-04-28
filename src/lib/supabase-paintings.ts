import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Painting } from "@/types/content";

type PaintingRow = {
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

export function canUseSupabaseRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

export function canUseSupabaseWrite(): boolean {
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

function mapRowToPainting(r: PaintingRow): Painting {
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

export async function readPaintingsFromSupabase(): Promise<Painting[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("paintings")
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRowToPainting(r as PaintingRow));
}

export async function createPaintingInSupabase(p: Painting): Promise<Painting> {
  const supabase = getWriteClient();
  const payload = {
    id: p.id,
    title: p.title,
    description: p.description,
    image: p.image,
    price: p.price,
    created_at: p.createdAt,
    sold: p.sold,
    stock: p.stock ?? 1,
    stripe_price_id: p.stripePriceId ?? null,
  };
  const { data, error } = await supabase
    .from("paintings")
    .insert(payload)
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToPainting(data as PaintingRow);
}

export async function updatePaintingInSupabase(p: Painting): Promise<Painting> {
  const supabase = getWriteClient();
  const payload = {
    title: p.title,
    description: p.description,
    image: p.image,
    price: p.price,
    created_at: p.createdAt,
    sold: p.sold,
    stock: p.stock ?? 1,
    stripe_price_id: p.stripePriceId ?? null,
  };
  const { data, error } = await supabase
    .from("paintings")
    .update(payload)
    .eq("id", p.id)
    .select("id,title,description,image,price,created_at,sold,stock,stripe_price_id")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToPainting(data as PaintingRow);
}

export async function deletePaintingInSupabase(id: string): Promise<void> {
  const supabase = getWriteClient();
  const { error } = await supabase.from("paintings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

