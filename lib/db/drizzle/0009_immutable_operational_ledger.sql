CREATE TABLE "ledger_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" text NOT NULL,
	"account" text NOT NULL,
	"party_profile_id" uuid,
	"amount_cents" integer NOT NULL,
	CONSTRAINT "ledger_nonzero_amount" CHECK ("ledger_lines"."amount_cents"<>0),
	CONSTRAINT "ledger_account_valid" CHECK ("ledger_lines"."account" in ('platform_cash','customer_funds','restaurant_payable','driver_payable','tax_payable','platform_revenue','restaurant_recovery','driver_recovery','provider_fee')),
	CONSTRAINT "ledger_party_required" CHECK ((("ledger_lines"."account" in ('restaurant_payable','driver_payable','restaurant_recovery','driver_recovery')) = ("ledger_lines"."party_profile_id" is not null)))
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_currency_usd" CHECK ("ledger_transactions"."currency"='USD')
);
--> statement-breakpoint
ALTER TABLE "ledger_lines" ADD CONSTRAINT "ledger_lines_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_lines" ADD CONSTRAINT "ledger_lines_party_profile_id_profiles_id_fk" FOREIGN KEY ("party_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_lines_transaction_idx" ON "ledger_lines" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_lines_account_party_idx" ON "ledger_lines" USING btree ("account","party_profile_id");--> statement-breakpoint
CREATE INDEX "ledger_transactions_order_idx" ON "ledger_transactions" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE FUNCTION rocoeats_ledger_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Ledger records are append-only; use a correcting journal' USING ERRCODE='23514'; END;
$$;
--> statement-breakpoint
CREATE TRIGGER ledger_transactions_immutable BEFORE UPDATE OR DELETE ON ledger_transactions FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_immutable();
--> statement-breakpoint
CREATE TRIGGER ledger_lines_immutable BEFORE UPDATE OR DELETE ON ledger_lines FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_immutable();
--> statement-breakpoint
CREATE FUNCTION rocoeats_ledger_balanced() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE journal_id text; line_count bigint; balance bigint;
BEGIN
 IF TG_TABLE_NAME='ledger_transactions' THEN journal_id=NEW.id; ELSE journal_id=NEW.transaction_id; END IF;
 SELECT count(*),coalesce(sum(amount_cents),0) INTO line_count,balance FROM ledger_lines WHERE transaction_id=journal_id;
 IF line_count<2 OR balance<>0 THEN RAISE EXCEPTION 'Ledger transaction must balance with at least two lines' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_header_balance AFTER INSERT ON ledger_transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_balanced();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_line_balance AFTER INSERT ON ledger_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_balanced();
--> statement-breakpoint
CREATE TRIGGER ledger_transactions_no_truncate BEFORE TRUNCATE ON ledger_transactions FOR EACH STATEMENT EXECUTE FUNCTION rocoeats_ledger_immutable();
--> statement-breakpoint
CREATE TRIGGER ledger_lines_no_truncate BEFORE TRUNCATE ON ledger_lines FOR EACH STATEMENT EXECUTE FUNCTION rocoeats_ledger_immutable();
--> statement-breakpoint
CREATE FUNCTION rocoeats_ledger_new_lines() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 -- Lines must be committed atomically with their new header. Even balanced
 -- additions to an earlier journal would invalidate its immutable fingerprint.
 IF NOT EXISTS (SELECT 1 FROM ledger_transactions WHERE id=NEW.transaction_id
   AND xmin::text=(pg_current_xact_id()::text::numeric % 4294967296)::text)
 THEN RAISE EXCEPTION 'Cannot append lines to a committed journal' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ledger_lines_new_journal BEFORE INSERT ON ledger_lines FOR EACH ROW EXECUTE FUNCTION rocoeats_ledger_new_lines();
