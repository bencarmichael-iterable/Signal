# Supabase Setup for Signal

## 1. Run the database migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql` — creates tables, RLS, auth trigger
   - `supabase/migrations/002_signal_form_fields.sql` — adds speaking_duration, last_contact_ago, what_rep_wants_to_learn to signals
   - `supabase/migrations/003_prospect_branding.sql` — adds prospect_website_url, prospect_logo_url for micro-page branding
   - `supabase/migrations/004_user_company_logo.sql` — adds company_logo_url to users for AE branding
   - `supabase/migrations/005_accounts_teams_signal_types.sql` — accounts, teams, signal types, roles, prompt overrides
   - `supabase/migrations/006_invites_default_admin.sql` — invites table, default sign-up role admin, invite flow for AEs

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
