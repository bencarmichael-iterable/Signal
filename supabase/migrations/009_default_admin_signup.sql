-- Ensure new signups default to admin (invited users get ae)
-- Re-applies handle_new_user logic so it works even if 006 wasn't run

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  new_role user_role;
  new_account_id UUID;
BEGIN
  new_account_id := NULL;

  -- Check if this email was invited (use invites table if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invites') THEN
    SELECT account_id INTO new_account_id
    FROM invites
    WHERE LOWER(email) = LOWER(NEW.email)
      AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF new_account_id IS NOT NULL THEN
      new_role := 'ae';
      UPDATE invites SET used_at = NOW() WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL;
    END IF;
  END IF;

  -- Not invited: assign default account and role = admin
  IF new_account_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
      SELECT id INTO default_account_id FROM accounts ORDER BY created_at ASC LIMIT 1;
      new_account_id := default_account_id;
    END IF;
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
