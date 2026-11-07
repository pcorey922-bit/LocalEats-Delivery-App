-- Arrival is a driver attestation for the current assignment, not GPS-verified proof.
ALTER TABLE deliveries ADD COLUMN arrived_at timestamptz;
