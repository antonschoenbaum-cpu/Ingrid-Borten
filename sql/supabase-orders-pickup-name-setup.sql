-- Pakkeshop-visningsnavn på ordrer (menneskelæsbar tekst fra checkout)
-- Kør i Supabase → SQL Editor.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_point_name text;
