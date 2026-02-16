-- Add new fields for Signal creation form
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS speaking_duration TEXT,
  ADD COLUMN IF NOT EXISTS last_contact_ago TEXT,
  ADD COLUMN IF NOT EXISTS what_rep_wants_to_learn JSONB;
