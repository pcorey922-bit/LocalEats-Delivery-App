import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  orderIncidentsTable,
  ordersTable,
  platformSettingsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
import { readTimingPolicy, timingSchema } from "../lib/order-timing";
const router = Router();
router.get("/admin/order-timing", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.json(await readTimingPolicy());
});
router.put("/admin/order-timing", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  const input = z
    .object({
      policy: timingSchema,
      reason: z.string().trim().min(10).max(500),
    })
    .strict()
    .parse(req.body);
  await db.transaction(async (tx) => {
    await tx
      .insert(platformSettingsTable)
      .values({ settingKey: "order_timing_policy", value: input.policy })
      .onConflictDoUpdate({
        target: platformSettingsTable.settingKey,
        set: { value: input.policy },
      });
    await audit(
      tx,
      p.id,
      "order.timing.configured",
      "order_timing_policy",
      input,
    );
  });
  res.json(input.policy);
});
router.get("/admin/order-incidents", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  const status = z
    .enum(["active", "resolved"])
    .default("active")
    .parse(req.query.status);
  res.setHeader("Cache-Control", "no-store");
  res.json(
    await db
      .select({
        incident: orderIncidentsTable,
        orderStatus: ordersTable.status,
      })
      .from(orderIncidentsTable)
      .innerJoin(ordersTable, eq(ordersTable.id, orderIncidentsTable.orderId))
      .where(
        inArray(
          orderIncidentsTable.status,
          status === "active" ? ["open", "acknowledged"] : ["resolved"],
        ),
      )
      .orderBy(desc(orderIncidentsTable.openedAt), desc(orderIncidentsTable.id))
      .limit(100),
  );
});
router.post(
  "/admin/order-incidents/:id/acknowledge",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.id),
      input = z
        .object({
          version: z.number().int().positive(),
          note: z.string().trim().min(10).max(1000),
        })
        .strict()
        .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [observed] = await tx
        .select()
        .from(orderIncidentsTable)
        .where(eq(orderIncidentsTable.id, id));
      if (!observed) throw new CommerceError(404, "Incident not found");
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, observed.orderId))
        .for("update");
      const [current] = await tx
        .select()
        .from(orderIncidentsTable)
        .where(eq(orderIncidentsTable.id, id));
      if (current.status === "resolved" || current.version !== input.version)
        throw new CommerceError(
          409,
          "Incident changed. Refresh before acknowledging",
        );
      const [updated] = await tx
        .update(orderIncidentsTable)
        .set({
          status: "acknowledged",
          note: input.note,
          reviewedBy: p.id,
          version: current.version + 1,
        })
        .where(eq(orderIncidentsTable.id, id))
        .returning();
      await audit(tx, p.id, "order.incident.acknowledged", observed.orderId, {
        incidentId: id,
        ...input,
      });
      return updated;
    });
    res.json(result);
  },
);
export default router;
