-- Account plan for Free vs Premium
CREATE TYPE account_plan AS ENUM ('free', 'premium');

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS plan account_plan DEFAULT 'free';

-- Stripe fields for subscription tracking (optional, for webhook)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
