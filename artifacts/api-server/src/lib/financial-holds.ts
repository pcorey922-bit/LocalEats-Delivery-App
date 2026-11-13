import { verifiedBalance, balanceProof, readPaymentEvidence, type BalanceProof, type PaymentProof } from './provider-balance-evidence';
export { balanceProofSchema, type PaymentProof } from './provider-balance-evidence';
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import {
  db,
  ordersTable,
  paymentsTable,
  profilesTable,
  notificationsTable,
  financialHoldsTable,
  providerBalanceEntriesTable,
  type Profile,
} from "@workspace/db";
import { audit, type Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";
import { stripeTest } from "./payment-provider";
import { postJournal, requirePaymentJournal } from "./ledger";
import { databaseNow } from "./database-clock";
export async function requireNoFinancialHold(
  tx: Pick<Transaction, "select">,
  orderId: string,
) {
  const [hold] = await tx
    .select()
    .from(financialHoldsTable)
    .where(
      and(
        eq(financialHoldsTable.orderId, orderId),
        eq(financialHoldsTable.active, true),
      ),
    )
    .limit(1);
  if (hold)
    throw new CommerceError(
      409,
      "This order has a financial hold. Reconcile the dispute before outgoing funds",
    );
}
export async function recordDisputeEvent(tx: Transaction, event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;
  if (dispute.livemode)
    throw new CommerceError(400, "Live disputes are rejected");
  const pi =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;
  if (!pi)
    throw new CommerceError(
      409,
      "Dispute payment identity requires provider reconciliation",
    );
  const [payment] = await tx
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.providerPaymentId, pi));
  if (!payment || payment.provider !== "stripe_test")
    throw new CommerceError(
      409,
      "Dispute does not match a recorded Stripe test payment",
    );
  await tx
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, payment.orderId))
    .for("update");
  if (
    dispute.currency !== "usd" ||
    !Number.isSafeInteger(dispute.amount) ||
    dispute.amount < 1 ||
    dispute.amount > payment.amountCents ||
    !Number.isSafeInteger(event.created)
  )
    throw new CommerceError(
      409,
      "Dispute currency or amount requires reconciliation",
    );
  const id = `dispute:${dispute.id}`,
    [previous] = await tx
      .select()
      .from(financialHoldsTable)
      .where(eq(financialHoldsTable.id, id));
  if (
    previous &&
    (previous.amountCents !== dispute.amount ||
      previous.orderId !== payment.orderId)
  )
    throw new CommerceError(409, "Dispute changed its financial identity");
  if (previous && event.created < previous.lastEventCreated) return;
  if (
    previous &&
    event.created === previous.lastEventCreated &&
    previous.providerStatus === dispute.status
  )
    return;
  const now = await databaseNow(tx);
  const [hold] = await tx
    .insert(financialHoldsTable)
    .values({
      id,
      orderId: payment.orderId,
      providerDisputeId: dispute.id,
      amountCents: dispute.amount,
      currency: "usd",
      providerStatus: dispute.status,
      lastEventCreated: event.created,
    })
    .onConflictDoUpdate({
      target: financialHoldsTable.id,
      set: {
        providerStatus: dispute.status,
        lastEventCreated: event.created,
        active: true,
        version: (previous?.version ?? 0) + 1,
        releasedAt: null,
        reconciledBy: null,
        note: null,
      },
    })
    .returning();
  if (!previous || !previous.active) {
    const admins = await tx
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(
        and(eq(profilesTable.role, "admin"), eq(profilesTable.isActive, true)),
      );
    for (const admin of admins)
      await tx
        .insert(notificationsTable)
        .values({
          profileId: admin.id,
          orderId: payment.orderId,
          eventKey: `financial_hold:${id}:${hold.version}`,
          title: "Payment dispute requires review (test)",
          body: "Outgoing funds for an order are held. Review the dispute and reconcile with the payment provider.",
        })
        .onConflictDoNothing();
  }
  await audit(tx, null, "financial.dispute.recorded", payment.orderId, {
    holdId: id,
    status: dispute.status,
    amountCents: dispute.amount,
    eventCreated: event.created,
  });
}
export async function recordProviderBalance(
  tx: Transaction,
  orderId: string,
  raw: BalanceProof,
  kind: "payment_fee" | "dispute",
) {
  const proof = verifiedBalance(raw),
    { status, ...values } = proof;
  await tx
    .insert(providerBalanceEntriesTable)
    .values({ ...values, orderId })
    .onConflictDoNothing();
  const [saved] = await tx
    .select()
    .from(providerBalanceEntriesTable)
    .where(eq(providerBalanceEntriesTable.id, proof.id));
  if (
    !saved ||
    Object.entries(values).some(
      ([key, value]) => saved[key as keyof typeof saved] !== value,
    ) ||
    saved.orderId !== orderId
  )
    throw new CommerceError(
      409,
      "Provider balance entry conflicts with its immutable record",
    );
  if (kind === "payment_fee" && proof.feeCents !== 0)
    await postJournal(tx, {
      id: `provider_fee:${proof.id}`,
      orderId,
      kind: "provider_fee",
      lines: [
        { account: "provider_fee", amountCents: proof.feeCents },
        { account: "platform_cash", amountCents: -proof.feeCents },
      ],
    });
  if (
    kind === "dispute" &&
    (proof.amountCents !== 0 || proof.feeCents !== 0 || proof.netCents !== 0)
  )
    await postJournal(tx, {
      id: `dispute_balance:${proof.id}`,
      orderId,
      kind: "dispute",
      lines: [
        { account: "platform_cash", amountCents: proof.netCents },
        { account: "provider_fee", amountCents: proof.feeCents },
        { account: "platform_revenue", amountCents: -proof.amountCents },
      ],
    });
}
export type DisputeProof = {
  id: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  status: string;
  livemode: boolean;
  balances: BalanceProof[];
};
async function readDispute(id: string): Promise<DisputeProof> {
  const d = await stripeTest().disputes.retrieve(id);
  return {
    id: d.id,
    paymentId:
      typeof d.payment_intent === "string"
        ? d.payment_intent
        : (d.payment_intent?.id ?? ""),
    amountCents: d.amount,
    currency: d.currency,
    status: d.status,
    livemode: d.livemode,
    balances: d.balance_transactions.map(balanceProof),
  };
}
export async function reconcileDispute(
  id: string,
  actor: Profile,
  note: string,
  read: (id: string) => Promise<DisputeProof> = readDispute,
) {
  if (actor.role !== "admin")
    throw new CommerceError(403, "Administrator access required");
  const [observed] = await db
    .select()
    .from(financialHoldsTable)
    .where(eq(financialHoldsTable.id, id));
  if (!observed) throw new CommerceError(404, "Financial hold not found");
  const proof = await read(observed.providerDisputeId); // Provider I/O is outside the database transaction.
  return db.transaction(async (tx) => {
    await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, observed.orderId))
      .for("update");
    const [current] = await tx
      .select()
      .from(financialHoldsTable)
      .where(eq(financialHoldsTable.id, id));
    if (current.version !== observed.version)
      throw new CommerceError(
        409,
        "Dispute changed during provider reconciliation; refresh and retry",
      );
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, current.orderId));
    if (
      proof.livemode ||
      proof.id !== current.providerDisputeId ||
      proof.paymentId !== payment.providerPaymentId ||
      proof.amountCents !== current.amountCents ||
      proof.currency !== "usd"
    )
      throw new CommerceError(
        409,
        "Provider dispute proof does not match this hold",
      );
    await requirePaymentJournal(tx, current.orderId);
    const balances = proof.balances.map(verifiedBalance);
    if (
      new Set(balances.map((b) => b.id)).size !== balances.length ||
      balances.some((b) => b.sourceId !== proof.id)
    )
      throw new CommerceError(409, "Dispute balance sources do not match");
    for (const b of balances)
      await recordProviderBalance(tx, current.orderId, b, "dispute");
    const withdrawn = balances
        .filter((b) => b.amountCents < 0)
        .reduce((n, b) => n + b.amountCents, 0),
      reinstated = balances
        .filter((b) => b.amountCents > 0)
        .reduce((n, b) => n + b.amountCents, 0);
    const released =
      (proof.status === "won" &&
        withdrawn === -current.amountCents &&
        reinstated === current.amountCents) ||
      (["warning_closed", "prevented"].includes(proof.status) &&
        balances.length === 0);
    const [updated] = await tx
      .update(financialHoldsTable)
      .set({
        providerStatus: proof.status,
        active: !released,
        releasedAt: released ? await databaseNow(tx) : null,
        version: current.version + 1,
        reconciledBy: actor.id,
        note,
      })
      .where(eq(financialHoldsTable.id, id))
      .returning();
    await audit(tx, actor.id, "financial.dispute.reconciled", current.orderId, {
      holdId: id,
      released,
      balanceIds: balances.map((b) => b.id),
      note,
    });
    return updated;
  });
}
async function readPayment(id: string): Promise<PaymentProof> {
  return readPaymentEvidence(id, stripeTest());
}
export async function reconcilePayment(
  orderId: string,
  actor: Profile,
  note: string,
  read: (id: string) => Promise<PaymentProof> = readPayment,
) {
  if (actor.role !== "admin")
    throw new CommerceError(403, "Administrator access required");
  const [observed] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderId));
  if (observed?.provider !== "stripe_test" || !observed.providerPaymentId)
    throw new CommerceError(409, "Recorded Stripe test payment is required");
  const proof = await read(observed.providerPaymentId);
  return db.transaction(async (tx) => {
    await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .for("update");
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, observed.id));
    if (
      !payment ||
      payment.providerPaymentId !== observed.providerPaymentId ||
      !["succeeded", "refunded"].includes(payment.status) ||
      proof.id !== payment.providerPaymentId ||
      proof.livemode ||
      proof.status !== "succeeded" ||
      proof.currency !== "usd" ||
      proof.amountReceived !== payment.amountCents ||
      proof.chargeAmount !== payment.amountCents ||
      !proof.chargePaid ||
      proof.chargePaymentId !== payment.providerPaymentId ||
      proof.balance.sourceId !== proof.chargeId ||
      proof.balance.amountCents !== payment.amountCents ||
      proof.balance.feeCents < 0
    )
      throw new CommerceError(
        409,
        "Provider payment, charge or balance evidence does not match",
      );
    await requirePaymentJournal(tx, orderId);
    await recordProviderBalance(tx, orderId, proof.balance, "payment_fee");
    await audit(tx, actor.id, "financial.payment.reconciled", orderId, {
      balanceId: proof.balance.id,
      feeCents: proof.balance.feeCents,
      netCents: proof.balance.netCents,
      note,
    });
    return {
      orderId,
      balanceId: proof.balance.id,
      feeCents: proof.balance.feeCents,
      netCents: proof.balance.netCents,
    };
  });
}
