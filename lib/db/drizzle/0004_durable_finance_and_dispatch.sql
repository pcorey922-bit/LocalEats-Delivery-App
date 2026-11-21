CREATE TABLE "delivery_locations" (
	"delivery_id" uuid PRIMARY KEY NOT NULL,
	"driver_profile_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy_meters" double precision NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_locations_valid_coordinates" CHECK ("delivery_locations"."latitude" between -90 and 90 and "delivery_locations"."longitude" between -180 and 180 and "delivery_locations"."accuracy_meters" >= 0)
);
--> statement-breakpoint
CREATE TABLE "driver_presence" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"available" boolean DEFAULT false NOT NULL,
	"heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"resource_id" text NOT NULL,
	"provider" text NOT NULL,
	"payload" jsonb NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"first_attempt_at" timestamp with time zone,
	"lease_token" uuid,
	"lease_expires_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result" jsonb,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "financial_operations_state_check" CHECK ("financial_operations"."state" in ('queued','processing','pending','succeeded','failed','reconciliation','cancelled')),
	CONSTRAINT "financial_operations_kind_check" CHECK ("financial_operations"."kind" in ('checkout','refund','transfer','reversal','expire_checkout'))
);
--> statement-breakpoint
ALTER TABLE "delivery_locations" ADD CONSTRAINT "delivery_locations_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_locations" ADD CONSTRAINT "delivery_locations_driver_profile_id_profiles_id_fk" FOREIGN KEY ("driver_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_presence" ADD CONSTRAINT "driver_presence_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_operations" ADD CONSTRAINT "financial_operations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_operations_due_idx" ON "financial_operations" USING btree ("state","next_attempt_at");--> statement-breakpoint
CREATE INDEX "financial_operations_order_idx" ON "financial_operations" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_operations_one_running_per_order" ON "financial_operations" USING btree ("order_id") WHERE "financial_operations"."state" = 'processing';--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_one_active_per_driver" ON "deliveries" USING btree ("driver_profile_id") WHERE "deliveries"."status" in ('assigned','picked_up');