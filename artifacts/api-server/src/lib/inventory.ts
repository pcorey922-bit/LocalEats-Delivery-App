import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { menuItemsTable, orderItemsTable } from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";

export function inventoryQuantities(
  lines: { menuItemId: string; quantity: number }[],
) {
  const quantities = new Map<string, number>();
  for (const line of lines)
    quantities.set(
      line.menuItemId,
      (quantities.get(line.menuItemId) ?? 0) + line.quantity,
    );
  return quantities;
}
export function ensureInventory(
  items: { id: string; stockOnHand: number | null }[],
  lines: { menuItemId: string; quantity: number }[],
) {
  const quantities = inventoryQuantities(lines);
  for (const item of items)
    if (
      item.stockOnHand !== null &&
      (quantities.get(item.id) ?? 0) > item.stockOnHand
    )
      throw new CommerceError(
        409,
        "An item has insufficient stock. Review quantities and refresh the menu",
      );
}
// Caller holds the order lock. Only cancellation before kitchen acceptance returns
// deducted stock; accepted/prepared food is consumed and requires manual adjustment.
export async function restoreUnacceptedInventory(
  tx: Transaction,
  order: { id: string; status: string },
) {
  if (!["placed", "pending", "restaurant_received"].includes(order.status))
    return [];
  const lines = await tx
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));
  const quantities = inventoryQuantities(
    lines
      .filter((l) => l.menuItemId && l.inventoryDeducted > 0)
      .map((l) => ({
        menuItemId: l.menuItemId!,
        quantity: l.inventoryDeducted,
      })),
  );
  if (!quantities.size) return [];
  const items = await tx
    .select()
    .from(menuItemsTable)
    .where(inArray(menuItemsTable.id, [...quantities.keys()]))
    .orderBy(asc(menuItemsTable.id))
    .for("update");
  const restored: { menuItemId: string; quantity: number }[] = [];
  for (const item of items) {
    if (item.stockOnHand === null) continue;
    const quantity = quantities.get(item.id)!;
    await tx
      .update(menuItemsTable)
      .set({
        stockOnHand: item.stockOnHand + quantity,
        stockRevision: sql`${menuItemsTable.stockRevision}+1`,
      })
      .where(eq(menuItemsTable.id, item.id));
    restored.push({ menuItemId: item.id, quantity });
  }
  return restored;
}
