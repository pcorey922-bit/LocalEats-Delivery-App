import { driverDutyLocationsTable } from "@workspace/db";
import { audit } from "../lib/commerce";
import { deliveriesTable, driverPresenceTable } from "@workspace/db";
import { CommerceError, paymentMode } from "../lib/commerce-policy";
import { and, count, desc, eq, inArray, sum } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetAdminFinanceResponse,
  GetAdminOverviewResponse,
  ListAdminProfilesResponse,
  ListAdminRestaurantsResponse,
  UpdateAdminProfileBody,
  UpdateAdminProfileParams,
  UpdateAdminProfileResponse,
  UpdateAdminRestaurantStatusBody,
  UpdateAdminRestaurantStatusParams,
  UpdateAdminRestaurantStatusResponse,
} from "@workspace/api-zod";
import {
  db,
  ordersTable,
  payoutsTable,
  paymentsTable,
  profilesTable,
  restaurantsTable,
} from "@workspace/db";
import type { Profile } from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

async function requireAdmin(
  req: Request,
  res: Response,
): Promise<Profile | null> {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return null;
  return profile;
}

async function readCount(query: PromiseLike<Array<{ value: number }>>) {
  const [result] = await query;
  return Number(result?.value ?? 0);
}

router.get("/admin/overview", requireAuth, async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const [
    totalProfiles,
    totalCustomers,
    totalRestaurants,
    pendingRestaurants,
    approvedRestaurants,
    suspendedRestaurants,
    totalOrders,
    activeOrders,
    completedOrders,
    pendingPayments,
  ] = await Promise.all([
    readCount(db.select({ value: count() }).from(profilesTable)),
    readCount(
      db
        .select({ value: count() })
        .from(profilesTable)
        .where(eq(profilesTable.role, "customer")),
    ),
    readCount(db.select({ value: count() }).from(restaurantsTable)),
    readCount(
      db
        .select({ value: count() })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.status, "pending")),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.status, "approved")),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.status, "suspended")),
    ),
    readCount(db.select({ value: count() }).from(ordersTable)),
    readCount(
      db
        .select({ value: count() })
        .from(ordersTable)
        .where(
          inArray(ordersTable.status, [
            "placed",
            "restaurant_received",
            "pending",
            "accepted",
            "preparing",
            "ready_for_pickup",
            "out_for_delivery",
          ]),
        ),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(ordersTable)
        .where(eq(ordersTable.status, "delivered")),
    ),
    readCount(
      db
        .select({ value: count() })
        .from(paymentsTable)
        .where(eq(paymentsTable.status, "pending")),
    ),
  ]);

  res.json(
    GetAdminOverviewResponse.parse({
      totalProfiles,
      totalCustomers,
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      suspendedRestaurants,
      totalOrders,
      activeOrders,
      completedOrders,
      pendingPayments,
    }),
  );
});

router.get(
  "/admin/restaurants",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!(await requireAdmin(req, res))) return;

    const rows = await db
      .select({
        id: restaurantsTable.id,
        ownerProfileId: profilesTable.id,
        ownerName: profilesTable.displayName,
        name: restaurantsTable.name,
        description: restaurantsTable.description,
        phone: restaurantsTable.phone,
        street1: restaurantsTable.street1,
        city: restaurantsTable.city,
        region: restaurantsTable.region,
        postalCode: restaurantsTable.postalCode,
        status: restaurantsTable.status,
        createdAt: restaurantsTable.createdAt,
      })
      .from(restaurantsTable)
      .innerJoin(
        profilesTable,
        eq(restaurantsTable.ownerProfileId, profilesTable.id),
      )
      .orderBy(desc(restaurantsTable.createdAt))
      .limit(500);

    res.json(ListAdminRestaurantsResponse.parse(rows));
  },
);

router.patch(
  "/admin/restaurants/:restaurantId/status",
  requireAuth,
  async (req, res): Promise<void> => {
    const actor = await requireAdmin(req, res);
    if (!actor) return;
    const params = UpdateAdminRestaurantStatusParams.safeParse(req.params);
    const parsed = UpdateAdminRestaurantStatusBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Choose a valid restaurant status" });
      return;
    }

    const restaurant = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, params.data.restaurantId))
        .for("update");
      if (!current) throw new CommerceError(404, "Restaurant not found");
      const [saved] = await tx
        .update(restaurantsTable)
        .set({
          status: parsed.data.status,
          ...(parsed.data.status !== "approved"
            ? { acceptingOrders: false }
            : {}),
        })
        .where(eq(restaurantsTable.id, current.id))
        .returning();
      await audit(tx, actor.id, "restaurant.status.updated", current.id, {
        fromStatus: current.status,
        toStatus: saved.status,
      });
      return saved;
    });

    const [owner] = await db
      .select({ displayName: profilesTable.displayName })
      .from(profilesTable)
      .where(eq(profilesTable.id, restaurant.ownerProfileId))
      .limit(1);
    res.json(
      UpdateAdminRestaurantStatusResponse.parse({
        id: restaurant.id,
        ownerProfileId: restaurant.ownerProfileId,
        ownerName: owner?.displayName ?? "Unknown account",
        name: restaurant.name,
        description: restaurant.description,
        phone: restaurant.phone,
        street1: restaurant.street1,
        city: restaurant.city,
        region: restaurant.region,
        postalCode: restaurant.postalCode,
        status: restaurant.status,
        createdAt: restaurant.createdAt,
      }),
    );
  },
);

router.get("/admin/profiles", requireAuth, async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const rows = await db
    .select({
      id: profilesTable.id,
      role: profilesTable.role,
      displayName: profilesTable.displayName,
      isActive: profilesTable.isActive,
      createdAt: profilesTable.createdAt,
    })
    .from(profilesTable)
    .orderBy(desc(profilesTable.createdAt))
    .limit(1000);

  res.json(ListAdminProfilesResponse.parse(rows));
});

router.patch(
  "/admin/profiles/:profileId",
  requireAuth,
  async (req, res): Promise<void> => {
    const actor = await requireAdmin(req, res);
    if (!actor) return;
    const params = UpdateAdminProfileParams.safeParse(req.params);
    const parsed = UpdateAdminProfileBody.safeParse(req.body);
    if (
      !params.success ||
      !parsed.success ||
      Object.keys(parsed.data ?? {}).length === 0
    ) {
      res.status(400).json({ error: "Enter a valid account update" });
      return;
    }

    const updated = await db.transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, params.data.profileId))
        .for("update");
      if (!target) throw new CommerceError(404, "Profile not found");
      if (target.role === "admin")
        throw new CommerceError(
          403,
          "Administrator access is managed through the trusted server allowlist",
        );
      if (parsed.data.role && parsed.data.role !== target.role) {
        const activeStatuses = [
          "placed",
          "restaurant_received",
          "pending",
          "accepted",
          "preparing",
          "ready_for_pickup",
          "out_for_delivery",
        ] as const;
        const [activeDelivery] = await tx
          .select({ id: deliveriesTable.id })
          .from(deliveriesTable)
          .where(
            and(
              eq(deliveriesTable.driverProfileId, target.id),
              inArray(deliveriesTable.status, ["assigned", "picked_up"]),
            ),
          )
          .limit(1);
        const restaurants = await tx
          .select({ id: restaurantsTable.id })
          .from(restaurantsTable)
          .where(eq(restaurantsTable.ownerProfileId, target.id));
        const [customerOrder] = await tx
          .select({ id: ordersTable.id })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.customerProfileId, target.id),
              inArray(ordersTable.status, activeStatuses),
            ),
          )
          .limit(1);
        const restaurantOrders = restaurants.length
          ? await tx
              .select({ id: ordersTable.id })
              .from(ordersTable)
              .where(
                and(
                  inArray(
                    ordersTable.restaurantId,
                    restaurants.map((r) => r.id),
                  ),
                  inArray(ordersTable.status, activeStatuses),
                ),
              )
              .limit(1)
          : [];
        if (activeDelivery || customerOrder || restaurantOrders.length)
          throw new CommerceError(
            409,
            "Finish or cancel outstanding orders and deliveries before changing this account's role",
          );
      }
      const nextRole = parsed.data.role ?? target.role;
      const nextActive = parsed.data.isActive ?? target.isActive;
      const [saved] = await tx
        .update(profilesTable)
        .set({
          ...parsed.data,
          ...(!nextActive || nextRole !== "driver"
            ? { driverApproved: false }
            : {}),
        })
        .where(eq(profilesTable.id, target.id))
        .returning();
      if (!nextActive || nextRole !== "restaurant")
        await tx
          .update(restaurantsTable)
          .set({ acceptingOrders: false })
          .where(eq(restaurantsTable.ownerProfileId, target.id));
      if (!nextActive || nextRole !== "driver")
        await tx
          .update(driverPresenceTable)
          .set({ available: false })
          .where(eq(driverPresenceTable.profileId, target.id));
      if(!nextActive||nextRole!=="driver")await tx.delete(driverDutyLocationsTable).where(eq(driverDutyLocationsTable.profileId,target.id));
      await audit(tx, actor.id, "profile.updated", target.id, {
        fromRole: target.role,
        toRole: saved.role,
        fromActive: target.isActive,
        toActive: saved.isActive,
      });
      return saved;
    });
    res.json(UpdateAdminProfileResponse.parse(updated));
  },
);

router.get("/admin/finance", requireAuth, async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const [succeeded, pending, refunded, paidOut, pendingPayout, failedPayout] =
    await Promise.all([
      db
        .select({ count: count(), amount: sum(paymentsTable.amountCents) })
        .from(paymentsTable)
        .where(eq(paymentsTable.status, "succeeded")),
      db
        .select({ count: count(), amount: sum(paymentsTable.amountCents) })
        .from(paymentsTable)
        .where(eq(paymentsTable.status, "pending")),
      db
        .select({ count: count(), amount: sum(paymentsTable.amountCents) })
        .from(paymentsTable)
        .where(eq(paymentsTable.status, "refunded")),
      db
        .select({ amount: sum(payoutsTable.amountCents) })
        .from(payoutsTable)
        .where(inArray(payoutsTable.status, ["paid", "reversal_pending"])),
      db
        .select({ amount: sum(payoutsTable.amountCents) })
        .from(payoutsTable)
        .where(inArray(payoutsTable.status, ["pending", "processing"])),
      db
        .select({ count: count() })
        .from(payoutsTable)
        .where(eq(payoutsTable.status, "failed")),
    ]);

  const cents = (value: string | null | undefined) => Number(value ?? 0);
  res.json(
    GetAdminFinanceResponse.parse({
      paymentProviderConnected: paymentMode() !== "disabled",
      succeededPaymentCount: Number(succeeded[0]?.count ?? 0),
      succeededPaymentCents: cents(succeeded[0]?.amount),
      pendingPaymentCount: Number(pending[0]?.count ?? 0),
      pendingPaymentCents: cents(pending[0]?.amount),
      refundedPaymentCount: Number(refunded[0]?.count ?? 0),
      refundedPaymentCents: cents(refunded[0]?.amount),
      paidOutCents: cents(paidOut[0]?.amount),
      pendingPayoutCents: cents(pendingPayout[0]?.amount),
      failedPayoutCount: Number(failedPayout[0]?.count ?? 0),
    }),
  );
});

export default router;
