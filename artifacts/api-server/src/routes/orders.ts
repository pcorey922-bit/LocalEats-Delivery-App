import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMyOrderBody,
  CreateMyOrderResponse,
  GetMyOrderParams,
  GetMyOrderResponse,
  ListMyOrdersResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import {
  addressesTable,
  db,
  menuItemsTable,
  orderEventsTable,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  profilesTable,
  restaurantsTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import {
  canTransitionOrderStatus,
  type OrderStatus,
} from "../lib/order-lifecycle";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

async function readOrders(orderIds: string[]) {
  if (orderIds.length === 0) return [];

  const [rows, items, events, payments] = await Promise.all([
    db
      .select({
        order: ordersTable,
        restaurantName: restaurantsTable.name,
        customerName: profilesTable.displayName,
      })
      .from(ordersTable)
      .innerJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
      .innerJoin(profilesTable, eq(ordersTable.customerProfileId, profilesTable.id))
      .where(inArray(ordersTable.id, orderIds))
      .orderBy(desc(ordersTable.placedAt)),
    db
      .select()
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, orderIds))
      .orderBy(asc(orderItemsTable.createdAt)),
    db
      .select()
      .from(orderEventsTable)
      .where(inArray(orderEventsTable.orderId, orderIds))
      .orderBy(asc(orderEventsTable.createdAt)),
    db
      .select()
      .from(paymentsTable)
      .where(inArray(paymentsTable.orderId, orderIds)),
  ]);

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  const eventsByOrder = new Map<string, typeof events>();
  for (const event of events) {
    const list = eventsByOrder.get(event.orderId) ?? [];
    list.push(event);
    eventsByOrder.set(event.orderId, list);
  }
  const paymentsByOrder = new Map(payments.map((payment) => [payment.orderId, payment]));

  return rows.map(({ order, restaurantName, customerName }) => {
    if (!order.addressSnapshot) {
      throw new Error(`Order ${order.id} has no delivery-address snapshot`);
    }
    const payment = paymentsByOrder.get(order.id);
    return {
      id: order.id,
      restaurantId: order.restaurantId,
      restaurantName,
      customerProfileId: order.customerProfileId,
      customerName,
      status: order.status,
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      serviceFeeCents: order.serviceFeeCents,
      taxCents: order.taxCents,
      tipCents: order.tipCents,
      totalCents: order.totalCents,
      paymentStatus: payment?.status ?? "none",
      paymentCollected: payment?.status === "succeeded",
      deliveryAddress: order.addressSnapshot,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        itemName: item.itemNameSnapshot,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      })),
      events: (eventsByOrder.get(order.id) ?? []).map((event) => ({
        id: event.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        createdAt: event.createdAt,
      })),
      placedAt: order.placedAt,
    };
  });
}

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["customer"], res)) return;

  const parsed = CreateMyOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Review the restaurant, address, and order items" });
    return;
  }

  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(
      and(
        eq(restaurantsTable.id, parsed.data.restaurantId),
        eq(restaurantsTable.status, "approved"),
      ),
    )
    .limit(1);
  if (!restaurant) {
    res.status(409).json({ error: "This restaurant is not currently accepting orders" });
    return;
  }

  const [address] = await db
    .select()
    .from(addressesTable)
    .where(
      and(
        eq(addressesTable.id, parsed.data.addressId),
        eq(addressesTable.profileId, profile.id),
      ),
    )
    .limit(1);
  if (!address) {
    res.status(404).json({ error: "Saved delivery address not found" });
    return;
  }

  const itemIds = [...new Set(parsed.data.items.map((item) => item.menuItemId))];
  const availableItems = await db
    .select()
    .from(menuItemsTable)
    .where(
      and(
        eq(menuItemsTable.restaurantId, restaurant.id),
        eq(menuItemsTable.isAvailable, true),
        inArray(menuItemsTable.id, itemIds),
      ),
    );
  if (availableItems.length !== itemIds.length) {
    res.status(409).json({ error: "One or more menu items are unavailable" });
    return;
  }

  const itemsById = new Map(availableItems.map((item) => [item.id, item]));
  const subtotalCents = parsed.data.items.reduce((sum, line) => {
    const menuItem = itemsById.get(line.menuItemId);
    return sum + (menuItem?.priceCents ?? 0) * line.quantity;
  }, 0);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 2_147_483_647) {
    res.status(400).json({ error: "Order total exceeds the supported limit" });
    return;
  }

  const addressSnapshot = {
    label: address.label,
    street1: address.street1,
    street2: address.street2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    deliveryInstructions: address.deliveryInstructions,
  };

  const createdOrderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(ordersTable)
      .values({
        customerProfileId: profile.id,
        restaurantId: restaurant.id,
        deliveryAddressId: address.id,
        addressSnapshot,
        status: "placed",
        subtotalCents,
        deliveryFeeCents: 0,
        serviceFeeCents: 0,
        taxCents: 0,
        tipCents: 0,
        totalCents: subtotalCents,
      })
      .returning({ id: ordersTable.id });

    await tx.insert(orderItemsTable).values(
      parsed.data.items.map((line) => {
        const menuItem = itemsById.get(line.menuItemId)!;
        return {
          orderId: order.id,
          menuItemId: menuItem.id,
          itemNameSnapshot: menuItem.name,
          itemDescriptionSnapshot: menuItem.description,
          unitPriceCents: menuItem.priceCents,
          quantity: line.quantity,
          specialInstructions: line.specialInstructions?.trim() || null,
        };
      }),
    );
    await tx.insert(paymentsTable).values({
      orderId: order.id,
      amountCents: subtotalCents,
      currency: "USD",
      status: "pending",
      provider: "rocoeats-development-no-charge",
    });
    await tx.insert(orderEventsTable).values({
      orderId: order.id,
      actorProfileId: profile.id,
      fromStatus: null,
      toStatus: "placed",
      note: "Development order saved; no payment was collected.",
    });
    return order.id;
  });

  const [orderView] = await readOrders([createdOrderId]);
  res.status(201).json(CreateMyOrderResponse.parse(orderView));
});

router.get("/orders/me", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;

  let matchingOrders: { id: string }[] = [];
  if (profile.role === "customer") {
    matchingOrders = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.customerProfileId, profile.id))
      .orderBy(desc(ordersTable.placedAt))
      .limit(100);
  } else if (profile.role === "restaurant") {
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    if (restaurant) {
      matchingOrders = await db
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.restaurantId, restaurant.id))
        .orderBy(desc(ordersTable.placedAt))
        .limit(100);
    }
  } else if (profile.role === "admin") {
    matchingOrders = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .orderBy(desc(ordersTable.placedAt))
      .limit(100);
  } else {
    res.status(403).json({ error: "This role cannot access orders" });
    return;
  }

  const views = await readOrders(matchingOrders.map((order) => order.id));
  res.json(ListMyOrdersResponse.parse(views));
});

router.get("/orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const params = GetMyOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.orderId))
    .limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  let allowed = false;
  if (profile.role === "admin" || order.customerProfileId === profile.id) {
    allowed = true;
  } else if (profile.role === "restaurant") {
    const [restaurant] = await db
      .select({ id: restaurantsTable.id })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.ownerProfileId, profile.id))
      .limit(1);
    allowed = restaurant?.id === order.restaurantId;
  }

  if (!allowed) {
    res.status(403).json({ error: "You cannot access this order" });
    return;
  }
  const [view] = await readOrders([order.id]);
  res.json(GetMyOrderResponse.parse(view));
});

router.patch(
  "/orders/:orderId",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile) return;
    const params = UpdateOrderStatusParams.safeParse(req.params);
    const parsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Invalid order status update" });
      return;
    }
    const nextStatus = parsed.data.status as OrderStatus;
    if (nextStatus === "cart" || nextStatus === "pending") {
      res.status(400).json({ error: "This order status cannot be set manually" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, params.data.orderId))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    let allowed = profile.role === "admin";
    if (profile.role === "restaurant") {
      const [restaurant] = await db
        .select({ id: restaurantsTable.id })
        .from(restaurantsTable)
        .where(eq(restaurantsTable.ownerProfileId, profile.id))
        .limit(1);
      allowed = restaurant?.id === order.restaurantId;
    }
    const customerMayCancel =
      profile.role === "customer" &&
      order.customerProfileId === profile.id &&
      nextStatus === "cancelled" &&
      (order.status === "placed" ||
        order.status === "restaurant_received" ||
        order.status === "pending");

    if (!allowed && !customerMayCancel) {
      res.status(403).json({ error: "You cannot update this order" });
      return;
    }
    if (
      !canTransitionOrderStatus(order.status as OrderStatus, nextStatus)
    ) {
      res.status(400).json({
        error: `Order cannot move from ${order.status} to ${nextStatus}`,
      });
      return;
    }

    const updated = await db.transaction(async (tx) => {
      const [changed] = await tx
        .update(ordersTable)
        .set({ status: nextStatus })
        .where(
          and(
            eq(ordersTable.id, order.id),
            eq(ordersTable.status, order.status),
          ),
        )
        .returning({ id: ordersTable.id });
      if (!changed) return false;
      await tx.insert(orderEventsTable).values({
        orderId: order.id,
        actorProfileId: profile.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        note: null,
      });
      return true;
    });
    if (!updated) {
      res.status(409).json({ error: "Order changed while you were updating it" });
      return;
    }

    const [view] = await readOrders([order.id]);
    res.json(UpdateOrderStatusResponse.parse(view));
  },
);

export default router;