CREATE TABLE partial_refunds (
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES orders(id),amount_cents integer NOT NULL CHECK(amount_cents > 0),
 funding_policy text NOT NULL DEFAULT 'platform_goodwill_v1' CHECK(funding_policy='platform_goodwill_v1'),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','requires_action','succeeded','failed','canceled')),
 provider_refund_id text UNIQUE,actor_profile_id uuid NOT NULL REFERENCES profiles(id),reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partial_refunds_order_idx ON partial_refunds(order_id,created_at);
ALTER TABLE financial_operations DROP CONSTRAINT financial_operations_kind_check;
ALTER TABLE financial_operations ADD CONSTRAINT financial_operations_kind_check CHECK(kind IN ('checkout','refund','partial_refund','transfer','reversal','expire_checkout'));
CREATE FUNCTION protect_partial_refund_request() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP <> 'UPDATE' THEN RAISE EXCEPTION 'Partial refund records cannot be removed'; END IF;
 IF ROW(NEW.id,NEW.order_id,NEW.amount_cents,NEW.funding_policy,NEW.actor_profile_id,NEW.reason,NEW.created_at)
    IS DISTINCT FROM ROW(OLD.id,OLD.order_id,OLD.amount_cents,OLD.funding_policy,OLD.actor_profile_id,OLD.reason,OLD.created_at)
 THEN RAISE EXCEPTION 'Partial refund request is immutable'; END IF;
 IF OLD.provider_refund_id IS NOT NULL AND NEW.provider_refund_id IS DISTINCT FROM OLD.provider_refund_id THEN RAISE EXCEPTION 'Provider refund identity is immutable'; END IF;
 IF OLD.status='succeeded' AND NEW.status<>'succeeded' THEN RAISE EXCEPTION 'Confirmed refunds cannot regress'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER partial_refund_immutable BEFORE UPDATE OR DELETE ON partial_refunds FOR EACH ROW EXECUTE FUNCTION protect_partial_refund_request();
CREATE TRIGGER partial_refund_no_truncate BEFORE TRUNCATE ON partial_refunds FOR EACH STATEMENT EXECUTE FUNCTION protect_partial_refund_request();
