import { databaseNow } from "./database-clock";
import { randomUUID } from "node:crypto";
import { and, asc, eq, lte, or, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db, webhookInboxTable as inbox } from "@workspace/db";
import { processStripeEvent } from "../routes/payment-webhook";
import { CommerceError } from "./commerce-policy";
export async function processWebhookInbox(
  process: typeof processStripeEvent = processStripeEvent,
) {
  const now = await databaseNow();
  const job = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(inbox)
      .where(
        or(
          and(
            eq(inbox.state, "received"),
            lte(inbox.nextAttemptAt, sql`clock_timestamp()`),
          ),
          and(
            eq(inbox.state, "processing"),
            lte(inbox.leaseExpiresAt, sql`clock_timestamp()`),
          ),
        ),
      )
      .orderBy(asc(inbox.receivedAt))
      .for("update", { skipLocked: true })
      .limit(1);
    if (!row) return null;
    const [claimed] = await tx
      .update(inbox)
      .set({
        state: "processing",
        attempts: row.attempts + 1,
        leaseToken: randomUUID(),
        leaseExpiresAt: new Date(now.getTime() + 60000),
      })
      .where(eq(inbox.id, row.id))
      .returning();
    return claimed;
  });
  if (!job) return false;
  try {
    await process(job.payload as unknown as Stripe.Event);
    await db
      .update(inbox)
      .set({
        state: "processed",
        processedAt: new Date(),
        leaseToken: null,
        leaseExpiresAt: null,
        errorCode: null,
      })
      .where(and(eq(inbox.id, job.id), eq(inbox.leaseToken, job.leaseToken!)));
  } catch (error) {
    await db
      .update(inbox)
      .set({
        state:
          error instanceof CommerceError
            ? "reconciliation"
            : job.attempts >= 10
              ? "dead_letter"
              : "received",
        nextAttemptAt: new Date(
          (await databaseNow()).getTime() +
            Math.min(3600000, 1000 * 2 ** Math.min(job.attempts, 12)),
        ),
        errorCode:
          error instanceof CommerceError
            ? "EVENT_STATE_MISMATCH"
            : "PROCESSING_FAILED",
        leaseToken: null,
        leaseExpiresAt: null,
      })
      .where(and(eq(inbox.id, job.id), eq(inbox.leaseToken, job.leaseToken!)));
  }
  return true;
}
