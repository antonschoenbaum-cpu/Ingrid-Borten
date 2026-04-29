import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ContactLinks } from "@/types/content";

type ContactRow = {
  id: string;
  facebook_url: string | null;
  instagram_url: string | null;
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

export function canUseSupabaseContactRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

export function canUseSupabaseContactWrite(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && supabaseServiceRoleKey().length > 0;
}

function getReadClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey() || supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getWriteClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapRow(r: ContactRow): ContactLinks {
  return {
    facebookUrl: r.facebook_url ?? "",
    instagramUrl: r.instagram_url ?? "",
  };
}

export async function readContactFromSupabase(): Promise<ContactLinks | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("contact_settings")
    .select("id,facebook_url,instagram_url")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as ContactRow);
}

export async function upsertContactInSupabase(links: ContactLinks): Promise<ContactLinks> {
  const supabase = getWriteClient();
  const payload = {
    id: "main",
    facebook_url: links.facebookUrl || null,
    instagram_url: links.instagramUrl || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("contact_settings")
    .upsert(payload, { onConflict: "id" })
    .select("id,facebook_url,instagram_url")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as ContactRow);
}
