# Signal MVP — Brief Review & Pre-Build Discussion

**Reviewed:** Pre-build  
**Your role:** Key decision maker — all changes run by you first.

---

## Overall take

The brief is strong and well-structured. The core value prop is clear, the flows make sense, and the scope feels achievable for 7 days if we stay disciplined. A few decisions and clarifications will help us move fast without rework.

---

## 1. Hosting: Netlify vs Vercel

**Brief says:** Vercel  
**You have:** Netlify already connected

**Recommendation:** Stay on Netlify. It supports Next.js well (serverless functions, env vars, preview deploys). No need to switch unless you prefer Vercel.

**Question:** Are you happy to keep Netlify, or do you want to move to Vercel?

---

## 2. Database: Supabase vs alternatives

**Brief says:** Supabase (Postgres + Auth)

**Pros:** One place for DB + Auth, free tier, good DX.  
**Cons:** Adds another external dependency; auth can be opinionated.

**Alternative:** NextAuth.js + Supabase (Postgres only) — more control over auth flows, but more code.

**Recommendation:** Use Supabase Auth as in the brief. Faster to ship, and you can swap later if needed.

**Manual step:** Create a Supabase project at [supabase.com](https://supabase.com) and grab the URL + anon key + service role key.

---

## 3. Schema: `users` table vs Supabase Auth

Supabase Auth already has `auth.users`. The brief’s `users` table is for app-specific fields (company_name, plan, stripe_customer_id, etc.).

**Recommendation:** Add a `profiles` (or `users`) table that:
- References `auth.users.id`
- Holds: `full_name`, `company_name`, `photo_url`, `plan`, `stripe_customer_id`
- Is populated/updated via a trigger or on first login

**Question:** Do you want `profiles` or `users` as the table name? (I’d use `profiles` to avoid confusion with `auth.users`.)

---

## 4. Deal stage enum — completeness

Current options: `after_discovery`, `after_demo`, `after_proposal`, `chose_competitor`, `said_not_now`, `went_dark`, `other`.

**Question:** Do you want `after_pilot` or `after_trial` as separate stages, or is “other” enough for now?

---

## 5. Prospect micro-page: one question at a time vs all visible

Brief says: “One question at a time (progressive disclosure) OR all visible — test both.”

**Recommendation:** Start with **all visible**. Simpler to build, easier to scan, and 3–4 questions is short enough. Progressive disclosure adds state and navigation logic.

**Question:** Do you want to lock in “all visible” for v1, or keep the option to A/B test later?

---

## 6. Rep photo on micro-page

Brief: “Rep’s first name and photo (if uploaded)”.

**Recommendation:** Make photo optional and low priority. If missing, show initials or first name only. Photo upload adds storage and UI work.

**Question:** Is photo upload a must-have for Day 1, or can it be “post-MVP”?

---

## 7. Email notification to rep on response

Brief: “Send the rep an email notification (or in-app notification for MVP)”.

**Recommendation:** In-app only for MVP. Email needs a provider (Resend, SendGrid, etc.), templates, and deliverability. In-app is enough to validate the flow.

**Question:** Confirm in-app only for v1?

---

## 8. Stripe: webhook vs redirect-only

Brief: “Webhook (or success redirect) updates user’s plan”.

**Risk:** Redirects can fail (user closes tab, network issues). Webhooks are more reliable.

**Recommendation:** Use both: redirect for UX, webhook for source of truth. Stripe docs make this straightforward.

**Manual step:** Configure Stripe webhook endpoint in Stripe Dashboard and add `STRIPE_WEBHOOK_SECRET` to env.

---

## 9. Free tier: 3 Signals per month

**Question:** Is “calendar month” (e.g. Feb 1–28) correct, or do you want rolling 30 days from signup?

**Question:** Should we block creation at 3, or allow creation and gate *sending* (e.g. can create drafts but not get links until upgrade)?

---

## 10. Unique slug: 8–10 chars

**Recommendation:** Use something like `nanoid` or `crypto.randomUUID` truncated. 10–12 chars is a good balance of shortness and collision safety.

**Question:** Any preference for slug format? (e.g. `s/abc123xyz` vs `s/signal-abc123`)

---

## 11. AI: GPT-4 vs GPT-4o / turbo

Brief: “GPT-4 (or GPT-4-turbo)”.

**Recommendation:** Use `gpt-4o` or `gpt-4o-mini` for speed and cost. Quality is strong for this use case.

**Question:** Any strong preference for a specific model?

---

## 12. Build timeline: 7 vs 8 days

Brief has an 8-day plan; you said 7 days.

**Recommendation:** Merge “Day 7: Polish” and “Day 8: Testing + Deploy” into one day. Polish as you go, and keep a focused testing/deploy block at the end.

**Question:** Confirm 7-day plan with combined polish + deploy?

---

## 13. Manual setup checklist (before Day 1)

Things you’ll need to do yourself:

| Item | Where | Notes |
|------|-------|-------|
| Supabase project | supabase.com | Create project, get URL + anon key + service role key |
| OpenAI API key | platform.openai.com | Add payment method if new account |
| Stripe account | dashboard.stripe.com | Test mode; create $29/mo product; get price ID |
| Stripe webhook | Stripe Dashboard → Webhooks | Add endpoint for `checkout.session.completed` |
| `.env.local` | Local project | Populate all keys (see brief) |

---

## 14. Suggested simplifications for 7 days

1. **Photo upload:** Defer to post-MVP.
2. **Edit/regenerate flow:** Start with “Regenerate” only; add edit later if time allows.
3. **`signal_events` table:** Implement for `created`, `page_opened`, `page_completed`; skip `email_copied` initially.
4. **Pricing page:** Simple two cards; no feature comparison table for v1.

---

## 15. Open questions

1. **Landing page:** Do you want a public marketing/landing page (e.g. `/` or `/home`) before login, or go straight to `/login`?
2. **Branding:** Do you have a logo, or should we use text-only “Signal” for now?
3. **Custom domain:** Plan to use one for launch, or Netlify subdomain for MVP?
4. **Testing:** Will you test with real prospects, or internal only for the first version?

---

## Next steps

Once you’ve answered the questions above, we can:
1. Lock in the 7-day plan and update `JOURNEY.md`
2. Start Day 1: project setup, DB schema, auth
3. Work through the manual setup items in parallel
