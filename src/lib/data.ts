import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import type { AboutData, ContactLinks, EventItem, Jewelry, Painting } from "@/types/content";
import {
  readAbout as storeReadAbout,
  readEvents as storeReadEvents,
  readJewelry as storeReadJewelry,
  readPaintings as storeReadPaintings,
} from "@/lib/store";
import { canUseSupabaseEventsRead, readEventsFromSupabase } from "@/lib/supabase-events";
import { canUseSupabaseRead, readPaintingsFromSupabase } from "@/lib/supabase-paintings";

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  noStore();
  const fs = await import("fs/promises");
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

export async function getPaintings(): Promise<Painting[]> {
  noStore();
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
  return storeReadJewelry();
}

export async function getEvents(): Promise<EventItem[]> {
  noStore();
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
  return storeReadAbout();
}

export async function getContactLinks(): Promise<ContactLinks> {
  return readJson<ContactLinks>("contact.json");
}

export function getDataDir(): string {
  return dataDir;
}
