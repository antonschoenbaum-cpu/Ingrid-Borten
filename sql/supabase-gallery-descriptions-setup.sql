-- Galleri-introduktionstekster (malerier / smykker oversider)
-- Kør i Supabase → SQL Editor efter about_content findes.

ALTER TABLE public.about_content
  ADD COLUMN IF NOT EXISTS gallery_paintings_description text,
  ADD COLUMN IF NOT EXISTS gallery_jewelry_description text;
