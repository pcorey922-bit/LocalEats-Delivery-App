ALTER TABLE orders ADD COLUMN timing_policy jsonb NOT NULL DEFAULT '{"reservationMinutes":15,"restaurantResponseMinutes":5,"driverAssignmentMinutes":10,"driverPickupMinutes":10}'::jsonb;
ALTER TABLE orders ADD COLUMN timing_review_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX orders_timing_review_idx ON orders(timing_review_at,id);
CREATE TABLE order_incidents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 kind text NOT NULL CHECK(kind IN ('restaurant_response','driver_unassigned','driver_pickup')),
 phase_key text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
 version integer NOT NULL DEFAULT 1 CHECK(version >= 1), note text, reviewed_by uuid REFERENCES profiles(id),
 opened_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
 UNIQUE(order_id,kind,phase_key)
);
CREATE INDEX order_incidents_status_idx ON order_incidents(status,opened_at);
