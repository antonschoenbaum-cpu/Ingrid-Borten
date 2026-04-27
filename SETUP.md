# Setup til ny kunde

Denne guide viser, hvordan du sætter en ny kunde op fra start.

## 1) Klon repository og åbn i Cursor

1. Klon projektet:
   - `git clone <repo-url>`
2. Gå ind i mappen:
   - `cd "ingrid hjemmeside"`
3. Installer pakker:
   - `npm install`
4. Åbn mappen i Cursor.

## 2) Opret Supabase-projekt og kør SQL

1. Opret et nyt projekt i Supabase.
2. Gå til **SQL Editor**.
3. Kør SQL nedenfor (du kan køre hele blokken på én gang).

```sql
-- ===== paintings =====
create table if not exists public.paintings (
  id text primary key,
  title text not null,
  description text not null default '',
  image text not null,
  price numeric not null,
  created_at date not null,
  sold boolean not null default false
);

alter table public.paintings enable row level security;

drop policy if exists "Public read paintings" on public.paintings;
create policy "Public read paintings"
  on public.paintings
  for select
  to anon, authenticated
  using (true);


-- ===== jewelry =====
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


-- ===== events =====
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

drop policy if exists "Public read events" on public.events;
create policy "Public read events"
  on public.events
  for select
  to anon, authenticated
  using (true);


-- ===== about_content =====
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


-- ===== admin_users =====
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  created_by text
);

alter table public.admin_users enable row level security;

drop policy if exists "Authenticated read admin users" on public.admin_users;
create policy "Authenticated read admin users"
  on public.admin_users
  for select
  to authenticated
  using (true);
```

## 3) Opret Supabase Storage bucket

1. Gå til **Storage** i Supabase.
2. Opret bucket med navn: `uploads`
3. Sæt bucket som **Public**.

## 4) Sæt miljøvariabler (env)

Opret en `.env.local` i projektets rod og udfyld:

```env
# Login til admin (fallback hvis admin_users ikke bruges)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=skift-denne-adgangskode

# Navn på kunstneren i frontend
ARTIST_NAME=Dit Navn Her

# E-mail som kontaktformularen sender til
CONTACT_EMAIL=mail@domæne.dk

# Resend til kontaktformular
RESEND_API_KEY=

# NextAuth / session
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# Supabase (frontend + server)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Valgfrit: bruges til automatisk opdatering af ADMIN_PASSWORD via API
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
```

Forklaring i almindeligt sprog:

- `ADMIN_USERNAME`: standard admin-brugernavn.
- `ADMIN_PASSWORD`: standard admin-kode (brug en stærk kode).
- `ARTIST_NAME`: kundens navn, som vises på siden.
- `CONTACT_EMAIL`: den e-mail kunden modtager henvendelser på.
- `RESEND_API_KEY`: nøgle til at sende mails fra kontaktformularen.
- `AUTH_SECRET`: hemmelig nøgle til login-sessioner.
- `AUTH_URL`: adressen til siden (lokalt: `http://localhost:3000`).
- `NEXT_PUBLIC_SUPABASE_URL`: link til Supabase-projekt.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: offentlig nøgle til læsning fra frontend.
- `SUPABASE_SERVICE_ROLE_KEY`: servernøgle til oprettelse/redigering/sletning.
- `VERCEL_TOKEN`: adgang til Vercel API.
- `VERCEL_PROJECT_ID`: hvilket Vercel-projekt der skal opdateres.
- `VERCEL_TEAM_ID`: team-id i Vercel (kun hvis projektet ligger i et team).

## 5) Opdater ARTIST_NAME til kunden

Sæt `ARTIST_NAME` i `.env.local` og i Vercel environment variables.

Eksempel:

```env
ARTIST_NAME=Kundens Navn
```

## 6) Deploy til Vercel

1. Opret nyt projekt i Vercel og forbind repo.
2. Tilføj alle environment variables fra trin 4.
3. Deploy projektet.
4. Ved ændringer i env: redeploy.

## 7) Første login og hvad kunden selv gør

1. Gå til `/login`.
2. Log ind med `ADMIN_USERNAME` + `ADMIN_PASSWORD`.
3. Gå til `/admin/indstillinger`:
   - Skift adgangskode.
   - Opret ekstra admin-brugere under “Brugere”.
4. Gå gennem admin-siderne og udfyld indhold:
   - Malerier
   - Smykker
   - Begivenheder
   - Om
   - Kontakt

Det kunden selv skal gøre fremover:

- oprette/redigere indhold i admin
- holde adgangskoder private
- give besked ved behov for ny bruger/adgang
