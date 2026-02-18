-- Ensure role column and user_role type exist (in case 005 wasn't applied)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'ae', 'manager');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role user_role DEFAULT 'ae';
  END IF;
END $$;

-- Set testing1234@gmail.com as admin
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'testing1234@gmail.com';
