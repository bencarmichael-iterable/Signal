-- LinkedIn URL for rep identity, shared templates for prospecting
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Shared templates: default_landing_intro and default_value_prop in account_prompts
-- (Uses existing account_prompts table with prompt_key)
