# Supabase Setup for Signal

## 1. Run the database migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and run it

This creates the `users`, `signals`, `responses`, and `signal_events` tables, plus RLS policies and the auth trigger.

## 2. Configure Auth (optional)

If you want email/password signup without email confirmation (faster for development):

1. Go to **Authentication** → **Providers** → **Email**
2. Turn off **Confirm email** (or leave on for production)

## 3. Add redirect URL (for OAuth, if used later)

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**: `http://localhost:3000/auth/callback` and `https://signal-project.netlify.app/auth/callback`
