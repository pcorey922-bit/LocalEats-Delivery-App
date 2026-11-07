import { Router } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, menuItemsTable, restaurantsTable } from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
const router = Router();
router.get("/restaurants/me/inventory", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["restaurant"], res)) return;
  const rows = await db
    .select({
      id: menuItemsTable.id,
      name: menuItemsTable.name,
      stockOnHand: menuItemsTable.stockOnHand,
      revision: menuItemsTable.stockRevision,
    })
    .from(menuItemsTable)
    .innerJoin(
      restaurantsTable,
      eq(restaurantsTable.id, menuItemsTable.restaurantId),
    )
    .where(eq(restaurantsTable.ownerProfileId, profile.id))
    .orderBy(asc(menuItemsTable.name));
  res.setHeader("Cache-Control", "no-store");
  res.json(rows);
});
router.put(
  "/restaurants/me/inventory/:itemId",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["restaurant"], res)) return;
    const itemId = z.string().uuid().parse(req.params.itemId);
    const value = z
      .object({
        stockOnHand: z.number().int().min(0).max(1000000).nullable(),
        expectedRevision: z.number().int().min(0),
        reason: z.string().trim().min(5).max(500),
      })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [restaurant] = await tx
        .select()
        .from(restaurantsTable)
        .where(eq(restaurantsTable.ownerProfileId, profile.id));
      if (!restaurant) throw new CommerceError(404, "Restaurant not found");
      const [item] = await tx
        .select()
        .from(menuItemsTable)
        .where(
          and(
            eq(menuItemsTable.id, itemId),
            eq(menuItemsTable.restaurantId, restaurant.id),
          ),
        )
        .for("update");
      if (!item) throw new CommerceError(404, "Menu item not found");
      if (item.stockRevision !== value.expectedRevision)
        throw new CommerceError(
          409,
          "Inventory changed. Refresh before adjusting stock",
        );
      const [updated] = await tx
        .update(menuItemsTable)
        .set({
          stockOnHand: value.stockOnHand,
          stockRevision: sql`${menuItemsTable.stockRevision}+1`,
        })
        .where(eq(menuItemsTable.id, item.id))
        .returning();
      await audit(tx, profile.id, "inventory.adjusted", item.id, {
        previousStock: item.stockOnHand,
        stockOnHand: value.stockOnHand,
        reason: value.reason,
        revision: updated.stockRevision,
      });
      return {
        id: updated.id,
        name: updated.name,
        stockOnHand: updated.stockOnHand,
        revision: updated.stockRevision,
      };
    });
    res.json(result);
  },
);
export default router;
