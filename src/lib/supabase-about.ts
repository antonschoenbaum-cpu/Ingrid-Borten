import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AboutData, CvEntry } from "@/types/content";

/*
 * SQL: se sql/supabase-about-setup.sql
 */

type AboutRow = {
  id: string;
  biography: string;
  artist_photo: string;
  cv_entries: unknown;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_description: string | null;
  hero_image_1: string | null;
  hero_image_2: string | null;
  hero_image_3: string | null;
  hero_image_4: string | null;
  hero_image_5: string | null;
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

export function canUseSupabaseAboutRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

export function canUseSupabaseAboutWrite(): boolean {
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

function isCvEntries(v: unknown): v is CvEntry[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof (e as CvEntry).id === "string" &&
      typeof (e as CvEntry).year === "string" &&
      typeof (e as CvEntry).text === "string",
  );
}

function mapRowToAbout(r: AboutRow): AboutData {
  const cv = r.cv_entries;
  return {
    biography: r.biography ?? "",
    artistPhoto: r.artist_photo ?? "",
    cvEntries: isCvEntries(cv) ? cv : [],
    heroTitle: r.hero_title ?? "",
    heroSubtitle: r.hero_subtitle ?? "",
    heroDescription: r.hero_description ?? "",
    heroImage1: r.hero_image_1 ?? "",
    heroImage2: r.hero_image_2 ?? "",
    heroImage3: r.hero_image_3 ?? "",
    heroImage4: r.hero_image_4 ?? "",
    heroImage5: r.hero_image_5 ?? "",
  };
}

/** Returnerer null hvis der ikke er en række endnu (brug JSON-fallback). */
export async function readAboutFromSupabase(): Promise<AboutData | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("about_content")
    .select(
      "id,biography,artist_photo,cv_entries,hero_title,hero_subtitle,hero_description,hero_image_1,hero_image_2,hero_image_3,hero_image_4,hero_image_5",
    )
    .eq("id", "main")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRowToAbout(data as AboutRow);
}

export async function upsertAboutInSupabase(data: AboutData): Promise<AboutData> {
  const supabase = getWriteClient();
  const payload = {
    id: "main",
    biography: data.biography,
    artist_photo: data.artistPhoto,
    cv_entries: data.cvEntries,
    hero_title: data.heroTitle ?? "",
    hero_subtitle: data.heroSubtitle ?? "",
    hero_description: data.heroDescription ?? "",
    hero_image_1: data.heroImage1 ?? "",
    hero_image_2: data.heroImage2 ?? "",
    hero_image_3: data.heroImage3 ?? "",
    hero_image_4: data.heroImage4 ?? "",
    hero_image_5: data.heroImage5 ?? "",
  };
  const { data: row, error } = await supabase
    .from("about_content")
    .upsert(payload, { onConflict: "id" })
    .select(
      "id,biography,artist_photo,cv_entries,hero_title,hero_subtitle,hero_description,hero_image_1,hero_image_2,hero_image_3,hero_image_4,hero_image_5",
    )
    .single();
  if (error) throw new Error(error.message);
  return mapRowToAbout(row as AboutRow);
}
