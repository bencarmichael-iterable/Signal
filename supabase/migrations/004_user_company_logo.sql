-- Add company logo URL for AE branding on micro-pages
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
