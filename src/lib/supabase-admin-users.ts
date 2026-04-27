import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  created_by: string | null;
};

type AdminUserPublic = {
  id: string;
  username: string;
  created_at: string;
  created_by: string | null;
};

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();
}

function supabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

function hasValidUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function canUseSupabaseAdminUsers(): boolean {
  const url = supabaseUrl();
  return hasValidUrl(url) && supabaseServiceRoleKey().length > 0;
}

function getWriteClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function findAdminUserByUsername(username: string): Promise<AdminUserRow | null> {
  if (!canUseSupabaseAdminUsers()) return null;
  const supabase = getWriteClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id,username,password_hash,created_at,created_by")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AdminUserRow | null) ?? null;
}

export async function listAdminUsers(): Promise<AdminUserPublic[]> {
  const supabase = getWriteClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id,username,created_at,created_by")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminUserPublic[];
}

export async function createAdminUser(input: {
  username: string;
  passwordHash: string;
  createdBy: string;
}): Promise<void> {
  const supabase = getWriteClient();
  const { error } = await supabase.from("admin_users").insert({
    username: input.username,
    password_hash: input.passwordHash,
    created_by: input.createdBy,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAdminUserById(id: string): Promise<void> {
  const supabase = getWriteClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

