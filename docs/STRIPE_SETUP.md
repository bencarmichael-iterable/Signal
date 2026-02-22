# Stripe Billing Setup

Signal uses **Stripe** for Premium subscriptions. Stripe has **no monthly fee**—you only pay when you process payments (2.9% + 30¢ per successful charge).

---

## 1. Create a Stripe account

Sign up at [stripe.com](https://stripe.com). No credit card required to start.

---

## 2. Create a Product and Price

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add product**
3. Name: `Signal Premium`
4. Add a price:
   - **Recurring** → Monthly
   - **Amount**: $29 (or your chosen amount)
5. Save and copy the **Price ID** (starts with `price_`)

> **Note:** You need the **Price ID**, not the Product ID. The Product ID (`prod_...`) identifies the product; the Price ID (`price_...`) identifies the specific monthly plan used at checkout.

---

## 3. Environment variables

| Variable | Description |
|---------|-------------|
| `STRIPE_SECRET_KEY` | From Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | The Price ID from step 2 |
| `STRIPE_WEBHOOK_SECRET` | From webhook setup (step 4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional; Checkout is server-side |

---

## 4. Webhooks

Each webhook endpoint has its own signing secret. You need one for local dev and one for production.

### Production

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. **Endpoint URL**: `https://signal-project.netlify.app/api/billing/webhook`
3. **Events**: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Netlify

### Local development

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Use the signing secret it prints as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## 5. Test mode vs live mode

- **Test mode** (sandbox): Use `sk_test_...` and `pk_test_...`. No real charges. Test card: `4242 4242 4242 4242`.
- **Live mode**: Use `sk_live_...` and `pk_live_...` when ready for real payments. Create a new Product/Price and webhook in live mode.

---

## 6. Cost summary

- **Stripe**: No monthly fee. 2.9% + 30¢ per transaction.
- **Alternatives**: [Lemon Squeezy](https://lemonsqueezy.com) (5% + 50¢) handles global tax; [Paddle](https://paddle.com) is similar but higher fees.

---

## See also

- [DEPLOYMENT.md](./DEPLOYMENT.md) – Full env vars, Netlify setup, production checklist
