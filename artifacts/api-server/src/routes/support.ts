import { requireCustomerAuth } from "../lib/guest-access";
import { Router } from "express";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  supportCasesTable,
  supportMessagesTable,
  ordersTable,
  restaurantsTable,
  deliveriesTable,
  profilesTable,
  notificationsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
const router = Router();
router.get("/support/cases", requireCustomerAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(
    await db
      .select()
      .from(supportCasesTable)
      .where(eq(supportCasesTable.createdBy, p.id))
      .orderBy(desc(supportCasesTable.createdAt))
      .limit(100),
  );
});
router.post("/support/cases", requireCustomerAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p) return;
  const parsed = z
    .object({
      id: z.string().uuid(),
      orderId: z.string().uuid().optional(),
      category: z.enum(["delivery", "payment", "account", "other"]),
      subject: z.string().trim().min(3).max(140),
      message: z.string().trim().min(10).max(3000),
    })
    .strict()
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error:
        "Enter a subject and issue details without payment or identity secrets",
    });
    return;
  }
  const v = parsed.data;
  const hash = createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const result = await db.transaction(async (tx) => {
    if (v.orderId) {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, v.orderId));
      if (!order) throw new CommerceError(404, "Order not found");
      const [restaurant] = await tx
        .select()
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, order.restaurantId));
      const [delivery] = await tx
        .select()
        .from(deliveriesTable)
        .where(eq(deliveriesTable.orderId, order.id));
      if (
        p.role !== "admin" &&
        order.customerProfileId !== p.id &&
        restaurant?.ownerProfileId !== p.id &&
        delivery?.driverProfileId !== p.id
      )
        throw new CommerceError(404, "Order not found");
    }
    const [saved] = await tx
      .insert(supportCasesTable)
      .values({ ...v, createdBy: p.id, requestHash: hash })
      .onConflictDoNothing()
      .returning();
    if (!saved) {
      const [existing] = await tx
        .select()
        .from(supportCasesTable)
        .where(eq(supportCasesTable.id, v.id));
      if (existing?.createdBy !== p.id || existing.requestHash !== hash)
        throw new CommerceError(
          409,
          "Support request ID conflicts with another request",
        );
      return { row: existing, replayed: true };
    }
    await audit(tx, p.id, "support.opened", v.id, {
      category: v.category,
      orderId: v.orderId ?? null,
    });
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
          orderId: v.orderId,
          eventKey: `support:${v.id}:opened`,
          title: "Support request received",
          body: "An authenticated member submitted a support request. Open the support queue to review.",
        })
        .onConflictDoNothing();
    return { row: saved, replayed: false };
  });
  res.status(result.replayed ? 200 : 201).json(result.row);
});
router.get("/admin/support/cases", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(
    await db
      .select()
      .from(supportCasesTable)
      .orderBy(desc(supportCasesTable.updatedAt))
      .limit(200),
  );
});
router.patch("/admin/support/cases/:id", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  const id = z.string().uuid().parse(req.params.id);
  const v = z
    .object({
      version: z.number().int().positive(),
      status: z.enum(["open", "in_review", "resolved"]),
      resolution: z.string().trim().min(10).max(2000),
    })
    .strict()
    .safeParse(req.body);
  if (!v.success) {
    res
      .status(400)
      .json({ error: "Provide the case version, status and decision note" });
    return;
  }
  const row = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(supportCasesTable)
      .where(eq(supportCasesTable.id, id))
      .for("update");
    if (!current) throw new CommerceError(404, "Support case not found");
    if (current.version !== v.data.version)
      throw new CommerceError(409, "Case changed; refresh before updating");
    const [updated] = await tx
      .update(supportCasesTable)
      .set({
        status: v.data.status,
        resolution: v.data.resolution,
        reviewedBy: p.id,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(supportCasesTable.id, id))
      .returning();
    await audit(tx, p.id, "support.updated", id, {
      status: updated.status,
      version: updated.version,
    });
    await tx
      .insert(supportMessagesTable)
      .values({
        id: randomUUID(),
        caseId: id,
        authorProfileId: p.id,
        authorRole: p.role,
        kind: "decision",
        body: v.data.resolution,
        caseVersion: updated.version,
        statusAfter: updated.status,
      });
    await tx
      .insert(notificationsTable)
      .values({
        profileId: current.createdBy,
        orderId: current.orderId,
        eventKey: `support:${id}:${updated.version}`,
        title: "Support request updated",
        body: "Your support request has an update. Open support to review the response.",
      })
      .onConflictDoNothing();
    return updated;
  });
  res.json(row);
});
export default router;
