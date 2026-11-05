import { randomUUID } from "node:crypto";
import { and, asc, eq, lte, or } from "drizzle-orm";
import type Stripe from "stripe";
import { db, webhookInboxTable as inbox } from "@workspace/db";
import { processStripeEvent } from "../routes/payment-webhook";
import { CommerceError } from "./commerce-policy";
export async function processWebhookInbox() {
  const now = new Date();
  const job = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(inbox)
      .where(
        or(
          eq(inbox.state, "received"),
          and(eq(inbox.state, "processing"), lte(inbox.leaseExpiresAt, now)),
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
        leaseExpiresAt: new Date(Date.now() + 60000),
      })
      .where(eq(inbox.id, row.id))
      .returning();
    return claimed;
  });
  if (!job) return false;
  try {
    await processStripeEvent(job.payload as unknown as Stripe.Event);
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
        state: error instanceof CommerceError ? "reconciliation" : "received",
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
