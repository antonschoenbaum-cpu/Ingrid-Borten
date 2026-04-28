ALTER TABLE public.paintings
ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.jewelry
ADD COLUMN IF NOT EXISTS seo_description text;
