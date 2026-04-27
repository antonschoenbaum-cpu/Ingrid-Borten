-- Kør i Supabase -> SQL Editor.
-- Admin-brugere til login i NextAuth credentials flow.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  created_by text
);

alter table public.admin_users enable row level security;

-- Kun indloggede brugere må læse listen via RLS.
drop policy if exists "Authenticated read admin users" on public.admin_users;
create policy "Authenticated read admin users"
  on public.admin_users
  for select
  to authenticated
  using (true);

-- Ingen skrive-politikker for anon/authenticated.
-- Appens server skriver med service role key (bypasser RLS).
