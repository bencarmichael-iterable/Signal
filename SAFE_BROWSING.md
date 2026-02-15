# Avoiding the "Dangerous Site" Flag on Netlify

Your previous site (`mfb-iterable-demo.netlify.app`) was flagged by Chrome's Safe Browsing. Here's how to minimize the risk for Signal.

---

## Why Netlify Sites Get Flagged

Chrome Safe Browsing flags **domains/subdomains**, not individual files. Common causes:

1. **Content** — Phishing-like forms, cloned sites (e.g. fake login pages), or reported content
2. **Shared reputation** — A subdomain pattern or IP can inherit a bad reputation
3. **User reports** — Enough "Report this site" clicks can trigger a flag
4. **False positives** — Demo sites, staging, or generic content sometimes get caught

---

## How to Reduce Risk for Signal

### 1. Use a distinct, professional subdomain

- **Good:** `signal-deals.netlify.app`, `app-signal.netlify.app`, `trysignal.netlify.app`
- **Avoid:** Generic or demo-sounding names like `iterable-demo`, `test-site`, `mfb-demo`

### 2. Keep content clearly legitimate

- No fake login pages or phishing-style forms
- No clones of other brands (Netflix, Google, etc.)
- Clear, professional copy and purpose
- Real product, real value proposition

### 3. Add security headers (when we build)

We'll add a `Content-Security-Policy` and other headers via Netlify config to signal a secure, intentional site.

### 4. If Signal ever gets flagged

- Use [Google Safe Browsing](https://safebrowsing.google.com/safebrowsing/report_error/) to request a review
- Reviews usually take a few days
- A custom domain (e.g. `usesignal.com`) has its own reputation and can help

---

## For Signal Specifically

Signal is a clear B2B SaaS product with:

- Legitimate signup/login
- No deceptive or phishing-style flows
- Professional prospect-facing micro-pages

Using a clear subdomain like `signal-deals.netlify.app` or `trysignal.netlify.app` and keeping content professional should keep the risk low. The previous flag was likely tied to that specific subdomain or its content, not Netlify in general.
