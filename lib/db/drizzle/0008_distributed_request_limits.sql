CREATE TABLE "request_limits" (
	"bucket_key" text PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "request_limits_expiry_idx" ON "request_limits" USING btree ("expires_at");