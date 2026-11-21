CREATE TABLE "push_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_token" uuid,
	"lease_expires_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error_code" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_delivery_state_valid" CHECK ("push_deliveries"."state" in ('pending','processing','provider_accepted','unregistered','invalid_token','failed')),
	CONSTRAINT "push_delivery_attempts_valid" CHECK ("push_deliveries"."attempts" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "push_delivery_notification_device_key" ON "push_deliveries" USING btree ("notification_id","device_id");--> statement-breakpoint
CREATE INDEX "push_delivery_due_idx" ON "push_deliveries" USING btree ("state","next_attempt_at");--> statement-breakpoint
CREATE INDEX "notifications_push_due_idx" ON "notifications" USING btree ("push_state","push_next_attempt_at");
--> statement-breakpoint
UPDATE notifications SET push_state='provider_accepted' WHERE push_state='delivered';
