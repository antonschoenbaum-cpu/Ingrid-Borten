ALTER TABLE public.artist_settings
ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#F5F0EB',
ADD COLUMN IF NOT EXISTS bg_color_generated_at timestamptz;
