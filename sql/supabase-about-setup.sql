-- Kør i Supabase → SQL Editor.
-- Én række (id = main) til biografi, portræt-URL og evt. cv_entries (JSON).

create table if not exists public.about_content (
  id text primary key default 'main',
  biography text not null default '',
  artist_photo text not null default '',
  cv_entries jsonb not null default '[]'::jsonb
);

alter table public.about_content enable row level security;

drop policy if exists "Public read about" on public.about_content;
create policy "Public read about"
  on public.about_content
  for select
  to anon, authenticated
  using (true);
