-- Kør i Supabase → SQL Editor (ren SQL).
-- Matcher src/lib/supabase-paintings.ts (PaintingRow).

create table if not exists public.paintings (
  id               text    primary key,
  title            text    not null,
  description      text    not null default '',
  seo_description  text,
  image            text    not null,
  price            numeric not null,
  created_at       date    not null,
  sold             boolean not null default false,
  stock            integer          default 1,
  stripe_price_id  text
);

alter table public.paintings enable row level security;

drop policy if exists "Public read paintings" on public.paintings;
create policy "Public read paintings"
  on public.paintings
  for select
  to anon, authenticated
  using (true);
