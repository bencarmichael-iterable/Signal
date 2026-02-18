# Signal - Locked Decisions

Decisions made before and during build. Reference this during development.

---

## Tech & Infrastructure

| Decision | Choice |
|----------|--------|
| Hosting | Netlify |
| Schema table name | `users` (app-specific, linked to Supabase Auth) |
| AI model | Lower cost - **GPT-4o-mini** (or gpt-4.1-nano when available) |
| Deal stages | Add `after_trial` to enum |

---

## UX & Product

| Decision | Choice |
|----------|--------|
| Micro-page layout | **Carousel** - questions one at a time, capture responses as user progresses (can iterate on UX) |
| Rep photo | Optional upload |
| Rep notification | Discuss later - explore **Iterable** for email notifications |
| Free tier | **Rolling 30 days** from signup |
| Free tier limit | Allow **drafts** after 3 Signals, but **upsell to publish** (can't get link/send until upgrade) |
| Pricing page | Simple 2 cards |
| Landing page | **Public marketing page** before login - "most convincing SaaS landing page ever" |

---

## Signal Types & Settings (added)

| Decision | Choice |
|----------|--------|
| Signal types | **Deal stalled**, **Mid-deal**, **Prospecting** - each with own form and prompts |
| Settings access | **Admin only** - account-level |
| Settings scope | **Company profile** (product description, differentiators) + **AI prompts** (custom per signal type) |
| Teams | For manager views and Insights filtering |

---

## Domain & Safety

| Decision | Choice |
|----------|--------|
| Domain | Netlify subdomain OK |
| Safe Browsing | See "Avoiding Dangerous Site Flag" below |

---

## Out of Scope for MVP

- Photo upload: Optional but included
- Edit flow: Regenerate only for v1
- `email_copied` event: Skip
- Rep email notification: To be explored with Iterable
