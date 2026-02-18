-- Accounts, roles, teams, signal types, and settings

-- Create accounts table (one per org/company)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_description TEXT,
  differentiators TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI prompt overrides (account-level)
CREATE TABLE IF NOT EXISTS account_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  prompt_key TEXT NOT NULL,
  prompt_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT account_prompts_unique UNIQUE(account_id, signal_type, prompt_key)
);

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'ae', 'manager');

-- Add account_id and role to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'ae';

-- Teams (for manager ↔ AE structure)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add team_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Signal type enum
CREATE TYPE signal_type AS ENUM ('prospecting', 'mid_deal', 'deal_stalled');

-- Add signal_type to signals (nullable for backward compat)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_type signal_type DEFAULT 'deal_stalled';

-- Make some signal fields nullable for prospecting (no stalled context)
ALTER TABLE signals ALTER COLUMN deal_stage_when_stalled DROP NOT NULL;
ALTER TABLE signals ALTER COLUMN what_was_pitched DROP NOT NULL;

-- RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own account" ON accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = accounts.id)
  );
CREATE POLICY "Admins can update own account" ON accounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = accounts.id AND users.role = 'admin')
  );

-- RLS for account_prompts
ALTER TABLE account_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own account prompts" ON account_prompts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u JOIN accounts a ON u.account_id = a.id WHERE u.id = auth.uid() AND a.id = account_prompts.account_id)
  );
CREATE POLICY "Admins can manage own account prompts" ON account_prompts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = account_prompts.account_id AND users.role = 'admin')
  );

-- RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own account teams" ON teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = teams.account_id)
  );
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = teams.account_id AND users.role = 'admin')
  );

-- Backfill: create default account and assign existing users
INSERT INTO accounts (name)
SELECT 'Default'
WHERE NOT EXISTS (SELECT 1 FROM accounts);

UPDATE users
SET account_id = (SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1),
    role = 'admin'
WHERE account_id IS NULL;

-- Update new user trigger to assign default account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  SELECT id INTO default_account_id FROM public.accounts ORDER BY created_at ASC LIMIT 1;
  INSERT INTO public.users (id, email, full_name, company_name, account_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'company_name',
    default_account_id,
    'ae'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
