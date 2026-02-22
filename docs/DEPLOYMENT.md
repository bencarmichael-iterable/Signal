# Deployment Guide

Environment variables, hosting setup, and production checklist for Signal.

---

## Environment Variables

### All variables (local + production)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (test or live) |
| `STRIPE_PRICE_ID` | Yes | Stripe Price ID for Premium plan |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. `http://localhost:3000` or `https://signal-project.netlify.app`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (optional; Checkout is server-side) |

### Local development (`.env.local`)

- Use **test** Stripe keys (`sk_test_...`, `pk_test_...`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- For webhook testing: run `stripe listen --forward-to localhost:3000/api/billing/webhook` and use the printed secret

### Netlify (production)

Add all variables in **Site configuration → Environment variables**. Use the same values as local, except:

- `NEXT_PUBLIC_APP_URL=https://signal-project.netlify.app`
- `STRIPE_WEBHOOK_SECRET` = secret from webhook pointing to production URL

---

## Production URLs (signal-project.netlify.app)

| Purpose | URL |
|---------|-----|
| App | `https://signal-project.netlify.app` |
| Pricing page | `https://signal-project.netlify.app/pricing` |
| Stripe webhook | `https://signal-project.netlify.app/api/billing/webhook` |
| Post-payment success | `https://signal-project.netlify.app/dashboard/settings?upgraded=1` |
| Post-payment cancel | `https://signal-project.netlify.app/dashboard/settings?canceled=1` |

---

## Stripe webhook setup (production)

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. **Endpoint URL**: `https://signal-project.netlify.app/api/billing/webhook`
3. **Events**: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Netlify

---

## Database migrations

Run in Supabase SQL Editor (in order):

1. `001_initial_schema.sql` – base schema
2. `005_accounts_teams_signal_types.sql` – accounts, teams, roles
3. `010_linkedin_and_templates.sql` – LinkedIn URL, shared templates
4. `011_account_plan.sql` – plan (free/premium), Stripe fields

---

## Going live (test → production)

When moving from proof of concept to production:

| Item | Change |
|------|--------|
| Stripe keys | Switch from test (`sk_test_...`) to live (`sk_live_...`) |
| Stripe Price | Create new Price in Stripe **live** mode; update `STRIPE_PRICE_ID` |
| Stripe webhook | Create webhook for production URL in live mode; update `STRIPE_WEBHOOK_SECRET` |
| Supabase | No change unless using a separate prod project |
| OpenAI | No change unless using a separate prod project |

---

## Related docs

- [STRIPE_SETUP.md](./STRIPE_SETUP.md) – Stripe account, Product/Price, test mode
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) – Database schema and migrations
