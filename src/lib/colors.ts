import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readAbout, readPaintings } from "@/lib/store";

export const DEFAULT_BG_COLOR = "#F5F0EB";

function supabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
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

function canUseSupabaseRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

function canUseSupabaseWrite(): boolean {
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

function asUniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
}

export function normalizeHexColor(value: string | null | undefined): string {
  const hex = (value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toUpperCase();
  return DEFAULT_BG_COLOR;
}

export async function generateBackgroundColor(imageUrls: string[]): Promise<string> {
  const validUrls = asUniqueUrls(imageUrls).slice(0, 5);
  if (validUrls.length === 0) return DEFAULT_BG_COLOR;

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return DEFAULT_BG_COLOR;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: [
              ...validUrls.map((url) => ({
                type: "image",
                source: { type: "url", url },
              })),
              {
                type: "text",
                text: `Du er en professionel galleridesigner.
Analyser disse kunstværker og find den perfekte baggrundfarve til en hjemmeside der viser disse værker.

Regler:
- Farven skal få værkerne til at POPPE og fremstå bedst muligt
- Mørke/dybe malerier -> lys, luftig baggrund (fx cremehvid, lys grå, varm hvid)
- Lyse/pastel værker -> let mørkere neutral baggrund (fx varm beige, blød taupe)
- Farverige/abstrakte værker -> meget neutral baggrund (fx ren hvid, lys grå)
- Metalsmykker/sølv -> kølig lys baggrund (fx lysegrå, off-white)
- Guld/kobber smykker -> varm hvid eller creme baggrund
- Baggrunden skal ALDRIG dominere - kun fremhæve
- Vælg altid en lys, elegant og neutral tone

Svar KUN med én hex-farvekode - intet andet.
Eksempel: #F2EDE6`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return DEFAULT_BG_COLOR;
    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    const hex = data.content?.[0]?.text?.trim();
    return normalizeHexColor(hex);
  } catch {
    return DEFAULT_BG_COLOR;
  }
}

async function getLatestPaintingImages(limit: number): Promise<string[]> {
  if (canUseSupabaseRead()) {
    try {
      const supabase = getReadClient();
      const { data, error } = await supabase
        .from("paintings")
        .select("image,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return asUniqueUrls((data ?? []).map((row) => String(row.image ?? ""))).slice(0, limit);
    } catch {
      // fall through
    }
  }
  const paintings = await readPaintings();
  return asUniqueUrls(
    paintings
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => p.image),
  ).slice(0, limit);
}

async function getLatestJewelryImages(limit: number): Promise<string[]> {
  if (!canUseSupabaseRead()) return [];
  try {
    const supabase = getReadClient();
    const { data, error } = await supabase
      .from("jewelry")
      .select("image,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return asUniqueUrls((data ?? []).map((row) => String(row.image ?? ""))).slice(0, limit);
  } catch {
    return [];
  }
}

async function getAboutHeroImages(): Promise<string[]> {
  if (canUseSupabaseRead()) {
    try {
      const supabase = getReadClient();
      const { data, error } = await supabase
        .from("about_content")
        .select("hero_image_1,hero_image_2,hero_image_3,hero_image_4,hero_image_5")
        .eq("id", "main")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) {
        return asUniqueUrls([
          String(data.hero_image_1 ?? ""),
          String(data.hero_image_2 ?? ""),
          String(data.hero_image_3 ?? ""),
          String(data.hero_image_4 ?? ""),
          String(data.hero_image_5 ?? ""),
        ]);
      }
    } catch {
      // fall through
    }
  }
  const about = await readAbout();
  return asUniqueUrls([
    about.heroImage1 ?? "",
    about.heroImage2 ?? "",
    about.heroImage3 ?? "",
    about.heroImage4 ?? "",
    about.heroImage5 ?? "",
  ]);
}

export async function saveBackgroundColor(bgColor: string): Promise<string> {
  const normalized = normalizeHexColor(bgColor);
  if (!canUseSupabaseWrite()) return normalized;
  const supabase = getWriteClient();
  const { error } = await supabase.from("artist_settings").upsert(
    {
      id: "main",
      bg_color: normalized,
      bg_color_generated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
  return normalized;
}

export async function getStoredBackgroundColor(): Promise<string> {
  if (!canUseSupabaseRead()) return DEFAULT_BG_COLOR;
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("artist_settings")
    .select("bg_color")
    .eq("id", "main")
    .maybeSingle();
  if (error || !data) return DEFAULT_BG_COLOR;
  return normalizeHexColor(String(data.bg_color ?? DEFAULT_BG_COLOR));
}

export async function generateAndStoreBackgroundColor(extraImageUrls: string[] = []): Promise<string> {
  const color = await generateBackgroundColor(extraImageUrls);
  return saveBackgroundColor(color);
}

export async function generateAndStoreBackgroundColorFromGallery(extraImageUrls: string[] = []): Promise<string> {
  const images = asUniqueUrls([
    ...extraImageUrls,
    ...(await getLatestPaintingImages(5)),
    ...(await getLatestJewelryImages(5)),
  ]).slice(0, 5);
  const color = await generateBackgroundColor(images);
  return saveBackgroundColor(color);
}

export async function generateAndStoreBackgroundColorFromAboutAndPaintings(
  heroImageUrls: string[],
): Promise<string> {
  const images = asUniqueUrls([
    ...heroImageUrls,
    ...(await getAboutHeroImages()),
    ...(await getLatestPaintingImages(3)),
  ]).slice(0, 5);
  const color = await generateBackgroundColor(images);
  return saveBackgroundColor(color);
}
