ALTER TABLE deliveries ADD COLUMN handoff_hash text;
ALTER TABLE deliveries ADD COLUMN handoff_expires_at timestamptz;
ALTER TABLE deliveries ADD COLUMN handoff_attempts integer NOT NULL DEFAULT 0 CHECK (handoff_attempts BETWEEN 0 AND 5);
ALTER TABLE deliveries ADD COLUMN proof_confirmed_at timestamptz;
