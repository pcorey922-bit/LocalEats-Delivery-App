ALTER TABLE restaurants ADD COLUMN receipt_mode text NOT NULL DEFAULT 'electronic' CHECK(receipt_mode IN ('electronic','telephone'));
ALTER TABLE orders ADD COLUMN confirmation_mode text NOT NULL DEFAULT 'electronic' CHECK(confirmation_mode IN ('electronic','telephone'));
CREATE TABLE telephone_confirmations (
 order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','contacted','accepted','rejected')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 contacted_at timestamptz, confirmed_at timestamptz,
 dispatcher_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
 preparation_minutes integer CHECK(preparation_minutes BETWEEN 1 AND 240),
 confirmed_subtotal_cents integer CHECK(confirmed_subtotal_cents>=0),
 note text CHECK(length(note)<=2000), last_request_id uuid, request_hash text,
 CHECK(status!='accepted' OR (contacted_at IS NOT NULL AND confirmed_at IS NOT NULL AND dispatcher_id IS NOT NULL AND preparation_minutes IS NOT NULL AND confirmed_subtotal_cents IS NOT NULL))
);
CREATE INDEX telephone_confirmation_pending_idx ON telephone_confirmations(status,order_id);
