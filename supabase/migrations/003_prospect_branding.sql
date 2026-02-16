-- Add prospect website and logo for micro-page branding
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS prospect_website_url TEXT,
  ADD COLUMN IF NOT EXISTS prospect_logo_url TEXT;
