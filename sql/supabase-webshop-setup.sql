-- Webshop setup til Supabase
-- Kør i Supabase -> SQL Editor

create extension if not exists pgcrypto;

-- Tilføj webshop-kolonner til eksisterende produkter
alter table public.paintings
  add column if not exists stripe_price_id text,
  add column if not exists stock integer not null default 1;

alter table public.jewelry
  add column if not exists stripe_price_id text,
  add column if not exists stock integer not null default 1;

-- Ordrer
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_type text not null check (product_type in ('paintings', 'jewelry')),
  product_id text not null,
  product_title text not null,
  amount integer not null,
  currency text not null default 'dkk',
  customer_name text not null,
  customer_email text not null,
  customer_address text not null,
  customer_city text not null,
  customer_zip text not null,
  selected_pickup_point_id text,
  selected_carrier text,
  stripe_session_id text not null unique,
  status text not null default 'pending',
  shipmondo_shipment_id text,
  tracking_number text,
  label_url text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Authenticated read orders" on public.orders;
create policy "Authenticated read orders"
  on public.orders
  for select
  to authenticated
  using (true);

-- Kunstnerens betalings- og afsenderindstillinger
create table if not exists public.artist_settings (
  id text primary key default 'main',
  payments_enabled boolean not null default false,
  stripe_account_id text,
  bank_reg_number text,
  bank_account_number text,
  onboarding_complete boolean not null default false,
  shipmondo_api_user text,
  shipmondo_api_key text,
  artist_address text,
  artist_zip text,
  artist_city text
);

alter table public.artist_settings enable row level security;

drop policy if exists "Authenticated read artist settings" on public.artist_settings;
create policy "Authenticated read artist settings"
  on public.artist_settings
  for select
  to authenticated
  using (true);
