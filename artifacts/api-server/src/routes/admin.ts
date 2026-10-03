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

async function readCount(
  query: PromiseLike<Array<{ value: number }>>,
) {
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

router.get("/admin/restaurants", requireAuth, async (req, res): Promise<void> => {
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
    .innerJoin(profilesTable, eq(restaurantsTable.ownerProfileId, profilesTable.id))
    .orderBy(desc(restaurantsTable.createdAt))
    .limit(500);

  res.json(ListAdminRestaurantsResponse.parse(rows));
});

router.patch(
  "/admin/restaurants/:restaurantId/status",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!(await requireAdmin(req, res))) return;
    const params = UpdateAdminRestaurantStatusParams.safeParse(req.params);
    const parsed = UpdateAdminRestaurantStatusBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Choose a valid restaurant status" });
      return;
    }

    const [restaurant] = await db
      .update(restaurantsTable)
      .set({ status: parsed.data.status })
      .where(eq(restaurantsTable.id, params.data.restaurantId))
      .returning();
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }

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

    const [target] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, params.data.profileId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    if (target.role === "admin") {
      res.status(403).json({
        error: "Administrator access is managed through the trusted server allowlist",
      });
      return;
    }

    const [updated] = await db
      .update(profilesTable)
      .set({
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      })
      .where(eq(profilesTable.id, target.id))
      .returning({
        id: profilesTable.id,
        role: profilesTable.role,
        displayName: profilesTable.displayName,
        isActive: profilesTable.isActive,
        createdAt: profilesTable.createdAt,
      });
    res.json(UpdateAdminProfileResponse.parse(updated));
  },
);

router.get("/admin/finance", requireAuth, async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const [
    succeeded,
    pending,
    refunded,
    paidOut,
    pendingPayout,
    failedPayout,
  ] = await Promise.all([
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
      .where(eq(payoutsTable.status, "paid")),
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
      paymentProviderConnected: false,
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