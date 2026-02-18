# Signal

> Know why they went quiet. Deal recovery and prospect feedback for sales teams.

Signal helps Account Executives get honest feedback from prospects who've gone quiet. Create personalised micro-pages, send them to prospects, and get AI-powered intel on whether to re-engage, pivot, or move on.

---

## Features

- **Signal types:** Deal stalled, Mid-deal, Prospecting – each with tailored questions and prompts
- **Dynamic questions:** AI generates follow-up questions in real time based on prospect answers (max 6)
- **Personalised micro-pages:** AE photo, company logo, prospect branding, AI-generated deal summary
- **Settings (admin):** Company profile, product description, differentiators, custom AI prompts per signal type
- **Insights:** Aggregate feedback across Signals – top reasons deals stall, competitor mentions, recommendation distribution
- **Teams:** Create teams for manager views and Insights filtering

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **AI:** OpenAI GPT-4o-mini
- **Hosting:** Netlify

---

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://signal-project.netlify.app`)

3. Run Supabase migrations (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

4. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Project Structure

```
app/
  dashboard/          # AE dashboard (signals, new, account, settings, insights)
  s/[slug]/           # Prospect micro-page (public)
  api/
    signals/          # generate, next-question, submit-response, track-open
    settings/         # Account settings (admin)
    teams/            # Team management
    insights/         # Aggregate feedback
supabase/migrations/  # Database schema
```

---

## Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) – Database migrations and auth config
- [SETUP.md](./SETUP.md) – GitHub and Netlify setup
- [DECISIONS.md](./DECISIONS.md) – Product and tech decisions
