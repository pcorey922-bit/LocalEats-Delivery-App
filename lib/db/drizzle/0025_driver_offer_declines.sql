CREATE TABLE driver_offer_declines (
 driver_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 reason text NOT NULL CHECK(length(reason) BETWEEN 5 AND 300),
 declined_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL CHECK(expires_at>declined_at),
 PRIMARY KEY(driver_profile_id,order_id)
);
CREATE INDEX driver_offer_declines_expiry_idx ON driver_offer_declines(expires_at);
