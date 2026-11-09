import { eq } from "drizzle-orm";
import { telephoneConfirmationsTable, type Order } from "@workspace/db";
import { CommerceError } from "./commerce-policy";
import type { Transaction } from "./commerce";
export async function requireTelephoneAcceptance(
  tx: Pick<Transaction, "select">,
  order: Order,
) {
  if (order.confirmationMode !== "telephone") return;
  const [confirmation] = await tx
    .select()
    .from(telephoneConfirmationsTable)
    .where(eq(telephoneConfirmationsTable.orderId, order.id));
  if (
    confirmation?.status !== "accepted" ||
    confirmation.confirmedSubtotalCents !== order.subtotalCents
  )
    throw new CommerceError(
      409,
      "Dispatch must confirm the restaurant and approved food total before payment. No payment has been requested.",
    );
}
