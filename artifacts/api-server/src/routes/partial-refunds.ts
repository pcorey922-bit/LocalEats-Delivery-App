import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ordersTable,
  paymentsTable,
  refundsTable,
  partialRefundsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { CommerceError } from "../lib/commerce-policy";
import { requirePaymentProvider } from "../lib/payment-provider";
import { audit } from "../lib/commerce";
import { requirePaymentJournal } from "../lib/ledger";
import { enqueueFinancialOperation } from "../lib/finance-queue";
import { requireNoFinancialHold } from "../lib/financial-holds";
const router = Router();
router.get(
  "/admin/orders/:orderId/partial-refunds",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const orderId = z.string().uuid().parse(req.params.orderId);
    res.json(
      await db
        .select()
        .from(partialRefundsTable)
        .where(eq(partialRefundsTable.orderId, orderId))
        .orderBy(desc(partialRefundsTable.createdAt)),
    );
  },
);
router.post(
  "/admin/orders/:orderId/partial-refunds",
  requireAuth,
  async (req, res) => {
    const actor = await getActiveProfile(req, res);
    if (!actor || !requireRole(actor, ["admin"], res)) return;
    if (requirePaymentProvider() !== "stripe_test")
      throw new CommerceError(409, "Stripe test configuration is required");
    const orderId = z.string().uuid().parse(req.params.orderId),
      input = z
        .object({
          id: z.string().uuid(),
          amountCents: z.number().int().positive().max(2147483647),
          fundingPolicy: z.literal("platform_goodwill_v1"),
          reason: z.string().trim().min(10).max(500),
        })
        .strict()
        .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");
      if (!order) throw new CommerceError(404, "Order not found");
    await requireNoFinancialHold(tx,order.id);
      const [existing] = await tx
        .select()
        .from(partialRefundsTable)
        .where(eq(partialRefundsTable.id, input.id));
      if (existing) {
        if (
          existing.orderId !== orderId ||
          existing.amountCents !== input.amountCents ||
          existing.reason !== input.reason ||
          existing.actorProfileId !== actor.id
        )
          throw new CommerceError(
            409,
            "Refund ID conflicts with an existing request",
          );
        return existing;
      }
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId));
      if (
        order.status !== "delivered" ||
        payment?.status !== "succeeded" ||
        payment.provider !== "stripe_test" ||
        !payment.providerPaymentId
      )
        throw new CommerceError(
          409,
          "Platform-funded partial refunds require a delivered, paid Stripe test order",
        );
      const [full] = await tx
        .select()
        .from(refundsTable)
        .where(eq(refundsTable.orderId, orderId));
      if (full)
        throw new CommerceError(
          409,
          "A full refund already exists; reconcile it before any adjustment",
        );
      await requirePaymentJournal(tx, orderId);
      const previous = await tx
        .select()
        .from(partialRefundsTable)
        .where(eq(partialRefundsTable.orderId, orderId));
      const reserved = previous
        .filter((r) => !["failed", "canceled"].includes(r.status))
        .reduce((n, r) => n + r.amountCents, 0);
      if (input.amountCents + reserved >= payment.amountCents)
        throw new CommerceError(
          409,
          "Cumulative partial refunds must be below the charge total; use the remaining full-refund workflow",
        );
      const [refund] = await tx
        .insert(partialRefundsTable)
        .values({ ...input, orderId, actorProfileId: actor.id })
        .onConflictDoNothing()
        .returning();
      if (!refund)
        throw new CommerceError(
          409,
          "Refund ID is already used by another request",
        );
      await enqueueFinancialOperation(tx, {
        id: `partial_refund:${input.id}`,
        orderId,
        kind: "partial_refund",
        resourceId: input.id,
        payload: {
          paymentId: payment.providerPaymentId,
          amount: input.amountCents,
          currency: "usd",
          fundingPolicy: input.fundingPolicy,
        },
      });
      await audit(tx, actor.id, "partial_refund.requested", orderId, {
        refundId: input.id,
        ...input,
      });
      return refund;
    });
    res.status(202).json(result);
  },
);
export default router;
