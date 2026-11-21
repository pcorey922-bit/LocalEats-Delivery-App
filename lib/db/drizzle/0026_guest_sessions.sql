CREATE TABLE guest_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE RESTRICT,
 token_hash text NOT NULL UNIQUE CHECK(length(token_hash)=64),
 email text NOT NULL CHECK(length(email)<=254),
 phone text NOT NULL CHECK(length(phone) BETWEEN 7 AND 30),
 order_id uuid UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at>created_at)
);
CREATE INDEX guest_sessions_expiry_idx ON guest_sessions(expires_at);
