-- Kør i Supabase → SQL Editor
-- Sociale links til kontaktsiden (offentlig læsning, skrivning via service role i admin API)

CREATE TABLE IF NOT EXISTS public.contact_settings (
  id text PRIMARY KEY DEFAULT 'main',
  facebook_url text,
  instagram_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read contact" ON public.contact_settings;
CREATE POLICY "Public read contact" ON public.contact_settings
  FOR SELECT TO anon, authenticated USING (true);
