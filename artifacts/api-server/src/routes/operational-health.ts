import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import { z } from "zod";
import {
  db,
  financialOperationsTable as finance,
  webhookInboxTable as inbox,
  payoutProvisioningTable,
  workerHeartbeatsTable,
  notificationsTable,
  requestLimitsTable,
  pushDeliveriesTable as pushJobs,
} from "@workspace/db";
import { pushConfiguration } from "../lib/push";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
import { readPricing, audit } from "../lib/commerce";
import { CommerceError, paymentMode } from "../lib/commerce-policy";
export const readiness: RequestHandler = async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    let pricingReady = false;
    try {
      await readPricing();
      pricingReady = true;
    } catch {}
    const provider = paymentMode();
    const workers = await db
      .select()
      .from(workerHeartbeatsTable)
      .where(
        lt(
          sql`now()-interval '90 seconds'`,
          workerHeartbeatsTable.lastSuccessAt,
        ),
      );
    const workerReady = ["finance", "webhooks", "onboarding", "push", "orders"].every(
      (component) => workers.some((w) => w.component === component),
    );
    const authReady = Boolean(
      process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY,
    );
    const ready =
      pricingReady &&
      provider === "stripe_test" &&
      workerReady &&
      authReady &&
      !process.env.ROCOEATS_DRAINING;
    res.status(ready ? 200 : 503).json({
      ready,
      database: true,
      pricingReady,
      providerConfigured: provider === "stripe_test",
      authReady,
      workerReady,
      liveChargesEnabled: false,
    });
  } catch {
    res
      .status(503)
      .json({ ready: false, error: "Service dependencies are not ready" });
  }
};
const router: IRouter = Router();
router.get("/admin/webhook-inbox", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  const { state } = z
    .object({
      state: z
        .enum([
          "received",
          "processing",
          "processed",
          "reconciliation",
          "dead_letter",
        ])
        .optional(),
    })
    .strict()
    .parse(req.query);
  res.json(
    await db
      .select({
        id: inbox.id,
        eventType: inbox.eventType,
        state: inbox.state,
        attempts: inbox.attempts,
        errorCode: inbox.errorCode,
        receivedAt: inbox.receivedAt,
        nextAttemptAt: inbox.nextAttemptAt,
      })
      .from(inbox)
      .where(state ? eq(inbox.state, state) : undefined)
      .orderBy(desc(inbox.receivedAt))
      .limit(200),
  );
});
router.post(
  "/admin/webhook-inbox/:eventId/retry",
  requireAuth,
  async (req, res) => {
    const actor = await getActiveProfile(req, res);
    if (!actor || !requireRole(actor, ["admin"], res)) return;
    const eventId = z.string().min(1).max(255).parse(req.params.eventId);
    const { reason } = z
      .object({ reason: z.string().trim().min(10).max(500) })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(inbox)
        .where(eq(inbox.id, eventId))
        .for("update")
        .limit(1);
      if (!event) throw new CommerceError(404, "Event not found");
      if (!["reconciliation", "dead_letter"].includes(event.state))
        throw new CommerceError(409, "Event is not held for recovery");
      await tx
        .update(inbox)
        .set({
          state: "received",
          errorCode: null,
          nextAttemptAt: new Date(),
          leaseToken: null,
          leaseExpiresAt: null,
          attempts: 0,
        })
        .where(eq(inbox.id, eventId));
      await audit(tx, actor.id, "webhook.retry_requested", eventId, { reason });
    });
    res.status(202).json({ eventId, state: "received" });
  },
);
router.get("/admin/push-deliveries", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  const { state } = z
    .object({
      state: z
        .enum([
          "pending",
          "processing",
          "provider_accepted",
          "unregistered",
          "invalid_token",
          "failed",
        ])
        .optional(),
    })
    .strict()
    .parse(req.query);
  res.json(
    await db
      .select({
        id: pushJobs.id,
        notificationId: pushJobs.notificationId,
        state: pushJobs.state,
        attempts: pushJobs.attempts,
        errorCode: pushJobs.errorCode,
        nextAttemptAt: pushJobs.nextAttemptAt,
        acceptedAt: pushJobs.acceptedAt,
        createdAt: pushJobs.createdAt,
      })
      .from(pushJobs)
      .where(state ? eq(pushJobs.state, state) : undefined)
      .orderBy(desc(pushJobs.createdAt))
      .limit(100),
  );
});
router.post(
  "/admin/push-deliveries/:deliveryId/retry",
  requireAuth,
  async (req, res) => {
    const actor = await getActiveProfile(req, res);
    if (!actor || !requireRole(actor, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.deliveryId);
    const { reason } = z
      .object({ reason: z.string().trim().min(10).max(500) })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [reference] = await tx
        .select()
        .from(pushJobs)
        .where(eq(pushJobs.id, id))
        .limit(1);
      if (!reference)
        throw new CommerceError(404, "Delivery attempt not found");
      await tx
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, reference.notificationId))
        .for("update");
      const [job] = await tx
        .select()
        .from(pushJobs)
        .where(eq(pushJobs.id, id))
        .for("update")
        .limit(1);
      if (job.state !== "failed")
        throw new CommerceError(
          409,
          "Only exhausted transient failures can be retried; invalid devices must register again",
        );
      await tx
        .update(pushJobs)
        .set({
          state: "pending",
          attempts: 0,
          nextAttemptAt: new Date(),
          errorCode: null,
          leaseToken: null,
          leaseExpiresAt: null,
        })
        .where(eq(pushJobs.id, id));
      await tx
        .update(notificationsTable)
        .set({ pushState: "queued" })
        .where(eq(notificationsTable.id, job.notificationId));
      await audit(tx, actor.id, "push.retry_requested", id, { reason });
    });
    res.status(202).json({ id, state: "pending" });
  },
);
router.get("/admin/operational-health", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  const [financial, webhooks, provisioning, push, workers, pushDeliveries] =
    await Promise.all([
      db
        .select({
          state: finance.state,
          count: count(),
          oldest: sql<Date | null>`min(${finance.createdAt})`,
        })
        .from(finance)
        .groupBy(finance.state),
      db
        .select({
          state: inbox.state,
          count: count(),
          oldest: sql<Date | null>`min(${inbox.receivedAt})`,
        })
        .from(inbox)
        .groupBy(inbox.state),
      db
        .select({ state: payoutProvisioningTable.state, count: count() })
        .from(payoutProvisioningTable)
        .groupBy(payoutProvisioningTable.state),
      db
        .select({ state: notificationsTable.pushState, count: count() })
        .from(notificationsTable)
        .groupBy(notificationsTable.pushState),
      db
        .select()
        .from(workerHeartbeatsTable)
        .orderBy(desc(workerHeartbeatsTable.lastSuccessAt))
        .limit(100),
      db
        .select({
          state: pushJobs.state,
          count: count(),
          oldest: sql<Date | null>`min(${pushJobs.createdAt})`,
        })
        .from(pushJobs)
        .groupBy(pushJobs.state),
    ]);
  res.json({
    financial,
    webhooks,
    provisioning,
    push,
    workers,
    pushDeliveries,
    pushConfiguration: pushConfiguration(),
    observedAt: new Date(),
    liveChargesEnabled: false,
  });
});
export default router;
