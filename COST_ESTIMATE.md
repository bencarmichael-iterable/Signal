# Signal MVP — AI Cost Estimate

## TL;DR

**Dollars, not hundreds or thousands.** Expect **$1–10** for the full 7-day build + demo phase. Ongoing: **~$2–5/month** for early usage (50–100 signals/month).

---

## Model Choice: GPT-4o-mini

Recommended for cost + quality balance. Pricing (approximate):

- **Input:** ~$0.15 per 1M tokens  
- **Output:** ~$0.60 per 1M tokens  

[OpenAI Pricing](https://platform.openai.com/docs/pricing)

---

## Usage per Signal

### 1. Micro-page generation (when rep creates a Signal)

| Component | Tokens | Cost |
|-----------|--------|------|
| System prompt + deal context | ~800 input | ~$0.00012 |
| JSON output (intro, questions, email) | ~500 output | ~$0.00030 |
| **Per generation** | | **~$0.0004** |

### 2. Response summary (when prospect submits)

| Component | Tokens | Cost |
|-----------|--------|------|
| Context + answers | ~1,000 input | ~$0.00015 |
| Summary JSON | ~300 output | ~$0.00018 |
| **Per summary** | | **~$0.0003** |

### 3. Total per completed Signal

- Generation: ~$0.0004  
- Summary: ~$0.0003  
- **~$0.0007 per full signal** ≈ **1,400 signals per $1**

---

## Build Phase (7 days)

| Activity | Volume | Cost |
|----------|--------|------|
| Testing generations (iteration, debugging) | 50–150 | ~$0.02–0.06 |
| Demo signals (create + some completed) | 20–50 | ~$0.02–0.04 |
| **Total build** | | **~$0.05–0.50** |

---

## First Month (post-launch)

| Scenario | Signals | Completions | Cost |
|----------|---------|-------------|------|
| Light (10 users) | 30 | 10 | ~$0.03 |
| Medium (50 users) | 100 | 30 | ~$0.10 |
| Heavy (100 users) | 250 | 75 | ~$0.25 |

---

## Summary

| Phase | Est. cost |
|-------|-----------|
| 7-day build + demo | **$1–10** |
| First month (early usage) | **$1–5** |
| At 500 signals/month | **~$0.50** |

**Conclusion:** AI cost is negligible for MVP. GPT-4o-mini is the right choice for quality and cost.
