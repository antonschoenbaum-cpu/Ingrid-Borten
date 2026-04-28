-- Forsidefelter i about_content
-- Kør i Supabase -> SQL Editor

alter table public.about_content
add column if not exists hero_title text,
add column if not exists hero_subtitle text,
add column if not exists hero_description text,
add column if not exists hero_image_1 text,
add column if not exists hero_image_2 text,
add column if not exists hero_image_3 text,
add column if not exists hero_image_4 text,
add column if not exists hero_image_5 text;

