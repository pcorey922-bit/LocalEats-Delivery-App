import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  ledgerTransactionsTable as transactions,
  ledgerLinesTable as lines,
  payoutsTable,
  partialRefundsTable,
} from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";
type Account =
  | "platform_cash"
  | "customer_funds"
  | "restaurant_payable"
  | "driver_payable"
  | "tax_payable"
  | "platform_revenue"
  | "restaurant_recovery"
  | "driver_recovery"
  | "provider_fee";
type Line = {
  account: Account;
  partyProfileId?: string | null;
  amountCents: number;
};
export async function postJournal(
  tx: Transaction,
  event: { id: string; orderId: string; kind: string; lines: Line[] },
) {
  const normalized = event.lines
    .filter((line) => line.amountCents !== 0)
    .map((line) => ({ ...line, partyProfileId: line.partyProfileId ?? null }))
    .sort((a, b) =>
      `${a.account}:${a.partyProfileId}:${a.amountCents}`.localeCompare(
        `${b.account}:${b.partyProfileId}:${b.amountCents}`,
      ),
    );
  if (
    normalized.length < 2 ||
    normalized.some(
      (line) =>
        !Number.isSafeInteger(line.amountCents) ||
        Math.abs(line.amountCents) > 2147483647,
    ) ||
    normalized.reduce((sum, line) => sum + BigInt(line.amountCents), 0n) !== 0n
  )
    throw new CommerceError(
      409,
      "Ledger journal must balance in integer cents",
    );
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        orderId: event.orderId,
        kind: event.kind,
        currency: "USD",
        lines: normalized,
      }),
    )
    .digest("hex");
  const [inserted] = await tx
    .insert(transactions)
    .values({
      id: event.id,
      orderId: event.orderId,
      kind: event.kind,
      currency: "USD",
      fingerprint,
    })
    .onConflictDoNothing()
    .returning();
  if (!inserted) {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.id, event.id))
      .limit(1);
    if (existing.fingerprint !== fingerprint)
      throw new CommerceError(
        409,
        "Ledger event conflicts with an existing immutable journal",
      );
    return;
  }
  await tx
    .insert(lines)
    .values(normalized.map((line) => ({ ...line, transactionId: event.id })));
}
export async function requirePaymentJournal(tx: Transaction, orderId: string) {
  const [payment] = await tx
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, `payment:${orderId}`))
    .limit(1);
  if (!payment)
    throw new CommerceError(
      409,
      "Historical payment requires a verified ledger baseline before financial execution",
    );
}
export async function journalPayment(
  tx: Transaction,
  orderId: string,
  total: number,
) {
  await postJournal(tx, {
    id: `payment:${orderId}`,
    orderId,
    kind: "payment",
    lines: [
      { account: "platform_cash", amountCents: total },
      { account: "customer_funds", amountCents: -total },
    ],
  });
}
export async function journalAllocation(
  tx: Transaction,
  order: { id: string; totalCents: number; taxCents: number },
  restaurant: { id: string; amount: number },
  driver: { id: string; amount: number },
) {
  await requirePaymentJournal(tx, order.id);
  await postJournal(tx, {
    id: `allocation:${order.id}`,
    orderId: order.id,
    kind: "allocation",
    lines: [
      { account: "customer_funds", amountCents: order.totalCents },
      {
        account: "restaurant_payable",
        partyProfileId: restaurant.id,
        amountCents: -restaurant.amount,
      },
      {
        account: "driver_payable",
        partyProfileId: driver.id,
        amountCents: -driver.amount,
      },
      { account: "tax_payable", amountCents: -order.taxCents },
      {
        account: "platform_revenue",
        amountCents: -(
          order.totalCents -
          restaurant.amount -
          driver.amount -
          order.taxCents
        ),
      },
    ],
  });
}
export async function journalTransfer(
  tx: Transaction,
  payout: typeof payoutsTable.$inferSelect,
) {
  if (!payout.orderId)
    throw new CommerceError(
      409,
      "Order settlement is required for ledger posting",
    );
  await requirePaymentJournal(tx, payout.orderId);
  await postJournal(tx, {
    id: `transfer:${payout.id}`,
    orderId: payout.orderId,
    kind: "transfer",
    lines: [
      {
        account:
          payout.kind === "driver" ? "driver_payable" : "restaurant_payable",
        partyProfileId: payout.recipientProfileId,
        amountCents: payout.amountCents,
      },
      { account: "platform_cash", amountCents: -payout.amountCents },
    ],
  });
}
export async function journalRefund(
  tx: Transaction,
  orderId: string,
  total: number,
) {
  await requirePaymentJournal(tx, orderId);
  const credits = await tx
    .select()
    .from(partialRefundsTable)
    .where(eq(partialRefundsTable.orderId, orderId));
  const priorCredits = credits
    .filter((r) => r.status === "succeeded")
    .reduce((n, r) => n + r.amountCents, 0);
  const cashTotal = total - priorCredits;
  const [existing] = await tx
    .select()
    .from(transactions)
    .where(eq(transactions.id, `refund:${orderId}`))
    .limit(1);
  if (existing) {
    const entries = await tx
      .select()
      .from(lines)
      .where(eq(lines.transactionId, existing.id));
    if (
      existing.orderId !== orderId ||
      existing.kind !== "refund" ||
      entries
        .filter((line) => line.account === "platform_cash")
        .reduce((sum, line) => sum + line.amountCents, 0) !== -cashTotal
    )
      throw new CommerceError(
        409,
        "Refund conflicts with its immutable journal",
      );
    return;
  }
  const [allocation] = await tx
    .select()
    .from(transactions)
    .where(eq(transactions.id, `allocation:${orderId}`))
    .limit(1);
  let entries: Line[];
  if (!allocation)
    entries = [{ account: "customer_funds", amountCents: total }];
  else {
    const allocationLines = await tx
      .select()
      .from(lines)
      .where(eq(lines.transactionId, allocation.id));
    const payouts = await tx
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.orderId, orderId));
    entries = allocationLines
      .filter((line) => line.account !== "customer_funds")
      .map((line) => {
        const payout = payouts.find(
          (p) => p.recipientProfileId === line.partyProfileId,
        );
        const recovery = Boolean(
          payout?.providerTransferId && !payout.providerReversalId,
        );
        const account =
          line.account === "restaurant_payable" && recovery
            ? "restaurant_recovery"
            : line.account === "driver_payable" && recovery
              ? "driver_recovery"
              : (line.account as Account);
        return {
          account,
          partyProfileId: line.partyProfileId,
          amountCents: -line.amountCents,
        };
      });
  }
  await postJournal(tx, {
    id: `refund:${orderId}`,
    orderId,
    kind: "refund",
    lines: [
      ...entries,
      { account: "platform_revenue", amountCents: -priorCredits },
      { account: "platform_cash", amountCents: -cashTotal },
    ],
  });
}
export async function journalReversal(
  tx: Transaction,
  payout: typeof payoutsTable.$inferSelect,
) {
  if (!payout.orderId)
    throw new CommerceError(409, "Order settlement is required for reversal");
  await requirePaymentJournal(tx, payout.orderId);
  const [transfer] = await tx
    .select()
    .from(transactions)
    .where(eq(transactions.id, `transfer:${payout.id}`))
    .limit(1);
  if (!transfer)
    throw new CommerceError(
      409,
      "Transfer requires a verified ledger journal before reversal",
    );
  const [refund] = await tx
    .select()
    .from(transactions)
    .where(eq(transactions.id, `refund:${payout.orderId}`))
    .limit(1);
  const account = refund
    ? payout.kind === "driver"
      ? "driver_recovery"
      : "restaurant_recovery"
    : payout.kind === "driver"
      ? "driver_payable"
      : "restaurant_payable";
  await postJournal(tx, {
    id: `reversal:${payout.id}`,
    orderId: payout.orderId,
    kind: "reversal",
    lines: [
      { account: "platform_cash", amountCents: payout.amountCents },
      {
        account,
        partyProfileId: payout.recipientProfileId,
        amountCents: -payout.amountCents,
      },
    ],
  });
}
