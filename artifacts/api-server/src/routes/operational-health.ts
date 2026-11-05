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
} from "@workspace/db";
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
          sql`now()-interval '60 seconds'`,
          workerHeartbeatsTable.lastSuccessAt,
        ),
      );
    const workerReady = ["finance", "webhooks", "onboarding", "push"].every(
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
    res
      .status(ready ? 200 : 503)
      .json({
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
router.get("/admin/operational-health", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  const [financial, webhooks, provisioning, push, workers] = await Promise.all([
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
  ]);
  res.json({
    financial,
    webhooks,
    provisioning,
    push,
    workers,
    observedAt: new Date(),
    liveChargesEnabled: false,
  });
});
export default router;
