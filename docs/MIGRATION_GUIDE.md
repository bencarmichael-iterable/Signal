# Database Migration Guide: Accounts, Roles & Teams

This guide walks you through setting up the full schema so Settings, invites, and account-scoped features work correctly.

---

## Step 1: Fix the deploy (already done)

The TypeScript error is fixed. Your next deploy should succeed.

---

## Step 2: Run the migration in Supabase

1. Open your Supabase project → **SQL Editor**
2. Create a new query
3. Copy and paste the SQL below
4. Click **Run**

```sql
-- ============================================
-- MIGRATION: Accounts, Roles, Teams, Invites
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create accounts table (one per org/company)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_description TEXT,
  differentiators TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create account_prompts (AI prompt overrides per account)
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

-- 3. User role enum (create only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'ae', 'manager');
  END IF;
END $$;

-- 4. Add account_id and role to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'ae';

-- 5. Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 6. Signal type enum (for prospecting, mid-deal, deal_stalled)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_type') THEN
    CREATE TYPE signal_type AS ENUM ('prospecting', 'mid_deal', 'deal_stalled');
  END IF;
END $$;

ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_type signal_type DEFAULT 'deal_stalled';
ALTER TABLE signals ALTER COLUMN deal_stage_when_stalled DROP NOT NULL;
ALTER TABLE signals ALTER COLUMN what_was_pitched DROP NOT NULL;

-- 7. RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own account" ON accounts;
CREATE POLICY "Users can read own account" ON accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = accounts.id)
  );
DROP POLICY IF EXISTS "Admins can update own account" ON accounts;
CREATE POLICY "Admins can update own account" ON accounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = accounts.id AND users.role = 'admin')
  );

-- 8. RLS for account_prompts
ALTER TABLE account_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own account prompts" ON account_prompts;
CREATE POLICY "Users can read own account prompts" ON account_prompts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u JOIN accounts a ON u.account_id = a.id WHERE u.id = auth.uid() AND a.id = account_prompts.account_id)
  );
DROP POLICY IF EXISTS "Admins can manage own account prompts" ON account_prompts;
CREATE POLICY "Admins can manage own account prompts" ON account_prompts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = account_prompts.account_id AND users.role = 'admin')
  );

-- 9. RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own account teams" ON teams;
CREATE POLICY "Users can read own account teams" ON teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = teams.account_id)
  );
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = teams.account_id AND users.role = 'admin')
  );

-- 10. Invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_account ON invites(account_id);
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage invites for own account" ON invites;
CREATE POLICY "Admins can manage invites for own account" ON invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = invites.account_id AND users.role = 'admin')
  );

-- 11. Create default account and assign existing users
INSERT INTO accounts (name)
SELECT 'Default'
WHERE NOT EXISTS (SELECT 1 FROM accounts);

UPDATE users
SET account_id = (SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1),
    role = 'admin'
WHERE account_id IS NULL;

-- 12. Update signup trigger: new signups = admin, invited users = ae
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  new_role user_role;
  new_account_id UUID;
BEGIN
  new_account_id := NULL;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invites') THEN
    SELECT account_id INTO new_account_id
    FROM invites
    WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF new_account_id IS NOT NULL THEN
      new_role := 'ae';
      UPDATE invites SET used_at = NOW() WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL;
    END IF;
  END IF;

  IF new_account_id IS NULL THEN
    SELECT id INTO default_account_id FROM accounts ORDER BY created_at ASC LIMIT 1;
    new_account_id := default_account_id;
    new_role := 'admin';
  END IF;

  INSERT INTO users (id, email, full_name, company_name, account_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'company_name',
    new_account_id,
    new_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 3: Verify

1. In Supabase **Table Editor**, check:
   - `accounts` table exists and has at least one row ("Default")
   - `users` table has `account_id` and `role` columns
   - `invites` table exists
   - `teams` table exists
   - `account_prompts` table exists

2. In `users`, confirm your row has:
   - `account_id` = the Default account's UUID
   - `role` = `admin`

---

## Step 4: Update the app to use account_id

After the migration succeeds, we need to add `account_id` back to the Settings page select so company profile, prompts, and teams load. I'll do that in a follow-up commit once you confirm the migration ran successfully.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `relation "accounts" does not exist` | Run the migration from the top; earlier steps may have failed |
| `column "account_id" already exists` | Safe to ignore; `IF NOT EXISTS` handles it |
| `type "user_role" already exists` | Safe to ignore; the DO block checks first |
| `policy already exists` | The script uses DROP POLICY IF EXISTS; re-run from the top |
