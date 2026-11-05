import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import {
  db,
  ordersTable,
  paymentsTable,
  payoutsTable,
  profilesTable,
  refundsTable,
  connectedAccountsTable,
  notificationsTable,
  platformSettingsTable,
  auditLogsTable,
  restaurantsTable,
  notificationDevicesTable,
  restaurantHoursTable,
  accountDeletionRequestsTable,
  financialOperationsTable,
  payoutProvisioningTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
import {
  audit,
  cancelOrRefundOrder,
  readPricing,
  recordPayment,
  settlePayout,
} from "../lib/commerce";
import {
  CommerceError,
  checkoutOrigin,
  paymentMode,
  pricingSchema,
} from "../lib/commerce-policy";
import {
  createTestCheckout,
  requireFreshOperation,
  requirePaymentProvider,
  stripeTest,
} from "../lib/payment-provider";
import { pushConfiguration } from "../lib/push";
import { ensureAccepting, openAt } from "../lib/restaurant-availability";
const router: IRouter = Router();
const uuid = z.string().uuid();
async function ownedOrder(req: Request, res: Response) {
  const profile = await getActiveProfile(req, res);
  if (!profile) return null;
  const id = uuid.parse(req.params.orderId);
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!order) throw new CommerceError(404, "Order not found");
  if (order.customerProfileId !== profile.id && profile.role !== "admin")
    throw new CommerceError(403, "You cannot access this payment");
  return { profile, order };
}
router.get("/commerce/config", async (_req, res) => {
  let pricing = null;
  try {
    pricing = await readPricing();
  } catch (error) {
    if (!(error instanceof CommerceError && error.status === 503)) throw error;
  }
  res.json({
    mode: paymentMode(),
    testMode: true,
    liveChargesEnabled: false,
    pricing,
    configurationRequired: pricing === null,
    taxNotice:
      "Pricing and tax policy must be explicitly configured. Provider test mode does not certify production tax accuracy.",
  });
});
router.post("/orders/:orderId/checkout", requireAuth, async (req, res) => {
  const owned = await ownedOrder(req, res);
  if (!owned) return;
  const mode = requirePaymentProvider();
  if (mode === "stripe_test") {
    res
      .status(202)
      .json(
        await (
          await import("../lib/financial-operations")
        ).requestProviderCheckout(owned.order.id, owned.profile),
      );
    return;
  }
  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, owned.order.id))
      .for("update")
      .limit(1);
    if (order.status !== "placed")
      throw new CommerceError(
        409,
        "Only an unpaid placed order can enter checkout",
      );
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, order.id))
      .limit(1);
    if (
      !payment ||
      !order.pricingSnapshot ||
      payment.provider !== mode ||
      !["pending", "failed"].includes(payment.status)
    )
      throw new CommerceError(409, "Payment is unavailable for this order");
    const [restaurant] = await tx
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, order.restaurantId))
      .limit(1);
    if (restaurant?.status !== "approved")
      throw new CommerceError(409, "Restaurant is no longer accepting orders");
    await ensureAccepting(restaurant, tx);
    if (payment.checkoutSessionId)
      return {
        mode,
        sessionId: payment.checkoutSessionId,
        url: null,
        testMode: true,
      };
    const attempt = payment.checkoutAttempt + 1;
    const session = await createTestCheckout(order, attempt);
    await tx
      .update(paymentsTable)
      .set({
        checkoutSessionId: session.id,
        checkoutAttempt: attempt,
        status: "pending",
      })
      .where(eq(paymentsTable.id, payment.id));
    await audit(tx, owned.profile.id, "checkout.created", order.id, {
      sessionId: session.id,
    });
    return { mode, sessionId: session.id, url: session.url, testMode: true };
  });
  res.json(result);
});
router.post(
  "/orders/:orderId/sandbox-payment",
  requireAuth,
  async (req, res) => {
    const owned = await ownedOrder(req, res);
    if (!owned) return;
    if (requirePaymentProvider() !== "sandbox")
      throw new CommerceError(404, "Local simulator is disabled");
    const { outcome } = z
      .object({ outcome: z.enum(["succeeded", "declined"]) })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, owned.order.id))
        .for("update")
        .limit(1);
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id))
        .limit(1);
      if (
        order.status !== "placed" ||
        !payment?.checkoutSessionId ||
        payment.provider !== "sandbox"
      )
        throw new CommerceError(409, "Start sandbox checkout first");
      if (outcome === "succeeded")
        await recordPayment(
          tx,
          order.id,
          `sandbox_payment_${order.id}`,
          payment.amountCents,
          payment.currency,
        );
      else if (payment.status !== "succeeded")
        await audit(tx, owned.profile.id, "sandbox.card_declined", order.id);
    });
    if (outcome === "declined") {
      res.status(402).json({
        error: "Sandbox card declined. No money moved.",
        testMode: true,
      });
      return;
    }
    res.json({ status: "succeeded", testMode: true, moneyMoved: false });
  },
);
router.post("/orders/:orderId/cancel", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const id = uuid.parse(req.params.orderId);
  const { reason } = z
    .object({ reason: z.string().trim().min(3).max(500) })
    .strict()
    .parse(req.body);
  res.json(await cancelOrRefundOrder(id, profile, reason));
});
router.get("/orders/:orderId/payment", requireAuth, async (req, res) => {
  const owned = await ownedOrder(req, res);
  if (!owned) return;
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, owned.order.id))
    .limit(1);
  const [refund] = await db
    .select()
    .from(refundsTable)
    .where(eq(refundsTable.orderId, owned.order.id))
    .limit(1);
  res.json({ testMode: true, payment, refund: refund ?? null });
});
router.get("/restaurants/:restaurantId/availability", async (req, res) => {
  const id = uuid.parse(req.params.restaurantId);
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(
      and(eq(restaurantsTable.id, id), eq(restaurantsTable.status, "approved")),
    )
    .limit(1);
  if (!restaurant)
    throw new CommerceError(404, "Approved restaurant not found");
  const hours = await db
    .select()
    .from(restaurantHoursTable)
    .where(eq(restaurantHoursTable.restaurantId, id));
  res.json({
    acceptingOrders: restaurant.acceptingOrders,
    isOpen: restaurant.acceptingOrders && openAt(hours),
    timezone: "America/New_York",
    hours,
  });
});
router.get(
  "/restaurants/me/availability/settings",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) throw new CommerceError(404, "Restaurant not found");
    res.json({
      acceptingOrders: restaurant.acceptingOrders,
      hours: await db
        .select()
        .from(restaurantHoursTable)
        .where(eq(restaurantHoursTable.restaurantId, restaurant.id)),
    });
  },
);
router.put(
  "/restaurants/me/availability/settings",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (!restaurant) throw new CommerceError(404, "Restaurant not found");
    const row = z
      .object({
        weekday: z.number().int().min(0).max(6),
        isClosed: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        closeTime: z.string().regex(/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/),
      })
      .strict()
      .refine(
        (h) => h.isClosed || h.openTime < h.closeTime,
        "Closing time must follow opening time on the same day",
      );
    const value = z
      .object({
        acceptingOrders: z.boolean(),
        hours: z
          .array(row)
          .length(7)
          .refine(
            (h) => new Set(h.map((r) => r.weekday)).size === 7,
            "Provide each weekday exactly once",
          ),
      })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      await tx
        .update(restaurantsTable)
        .set({ acceptingOrders: value.acceptingOrders })
        .where(eq(restaurantsTable.id, restaurant.id));
      for (const hour of value.hours)
        await tx
          .insert(restaurantHoursTable)
          .values({ ...hour, restaurantId: restaurant.id })
          .onConflictDoUpdate({
            target: [
              restaurantHoursTable.restaurantId,
              restaurantHoursTable.weekday,
            ],
            set: hour,
          });
      await audit(tx, profile.id, "restaurant.availability", restaurant.id, {
        acceptingOrders: value.acceptingOrders,
      });
    });
    res.json(value);
  },
);
router.post("/account/deletion-request", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  await db.transaction(async (tx) => {
    await tx
      .insert(accountDeletionRequestsTable)
      .values({ profileId: profile.id })
      .onConflictDoNothing();
    await audit(tx, profile.id, "account.deletion_requested", profile.id);
  });
  res.status(202).json({
    status: "requested",
    message:
      "Account deletion was requested. Operations must resolve active orders, settle or refund funds, and apply the retention policy before removing the authentication account.",
  });
});
router.get("/admin/deletion-requests", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select()
      .from(accountDeletionRequestsTable)
      .orderBy(desc(accountDeletionRequestsTable.createdAt))
      .limit(200),
  );
});
router.get("/notification-devices/config", requireAuth, async (req, res) => {
  if (!(await getActiveProfile(req, res))) return;
  res.json(pushConfiguration());
});
router.post("/notification-devices", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const input = z
    .object({
      platform: z.enum(["android", "ios"]),
      token: z
        .string()
        .trim()
        .min(16)
        .max(4096)
        .regex(/^[A-Za-z0-9_:\-]+$/),
    })
    .strict()
    .parse(req.body);
  if (input.platform === "ios" && !/^[a-f0-9]{64}$/i.test(input.token))
    throw new CommerceError(400, "Invalid APNs device token");
  await db
    .insert(notificationDevicesTable)
    .values({ ...input, profileId: profile.id })
    .onConflictDoUpdate({
      target: notificationDevicesTable.token,
      set: { profileId: profile.id, platform: input.platform },
    });
  res.status(201).json({ registered: true });
});
router.delete("/notification-devices", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const { token } = z
    .object({ token: z.string().min(16).max(4096) })
    .strict()
    .parse(req.body);
  await db
    .delete(notificationDevicesTable)
    .where(
      and(
        eq(notificationDevicesTable.profileId, profile.id),
        eq(notificationDevicesTable.token, token),
      ),
    );
  res.status(204).end();
});
router.get("/admin/drivers", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select({
        id: profilesTable.id,
        displayName: profilesTable.displayName,
        driverApproved: profilesTable.driverApproved,
        isActive: profilesTable.isActive,
      })
      .from(profilesTable)
      .where(eq(profilesTable.role, "driver"))
      .limit(500),
  );
});
router.get(
  "/orders/:orderId/financial-operations",
  requireAuth,
  async (req, res) => {
    const owned = await ownedOrder(req, res);
    if (!owned) return;
    const rows = await db
      .select({
        id: financialOperationsTable.id,
        kind: financialOperationsTable.kind,
        state: financialOperationsTable.state,
        attempts: financialOperationsTable.attempts,
        errorCode: financialOperationsTable.errorCode,
        result: financialOperationsTable.result,
        createdAt: financialOperationsTable.createdAt,
      })
      .from(financialOperationsTable)
      .where(eq(financialOperationsTable.orderId, owned.order.id))
      .orderBy(desc(financialOperationsTable.createdAt))
      .limit(30);
    res.json(
      rows.map((row) => ({
        ...row,
        result:
          row.kind === "checkout" && owned.order.status !== "placed"
            ? { ...row.result, url: null }
            : row.result,
      })),
    );
  },
);
router.post(
  "/admin/financial-operations/:operationId/reconcile",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["admin"], res)) return;
    const id = z.string().min(1).max(200).parse(req.params.operationId);
    res.json(
      await (
        await import("../lib/financial-operations")
      ).reconcileFinancialOperation(id, profile),
    );
  },
);
router.get("/admin/financial-operations", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select({
        id: financialOperationsTable.id,
        orderId: financialOperationsTable.orderId,
        kind: financialOperationsTable.kind,
        state: financialOperationsTable.state,
        attempts: financialOperationsTable.attempts,
        errorCode: financialOperationsTable.errorCode,
        firstAttemptAt: financialOperationsTable.firstAttemptAt,
        createdAt: financialOperationsTable.createdAt,
      })
      .from(financialOperationsTable)
      .orderBy(desc(financialOperationsTable.createdAt))
      .limit(200),
  );
});
router.get("/notifications", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  res.json(
    await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.profileId, profile.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(100),
  );
});
router.post(
  "/notifications/:notificationId/read",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile) return;
    const [row] = await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.id, uuid.parse(req.params.notificationId)),
          eq(notificationsTable.profileId, profile.id),
        ),
      )
      .returning();
    if (!row) throw new CommerceError(404, "Notification not found");
    res.json(row);
  },
);
router.get("/payouts/me", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant", "driver"], res)) return;
  res.json(
    await db
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.recipientProfileId, profile.id))
      .orderBy(desc(payoutsTable.createdAt))
      .limit(100),
  );
});
router.get("/payout-account", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant", "driver"], res)) return;
  const [account] = await db
    .select()
    .from(connectedAccountsTable)
    .where(eq(connectedAccountsTable.profileId, profile.id))
    .limit(1);
  if (
    account &&
    account.provider === "stripe_test" &&
    paymentMode() === "stripe_test"
  ) {
    const remote = await stripeTest().accounts.retrieve(
      account.providerAccountId,
    );
    if (!remote.deleted) {
      account.ready = Boolean(
        remote.payouts_enabled && remote.capabilities?.transfers === "active",
      );
      await db
        .update(connectedAccountsTable)
        .set({ ready: account.ready })
        .where(eq(connectedAccountsTable.profileId, profile.id));
    }
  }
  const [provisioning] = await db
    .select({ state: payoutProvisioningTable.state })
    .from(payoutProvisioningTable)
    .where(eq(payoutProvisioningTable.profileId, profile.id))
    .limit(1);
  res.json({
    testMode: true,
    account: account ?? null,
    provisioningState: provisioning?.state ?? null,
  });
});
router.post("/payout-account/onboard", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant", "driver"], res)) return;
  const mode = requirePaymentProvider();
  if (mode === "stripe_test") {
    const result = await (
      await import("../lib/payout-onboarding")
    ).requestPayoutOnboarding(profile);
    res.status(result.account ? 200 : 202).json(result);
    return;
  }
  // This path is unreachable outside NODE_ENV=test (enforced by paymentMode).
  await db
    .insert(connectedAccountsTable)
    .values({
      profileId: profile.id,
      provider: "sandbox",
      providerAccountId: `sandbox_account_${profile.id}`,
      ready: true,
    })
    .onConflictDoNothing();
  const [account] = await db
    .select()
    .from(connectedAccountsTable)
    .where(eq(connectedAccountsTable.profileId, profile.id))
    .limit(1);
  res.json({ account, url: null, testMode: true });
});
router.get("/admin/payouts", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select()
      .from(payoutsTable)
      .orderBy(desc(payoutsTable.createdAt))
      .limit(200),
  );
});
router.post(
  "/admin/payouts/:payoutId/transfer",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["admin"], res)) return;
    res
      .status(paymentMode() === "stripe_test" ? 202 : 200)
      .json(await settlePayout(uuid.parse(req.params.payoutId), profile));
  },
);
router.get("/admin/refunds", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select()
      .from(refundsTable)
      .orderBy(desc(refundsTable.createdAt))
      .limit(200),
  );
});
router.get("/admin/audit", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  res.json(
    await db
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(200),
  );
});
router.put("/admin/pricing", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  const value = pricingSchema.parse(req.body);
  await db.transaction(async (tx) => {
    await tx
      .insert(platformSettingsTable)
      .values({
        settingKey: "test_pricing",
        value,
        updatedByProfileId: profile.id,
      })
      .onConflictDoUpdate({
        target: platformSettingsTable.settingKey,
        set: { value, updatedByProfileId: profile.id },
      });
    await audit(tx, profile.id, "pricing.updated", "test_pricing", value);
  });
  res.json(value);
});
router.patch(
  "/admin/drivers/:profileId/approval",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["admin"], res)) return;
    const { approved } = z
      .object({ approved: z.boolean() })
      .strict()
      .parse(req.body);
    const id = uuid.parse(req.params.profileId);
    const result = await db.transaction(async (tx) => {
      const [driver] = await tx
        .update(profilesTable)
        .set({ driverApproved: approved })
        .where(and(eq(profilesTable.id, id), eq(profilesTable.role, "driver")))
        .returning();
      if (!driver) throw new CommerceError(404, "Driver not found");
      await audit(tx, profile.id, "driver.approval", id, { approved });
      return driver;
    });
    res.json(result);
  },
);
export default router;
