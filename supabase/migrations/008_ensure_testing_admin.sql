-- Ensure testing1234@gmail.com is admin (and has account if accounts table exists)
-- Run this in Supabase SQL Editor if Settings access still fails

-- Set role to admin
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'testing1234@gmail.com';

-- If accounts table exists, ensure user has an account
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    INSERT INTO accounts (name) SELECT 'Default' WHERE NOT EXISTS (SELECT 1 FROM accounts);
    UPDATE users
    SET account_id = COALESCE(account_id, (SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1))
    WHERE email = 'testing1234@gmail.com';
  END IF;
END $$;
