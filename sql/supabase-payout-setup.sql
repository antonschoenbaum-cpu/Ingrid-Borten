-- Wallet / udbetaling (platform Stripe — ikke Connect)
-- Kør i Supabase SQL Editor.

ALTER TABLE artist_settings ADD COLUMN IF NOT EXISTS pending_payout numeric NOT NULL DEFAULT 0;
ALTER TABLE artist_settings ADD COLUMN IF NOT EXISTS total_earned numeric NOT NULL DEFAULT 0;
ALTER TABLE artist_settings ADD COLUMN IF NOT EXISTS payout_mobile text;
