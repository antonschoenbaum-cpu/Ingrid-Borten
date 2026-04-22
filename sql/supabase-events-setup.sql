-- Kør DETTE i Supabase → SQL Editor (ikke TypeScript fra src/lib/supabase-events.ts).
-- Tabellen matcher Next.js-appens events-API.

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null default '',
  start_date timestamptz not null,
  end_date date not null,
  location text not null,
  image text
);

alter table public.events enable row level security;

-- Offentlig læsning (forside, /begivenheder, /om bruger getEvents med anon key).
drop policy if exists "Public read events" on public.events;
create policy "Public read events"
  on public.events
  for select
  to anon, authenticated
  using (true);

-- Skriv (opret/rediger/slet) sker fra Vercel med SUPABASE_SERVICE_ROLE_KEY og omgår RLS.
