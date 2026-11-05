import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderEventsTable,
  paymentsTable,
  payoutsTable,
  deliveriesTable,
  restaurantsTable,
  notificationsTable,
  refundsTable,
  connectedAccountsTable,
  platformSettingsTable,
  auditLogsTable,
  type Profile,
} from "@workspace/db";
import {
  allocateEarnings,
  CommerceError,
  paymentMode,
  pricingSchema,
  testPricing,
} from "./commerce-policy";
import {
  refundTestPayment,
  requireFreshOperation,
  requirePaymentProvider,
  reverseTestTransfer,
  stripeTest,
  transferTestEarnings,
} from "./payment-provider";
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function readPricing(tx: Pick<Transaction, "select"> = db) {
  const [setting] = await tx
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.settingKey, "test_pricing"))
    .limit(1);
  return setting ? pricingSchema.parse(setting.value) : testPricing;
}
export async function audit(
  tx: Transaction,
  actorId: string | null,
  action: string,
  resourceId: string,
  details: Record<string, unknown> = {},
) {
  await tx.insert(auditLogsTable).values({
    actorProfileId: actorId,
    action,
    resourceId,
    details: { ...details, testMode: true },
  });
}
export async function notifyOrder(
  tx: Transaction,
  orderId: string,
  key: string,
  title: string,
  body: string,
) {
  const [order] = await tx
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);
  if (!order) return;
  const [restaurant] = await tx
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, order.restaurantId))
    .limit(1);
  const [delivery] = await tx
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.orderId, orderId))
    .limit(1);
  const recipients = new Set(
    [
      order.customerProfileId,
      restaurant?.ownerProfileId,
      delivery?.driverProfileId,
    ].filter((v): v is string => Boolean(v)),
  );
  for (const profileId of recipients)
    await tx
      .insert(notificationsTable)
      .values({
        profileId,
        orderId,
        eventKey: `${orderId}:${key}`,
        title,
        body,
      })
      .onConflictDoNothing();
}
export async function recordPayment(
  tx: Transaction,
  orderId: string,
  providerId: string,
  amount: number,
  currency: string,
) {
  const [order] = await tx
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .for("update")
    .limit(1);
  if (!order) throw new CommerceError(404, "Payment order not found");
  const [payment] = await tx
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderId))
    .limit(1);
  if (
    !payment ||
    payment.amountCents !== amount ||
    order.totalCents !== amount ||
    currency.toLowerCase() !== "usd"
  )
    throw new CommerceError(409, "Payment amount or currency mismatch");
  if (payment.provider !== paymentMode())
    throw new CommerceError(409, "Payment provider mismatch");
  if (payment.status === "refunded") return;
  if (payment.status === "succeeded") {
    if (payment.providerPaymentId !== providerId)
      throw new CommerceError(409, "Different payment already recorded");
    return;
  }
  await tx
    .update(paymentsTable)
    .set({
      status: "succeeded",
      providerPaymentId: providerId,
      processedAt: new Date(),
    })
    .where(eq(paymentsTable.id, payment.id));
  // A late webhook for a cancelled order must never reopen fulfillment. Queue a
  // refund that an administrator can process using the same idempotent endpoint.
  if (order.status === "cancelled") {
    await tx
      .insert(refundsTable)
      .values({
        id: orderId,
        orderId,
        amountCents: amount,
        reason: "Late payment on cancelled order",
      })
      .onConflictDoNothing();
  }
  await audit(tx, null, "payment.succeeded", orderId, { providerId, amount });
  await notifyOrder(
    tx,
    orderId,
    "payment.succeeded",
    "Test payment confirmed",
    order.status === "cancelled"
      ? "A late test payment requires a refund. The order remains cancelled."
      : "Your test payment was confirmed. The restaurant can now accept the order.",
  );
}
export async function createEarnings(tx: Transaction, orderId: string) {
  const [order] = await tx
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);
  const [payment] = await tx
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderId))
    .limit(1);
  const [delivery] = await tx
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.orderId, orderId))
    .limit(1);
  const [restaurant] = await tx
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, order?.restaurantId ?? ""))
    .limit(1);
  if (
    !order ||
    order.status !== "delivered" ||
    payment?.status !== "succeeded" ||
    !delivery?.driverProfileId ||
    !restaurant
  )
    throw new CommerceError(409, "Paid delivery is required for earnings");
  const { restaurantCents, driverCents } = allocateEarnings(order);
  for (const [kind, recipientProfileId, amountCents] of [
    ["restaurant", restaurant.ownerProfileId, restaurantCents],
    ["driver", delivery.driverProfileId, driverCents],
  ] as const) {
    if (amountCents > 0)
      await tx
        .insert(payoutsTable)
        .values({ orderId, kind, recipientProfileId, amountCents })
        .onConflictDoNothing();
  }
}
export async function settlePayout(payoutId: string, actor: Profile) {
  const [initial] = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.id, payoutId))
    .limit(1);
  if (!initial?.orderId) throw new CommerceError(404, "Order payout not found");
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, initial.orderId!))
      .for("update")
      .limit(1);
    const [payout] = await tx
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.id, payoutId))
      .limit(1);
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, order.id))
      .limit(1);
    const [refund] = await tx
      .select()
      .from(refundsTable)
      .where(eq(refundsTable.orderId, order.id))
      .limit(1);
    if (
      !payout ||
      order.status !== "delivered" ||
      payment?.status !== "succeeded" ||
      refund
    )
      throw new CommerceError(
        409,
        "Payout is blocked by the order or refund status",
      );
    if (payout.providerTransferId) return payout;
    const [account] = await tx
      .select()
      .from(connectedAccountsTable)
      .where(eq(connectedAccountsTable.profileId, payout.recipientProfileId))
      .limit(1);
    if (!account?.ready || account.provider !== payment.provider)
      throw new CommerceError(
        409,
        "Recipient must complete test payout onboarding",
      );
    requireFreshOperation(payout.createdAt);
    if (requirePaymentProvider() === "stripe_test") {
      const remote = await stripeTest().accounts.retrieve(
        account.providerAccountId,
      );
      if (
        remote.deleted ||
        !remote.payouts_enabled ||
        remote.capabilities?.transfers !== "active"
      )
        throw new CommerceError(
          409,
          "Stripe test account cannot receive transfers",
        );
    }
    const id = await transferTestEarnings(
      account.providerAccountId,
      payout.amountCents,
      payout.id,
      order.id,
    );
    const [updated] = await tx
      .update(payoutsTable)
      .set({ status: "paid", providerTransferId: id, paidAt: new Date() })
      .where(eq(payoutsTable.id, payoutId))
      .returning();
    await audit(tx, actor.id, "payout.transferred", payout.id, {
      amountCents: payout.amountCents,
    });
    await tx
      .insert(notificationsTable)
      .values({
        profileId: payout.recipientProfileId,
        orderId: order.id,
        eventKey: `payout:${payout.id}`,
        title: "Test earnings transferred",
        body: "Earnings moved to your test connected balance. This is not a bank deposit.",
      })
      .onConflictDoNothing();
    return updated;
  });
}

export async function cancelOrRefundOrder(
  orderId: string,
  actor: Profile,
  reason: string,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .for("update")
      .limit(1);
    if (!order) throw new CommerceError(404, "Order not found");
    const [restaurant] = await tx
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, order.restaurantId))
      .limit(1);
    const customer =
      actor.role === "customer" && order.customerProfileId === actor.id;
    const owner =
      actor.role === "restaurant" && restaurant?.ownerProfileId === actor.id;
    if (actor.role !== "admin" && !customer && !owner)
      throw new CommerceError(403, "You cannot cancel or refund this order");
    if (
      customer &&
      !["placed", "restaurant_received", "pending", "cancelled"].includes(
        order.status,
      )
    )
      throw new CommerceError(
        409,
        "Contact support to cancel an accepted order",
      );
    if (owner && ["out_for_delivery", "delivered"].includes(order.status))
      throw new CommerceError(409, "Contact support after pickup");
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderId))
      .limit(1);
    if (!payment) throw new CommerceError(409, "Order has no payment record");
    if (
      (payment.status === "succeeded" ||
        (payment.status === "pending" && payment.checkoutSessionId)) &&
      payment.provider !== requirePaymentProvider()
    )
      throw new CommerceError(
        409,
        "The configured test provider does not match this order",
      );
    // Close an open hosted session before cancellation to prevent a customer
    // paying after local cancellation. If already paid, reconcile first.
    if (
      payment.status === "pending" &&
      payment.checkoutSessionId &&
      payment.provider === "stripe_test"
    ) {
      const stripe = stripeTest();
      let session = await stripe.checkout.sessions.retrieve(
        payment.checkoutSessionId,
      );
      if (session.status === "open") {
        try {
          session = await stripe.checkout.sessions.expire(session.id);
        } catch {
          session = await stripe.checkout.sessions.retrieve(session.id);
          if (session.status === "open")
            throw new CommerceError(
              409,
              "Retry cancellation after checkout closes",
            );
        }
      }
      if (
        session.payment_status === "paid" &&
        typeof session.payment_intent === "string"
      ) {
        await recordPayment(
          tx,
          order.id,
          session.payment_intent,
          session.amount_total ?? -1,
          session.currency ?? "",
        );
        payment.status = "succeeded";
        payment.providerPaymentId = session.payment_intent;
      } else if (session.status === "complete")
        throw new CommerceError(
          409,
          "Payment is processing; retry cancellation after confirmation",
        );
    }
    if (payment.status === "succeeded") {
      if (!payment.providerPaymentId)
        throw new CommerceError(
          409,
          "Payment requires provider reconciliation",
        );
      await tx
        .insert(refundsTable)
        .values({
          id: orderId,
          orderId,
          amountCents: payment.amountCents,
          reason,
          actorProfileId: actor.id,
        })
        .onConflictDoNothing();
      const [refund] = await tx
        .select()
        .from(refundsTable)
        .where(eq(refundsTable.orderId, orderId))
        .limit(1);
      if (refund.status !== "succeeded") {
        requireFreshOperation(refund.createdAt);
        const payouts = await tx
          .select()
          .from(payoutsTable)
          .where(eq(payoutsTable.orderId, orderId));
        for (const payout of payouts) {
          const reversalId =
            payout.providerTransferId && !payout.providerReversalId
              ? await reverseTestTransfer(payout.providerTransferId, payout.id)
              : payout.providerReversalId;
          await tx
            .update(payoutsTable)
            .set({
              status: payout.providerTransferId ? "reversed" : "cancelled",
              providerReversalId: reversalId,
            })
            .where(eq(payoutsTable.id, payout.id));
        }
        const result = await refundTestPayment(
          payment.providerPaymentId,
          payment.amountCents,
          refund.id,
        );
        await tx
          .update(refundsTable)
          .set({ providerRefundId: result.id, status: result.status })
          .where(eq(refundsTable.id, refund.id));
        if (result.status === "succeeded")
          await tx
            .update(paymentsTable)
            .set({ status: "refunded" })
            .where(eq(paymentsTable.id, payment.id));
      }
    }
    if (payment.status === "succeeded") {
      await notifyOrder(
        tx,
        orderId,
        "refund.requested",
        "Test refund requested",
        "A full test refund request is recorded. See the payment details for provider confirmation.",
      );
      await audit(tx, actor.id, "refund.requested", orderId, { reason });
    }
    if (payment.status === "pending" && !payment.checkoutSessionId)
      await tx
        .update(paymentsTable)
        .set({ status: "failed" })
        .where(eq(paymentsTable.id, payment.id));
    if (order.status !== "cancelled" && order.status !== "delivered") {
      await tx
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(eq(ordersTable.id, orderId));
      await tx
        .update(deliveriesTable)
        .set({ status: "cancelled" })
        .where(eq(deliveriesTable.orderId, orderId));
      await tx.insert(orderEventsTable).values({
        orderId,
        actorProfileId: actor.id,
        fromStatus: order.status,
        toStatus: "cancelled",
        note: reason,
      });
      await audit(tx, actor.id, "order.cancelled", orderId, { reason });
      await notifyOrder(
        tx,
        orderId,
        "cancelled",
        "Order cancelled (test)",
        "Your order was cancelled. Any test payment refund is tracked in the order details.",
      );
    }
    return {
      orderId,
      status: order.status === "delivered" ? "delivered" : "cancelled",
      testMode: true,
    };
  });
}
