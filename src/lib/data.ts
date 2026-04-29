import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import type { AboutData, ContactLinks, EventItem, Jewelry, Painting } from "@/types/content";
import {
  readAbout as storeReadAbout,
  readEvents as storeReadEvents,
  readJewelry as storeReadJewelry,
  readPaintings as storeReadPaintings,
} from "@/lib/store";
import {
  canUseSupabaseAboutRead,
  readAboutFromSupabase,
} from "@/lib/supabase-about";
import {
  canUseSupabaseEventsRead,
  canUseSupabaseEventsWrite,
  readEventsFromSupabase,
} from "@/lib/supabase-events";
import {
  canUseSupabaseJewelryRead,
  canUseSupabaseJewelryWrite,
  readJewelryFromSupabase,
} from "@/lib/supabase-jewelry";
import {
  canUseSupabaseContactRead,
  readContactFromSupabase,
} from "@/lib/supabase-contact";
import {
  canUseSupabaseRead,
  canUseSupabaseWrite,
  readPaintingsFromSupabase,
} from "@/lib/supabase-paintings";

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  noStore();
  const fs = await import("fs/promises");
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

export async function getPaintings(): Promise<Painting[]> {
  noStore();
  // Når API skriver til Supabase, må vi ikke falde tilbage til data/paintings.json —
  // ellers kan admin vise JSON-seed mens slet/opret kun rammer databasen.
  if (canUseSupabaseWrite()) {
    return readPaintingsFromSupabase();
  }
  if (canUseSupabaseRead()) {
    try {
      return await readPaintingsFromSupabase();
    } catch {
      // Falder tilbage til JSON lokalt eller hvis Supabase midlertidigt fejler.
    }
  }
  return storeReadPaintings();
}

export async function getJewelry(): Promise<Jewelry[]> {
  noStore();
  if (canUseSupabaseJewelryWrite()) {
    return readJewelryFromSupabase();
  }
  if (canUseSupabaseJewelryRead()) {
    try {
      return await readJewelryFromSupabase();
    } catch {
      // Falder tilbage til JSON lokalt eller hvis Supabase midlertidigt fejler.
    }
  }
  return storeReadJewelry();
}

export async function getEvents(): Promise<EventItem[]> {
  noStore();
  if (canUseSupabaseEventsWrite()) {
    return readEventsFromSupabase();
  }
  if (canUseSupabaseEventsRead()) {
    try {
      return await readEventsFromSupabase();
    } catch {
      // Falder tilbage til JSON lokalt eller hvis Supabase midlertidigt fejler.
    }
  }
  return storeReadEvents();
}

export async function getAbout(): Promise<AboutData> {
  noStore();
  if (canUseSupabaseAboutRead()) {
    try {
      const row = await readAboutFromSupabase();
      if (row) return row;
    } catch {
      // Falder tilbage til JSON.
    }
  }
  return storeReadAbout();
}

export async function getContactLinks(): Promise<ContactLinks> {
  noStore();
  if (canUseSupabaseContactRead()) {
    try {
      const row = await readContactFromSupabase();
      if (row) return row;
    } catch {
      // Falder tilbage til JSON.
    }
  }
  return readJson<ContactLinks>("contact.json");
}

export function getDataDir(): string {
  return dataDir;
}
