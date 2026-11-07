CREATE TABLE financial_holds (
 id text PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id), provider_dispute_id text NOT NULL UNIQUE,
 amount_cents integer NOT NULL CHECK(amount_cents>0), currency text NOT NULL CHECK(currency='usd'),
 provider_status text NOT NULL, active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>=1),
 last_event_created bigint NOT NULL, opened_at timestamptz NOT NULL DEFAULT now(), released_at timestamptz,
 reconciled_by uuid REFERENCES profiles(id), note text
);
CREATE INDEX financial_holds_order_active_idx ON financial_holds(order_id,active);
CREATE TABLE provider_balance_entries (
 id text PRIMARY KEY,order_id uuid NOT NULL REFERENCES orders(id),source_id text NOT NULL,kind text NOT NULL,
 amount_cents integer NOT NULL,fee_cents integer NOT NULL,net_cents integer NOT NULL,
 currency text NOT NULL CHECK(currency='usd'), recorded_at timestamptz NOT NULL DEFAULT now(),
 CHECK(net_cents::bigint=amount_cents::bigint-fee_cents::bigint)
);
CREATE TRIGGER provider_balance_immutable BEFORE UPDATE OR DELETE ON provider_balance_entries FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_immutable();
CREATE TRIGGER provider_balance_no_truncate BEFORE TRUNCATE ON provider_balance_entries FOR EACH STATEMENT EXECUTE FUNCTION rocoeats_ledger_immutable();
