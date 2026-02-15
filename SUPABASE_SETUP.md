# Supabase Setup for Signal

## 1. Run the database migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and run it

This creates the `users`, `signals`, `responses`, and `signal_events` tables, plus RLS policies and the auth trigger.

## 2. Configure Auth (optional)

If you want users to stay logged in immediately after signup (recommended for better UX):

1. Go to **Authentication** → **Providers** → **Email**
2. Turn off **Confirm email**

With confirmation on, users must click the email link before they can log in. With it off, they’re signed in right after signup.

## 3. URL configuration (important)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app root, e.g. `https://signal-project.netlify.app` (no trailing path like `/signup`)
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://signal-project.netlify.app/auth/callback`

If Site URL includes `/signup`, users may be sent back to signup after confirming their email.
