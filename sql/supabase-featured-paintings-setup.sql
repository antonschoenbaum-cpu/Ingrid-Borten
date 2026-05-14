-- Udvalgte malerier på forsiden (op til 3 id'er, rækkefølge bevares).
-- Kør i Supabase → SQL Editor efter about_content findes.

ALTER TABLE public.about_content
  ADD COLUMN IF NOT EXISTS featured_painting_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
