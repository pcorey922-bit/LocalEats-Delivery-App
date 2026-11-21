CREATE TABLE mobile_auth_flows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 challenge text NOT NULL CHECK(length(challenge)=43),
 state_hash text NOT NULL CHECK(length(state_hash)=64),
 clerk_user_id text,
 expires_at timestamptz NOT NULL,
 approved_at timestamptz,
 consumed_at timestamptz,
 CHECK((clerk_user_id IS NULL)=(approved_at IS NULL))
);
CREATE INDEX mobile_auth_expiry_idx ON mobile_auth_flows(expires_at);
