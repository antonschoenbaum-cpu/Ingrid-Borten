# Go-Live Checklist (Ny Kunde Fra Bunden)

Denne guide er den konkrete, anbefalede rækkefølge for at sætte en ny kunde op end-to-end.

## 0) Forudsætninger

- Adgang til GitHub-repo
- Adgang til Supabase (nyt projekt)
- Adgang til Stripe (konto + API keys)
- Adgang til Shipmondo API
- Adgang til Resend
- Adgang til Vercel

---

## 1) Klon og lokal opstart

1. Klon repo og installer:
   - `git clone <repo-url>`
   - `cd "ingrid hjemmeside"`
   - `npm install`
2. Kopiér `.env.example` til `.env.local`:
   - `cp .env.example .env.local`
3. Kør lokal sanity check:
   - `npm run lint`
   - `npx tsc --noEmit`

---

## 2) Supabase: opret projekt + hent nøgler

1. Opret nyt Supabase-projekt.
2. Kopiér:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Sæt dem i `.env.local`.

Ekstra (valgfrit men understøttet i kode):
- `SUPABASE_URL` kan sættes som samme værdi som `NEXT_PUBLIC_SUPABASE_URL`.

---

## 3) Supabase SQL (kør i præcis rækkefølge)

Kør i Supabase SQL Editor:

### 3.1 Opret `paintings` (manuel base-tabel)

Der findes ikke en separat `sql/supabase-paintings-setup.sql` i repoet, så kør denne først:

```sql
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
```

### 3.2 Kør setup-filer i denne rækkefølge

1. `sql/supabase-jewelry-setup.sql`
2. `sql/supabase-events-setup.sql`
3. `sql/supabase-about-setup.sql`
4. `sql/supabase-forside-setup.sql`
5. `sql/supabase-webshop-setup.sql`
6. `sql/supabase-colors-setup.sql`
7. `sql/supabase-seo-setup.sql`
8. `sql/supabase-contact-setup.sql`
9. `sql/supabase-admin-users-setup.sql`

### 3.3 Verificér tabeller

Bekræft at disse findes:
- `paintings`
- `jewelry`
- `events`
- `about_content`
- `orders`
- `artist_settings`
- `contact_settings`
- `admin_users`

---

## 4) Supabase Storage

1. Opret bucket: `uploads`
2. Sæt bucket til **Public**
3. Test upload via admin senere (trin 11)

---

## 5) Resend

1. Opret API key i Resend.
2. Sæt `RESEND_API_KEY`.
3. Sæt `CONTACT_EMAIL` til kundens mail.
4. Hvis I bruger custom from-domain, konfigurer domæne/SPF/DKIM i Resend.

---

## 6) Shipmondo

1. Hent API user + API key.
2. Sæt:
   - `SHIPMONDO_API_USER`
   - `SHIPMONDO_API_KEY`
3. Disse bruges både i checkout (pickup points) og label-oprettelse.

---

## 7) Stripe

## 7A) Test-setup (anbefalet først)

1. Sæt test keys:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (fra test-webhook endpoint)
2. Sæt `STRIPE_TEST_MODE_ALLOW_DIRECT=true` for test uden connected account.
3. I admin `/admin/betaling`:
   - slå betaling til
   - udfyld bankoplysninger (testdata)
4. Checkout kan nu køre end-to-end i test, også hvis `stripe_account_id` mangler.

## 7B) Live-setup

1. Skift til live keys:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (live endpoint)
2. Sæt `STRIPE_TEST_MODE_ALLOW_DIRECT=false`
3. I admin `/admin/betaling`:
   - udfyld rigtige bankoplysninger
   - verificér at `stripe_account_id` oprettes
4. Bekræft at checkout virker med connected account flow.

---

## 8) NextAuth / login

Sæt:
- `AUTH_SECRET` (lang random string)
- `AUTH_URL` (lokalt: `http://localhost:3000`, i prod: fuld https URL)

Sæt også:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Bemærk:
- Appen kan logge ind via env-admin eller `admin_users` i Supabase.

---

## 9) Vercel projekt

1. Opret nyt Vercel projekt og connect repo.
2. Tilføj alle env vars (Production + Preview efter behov):
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ARTIST_NAME`
   - `CONTACT_EMAIL`
   - `RESEND_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_TEST_MODE_ALLOW_DIRECT`
   - `SHIPMONDO_API_USER`
   - `SHIPMONDO_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY` (hvis SEO/baggrundsfarve-AI skal bruges)
   - `NEXT_PUBLIC_SITE_URL`
3. Valgfrit til password-update endpoint:
   - `VERCEL_TOKEN`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TEAM_ID`
4. Deploy.

---

## 10) Stripe webhook opsætning

1. Opret endpoint i Stripe:
   - `https://<dit-domæne>/api/webhooks/stripe`
2. Lyt minimum på:
   - `checkout.session.completed`
3. Kopiér endpoint secret til `STRIPE_WEBHOOK_SECRET`.
4. Re-deploy efter env ændring.

---

## 11) Go-live verifikation (obligatorisk)

Kør disse checks i rækkefølge:

1. **Login**
   - Gå til `/login`, log ind, bekræft adgang til `/admin`.
2. **Upload**
   - Upload et billede i admin (forside eller værk), bekræft offentlig URL.
3. **Content CRUD**
   - Opret/ret/slet et test-maleri, test-smykke, test-event.
4. **Kontakt**
   - Sæt Facebook/Instagram i admin, bekræft visning på `/kontakt`.
   - Send testbesked i kontaktformular og bekræft mail modtages.
5. **Betaling**
   - Slå betaling til i `/admin/betaling`.
   - Gennemfør testkøb fra produktside -> checkout -> Stripe -> `/tak`.
6. **Webhook**
   - Bekræft at ordre oprettes i `orders`.
   - Bekræft produkt markeres `sold`/`stock=0`.
7. **Fragt**
   - Bekræft shipment forsøges/oprettes og label URL gemmes på ordre.
8. **Admin ordre-flow**
   - Åbn `/admin/ordrer`, kontroller status, detaljer og label-link.
9. **Build check**
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`

---

## 12) Production cutover

1. Skift til live Stripe + live webhook secret.
2. Sæt `STRIPE_TEST_MODE_ALLOW_DIRECT=false`.
3. Bekræft `NEXT_PUBLIC_SITE_URL` matcher produktionsdomæne.
4. Kør et live smoke-check (minimum 1 reel ordre med lavpris testprodukt hvis muligt).
5. Fjern/deaktiver testprodukter i katalog.

---

## 13) Drift efter go-live

- Overvåg Stripe webhook delivery failures.
- Overvåg Shipmondo fejl i ordreflow.
- Gem en sikker backup af alle production env vars.
- Dokumentér kunde-specifikke værdier (domæne, kontaktmail, afsenderadresse, API-konti).

