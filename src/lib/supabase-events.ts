import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EventItem } from "@/types/content";

/*
 * Database-setup: kør KUN ren SQL fra projektets fil sql/supabase-events-setup.sql
 * i Supabase → SQL Editor. Indsæt ikke denne .ts-fil der — den er app-kode, ikke SQL.
 */

type EventRow = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  image: string | null;
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

export function canUseSupabaseEventsRead(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && (supabaseAnonKey().length > 0 || supabaseServiceRoleKey().length > 0);
}

export function canUseSupabaseEventsWrite(): boolean {
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

function mapRowToEvent(r: EventRow): EventItem {
  const end = String(r.end_date).slice(0, 10);
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    start_date: String(r.start_date),
    end_date: end,
    location: r.location,
    image: r.image ?? null,
  };
}

export async function readEventsFromSupabase(): Promise<EventItem[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,start_date,end_date,location,image")
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRowToEvent(r as EventRow));
}

export async function createEventInSupabase(e: EventItem): Promise<EventItem> {
  const supabase = getWriteClient();
  const payload = {
    id: e.id,
    title: e.title,
    description: e.description,
    start_date: e.start_date,
    end_date: e.end_date.slice(0, 10),
    location: e.location,
    image: e.image,
  };
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id,title,description,start_date,end_date,location,image")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToEvent(data as EventRow);
}

export async function updateEventInSupabase(e: EventItem): Promise<EventItem> {
  const supabase = getWriteClient();
  const payload = {
    title: e.title,
    description: e.description,
    start_date: e.start_date,
    end_date: e.end_date.slice(0, 10),
    location: e.location,
    image: e.image,
  };
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", e.id)
    .select("id,title,description,start_date,end_date,location,image")
    .single();
  if (error) throw new Error(error.message);
  return mapRowToEvent(data as EventRow);
}

export async function deleteEventInSupabase(id: string): Promise<void> {
  const supabase = getWriteClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
