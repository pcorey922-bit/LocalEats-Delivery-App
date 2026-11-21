ALTER TABLE orders ADD COLUMN reservation_expires_at timestamptz;
UPDATE orders SET reservation_expires_at = placed_at + interval '15 minutes';
ALTER TABLE orders ALTER COLUMN reservation_expires_at SET NOT NULL;
ALTER TABLE orders ALTER COLUMN reservation_expires_at SET DEFAULT (now() + interval '15 minutes');
CREATE INDEX orders_reservation_expiry_idx ON orders(status,reservation_expires_at);
