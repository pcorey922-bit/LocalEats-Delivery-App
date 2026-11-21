import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  financialHoldsTable,
  providerBalanceEntriesTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
import { reconcileDispute, reconcilePayment } from "../lib/financial-holds";
const router = Router(),
  body = z.object({ reason: z.string().trim().min(10).max(1000) }).strict();
router.get("/admin/financial-holds", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(
    await db
      .select()
      .from(financialHoldsTable)
      .orderBy(desc(financialHoldsTable.openedAt))
      .limit(100),
  );
});
router.post(
  "/admin/financial-holds/:id/reconcile",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().max(200).parse(req.params.id),
      { reason } = body.parse(req.body);
    res.json(await reconcileDispute(id, p, reason));
  },
);
router.post(
  "/admin/orders/:id/reconcile-payment",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.id),
      { reason } = body.parse(req.body);
    res.json(await reconcilePayment(id, p, reason));
  },
);
router.get(
  "/admin/orders/:id/provider-balances",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.id);
    res.json(
      await db
        .select()
        .from(providerBalanceEntriesTable)
        .where(eq(providerBalanceEntriesTable.orderId, id)),
    );
  },
);
export default router;
