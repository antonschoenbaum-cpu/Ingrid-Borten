-- Kør i Supabase → SQL Editor (ren SQL).
-- Matcher Next.js jewelry-API (samme felter som malerier).

create table if not exists public.jewelry (
  id text primary key,
  title text not null,
  description text not null default '',
  image text not null,
  price numeric not null,
  created_at date not null,
  sold boolean not null default false
);

alter table public.jewelry enable row level security;

drop policy if exists "Public read jewelry" on public.jewelry;
create policy "Public read jewelry"
  on public.jewelry
  for select
  to anon, authenticated
  using (true);
