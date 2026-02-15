-- Signal MVP Database Schema
-- Run this in Supabase SQL Editor

-- Extend deal_stage enum
CREATE TYPE deal_stage AS ENUM (
  'after_discovery',
  'after_demo',
  'after_proposal',
  'after_trial',
  'chose_competitor',
  'said_not_now',
  'went_dark',
  'other'
);

CREATE TYPE signal_status AS ENUM (
  'created',
  'sent',
  'opened',
  'completed',
  'expired'
);

CREATE TYPE ai_recommendation AS ENUM (
  're_engage',
  'pivot_approach',
  'move_on',
  'revisit_later'
);

CREATE TYPE plan_type AS ENUM ('free', 'pro');

-- App users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  photo_url TEXT,
  plan plan_type DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals (deal recovery micro-pages)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_first_name TEXT NOT NULL,
  prospect_company TEXT NOT NULL,
  what_was_pitched TEXT NOT NULL,
  deal_stage_when_stalled deal_stage NOT NULL,
  rep_hypothesis TEXT,
  specific_context TEXT,
  generated_page_content JSONB,
  unique_slug TEXT UNIQUE NOT NULL,
  status signal_status DEFAULT 'created',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospect responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  ai_summary TEXT,
  ai_recommendation ai_recommendation,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event tracking
CREATE TYPE signal_event_type AS ENUM (
  'created',
  'page_opened',
  'page_completed'
);

CREATE TABLE signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  event_type signal_event_type NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_signals_user_id ON signals(user_id);
CREATE INDEX idx_signals_unique_slug ON signals(unique_slug);
CREATE INDEX idx_signals_status ON signals(status);
CREATE INDEX idx_responses_signal_id ON responses(signal_id);
CREATE INDEX idx_signal_events_signal_id ON signal_events(signal_id);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_events ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own row
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Signals: users can CRUD own signals
CREATE POLICY "Users can manage own signals" ON signals
  FOR ALL USING (auth.uid() = user_id);

-- Responses: users can read responses for their signals
CREATE POLICY "Users can read own signal responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = responses.signal_id
      AND signals.user_id = auth.uid()
    )
  );

-- Signal events: users can read for their signals
CREATE POLICY "Users can read own signal events" ON signal_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = signal_events.signal_id
      AND signals.user_id = auth.uid()
    )
  );

-- Trigger: create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'company_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
