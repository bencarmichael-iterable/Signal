-- Invites table for admin-invited AEs
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
CREATE POLICY "Admins can manage invites for own account" ON invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_id = invites.account_id AND users.role = 'admin')
  );

-- Update trigger: default role admin, check invites for invited users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
  new_role user_role;
  new_account_id UUID;
BEGIN
  new_account_id := NULL;
  -- Check if this email was invited
  SELECT account_id INTO new_account_id
  FROM public.invites
  WHERE LOWER(email) = LOWER(NEW.email)
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF new_account_id IS NOT NULL THEN
    new_role := 'ae';
    UPDATE public.invites SET used_at = NOW() WHERE LOWER(email) = LOWER(NEW.email) AND used_at IS NULL;
  ELSE
    SELECT id INTO default_account_id FROM public.accounts ORDER BY created_at ASC LIMIT 1;
    new_account_id := default_account_id;
    new_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, full_name, company_name, account_id, role)
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
