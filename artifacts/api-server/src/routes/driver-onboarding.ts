import { Router } from "express";
import { z } from "zod";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  db,
  profilesTable,
  driverApplicationsTable,
  deliveriesTable,
  driverPresenceTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
const router = Router();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return (
      !Number.isNaN(d.valueOf()) &&
      d.toISOString().slice(0, 10) === s &&
      s >= new Date().toISOString().slice(0, 10)
    );
  }, "Enter a valid, unexpired license date");
const application = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{10,25}$/),
    vehicleMake: z.string().trim().min(1).max(80),
    vehicleModel: z.string().trim().min(1).max(80),
    vehicleYear: z
      .number()
      .int()
      .min(1980)
      .max(new Date().getUTCFullYear() + 1),
    licenseState: z.string().regex(/^[A-Z]{2}$/),
    licenseExpiresOn: date,
    eligibilityAttested: z.literal(true),
    insuranceAttested: z.literal(true),
  })
  .strict();
router.get("/driver/application", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["driver"], res)) return;
  const [row] = await db
    .select()
    .from(driverApplicationsTable)
    .where(eq(driverApplicationsTable.profileId, p.id));
  res.json(row ?? null);
});
router.put("/driver/application", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["driver"], res)) return;
  const value = application.safeParse(req.body);
  if (!value.success) {
    res
      .status(400)
      .json({
        error:
          "Review your contact, vehicle, license expiry and required attestations",
      });
    return;
  }
  const row = await db.transaction(async (tx) => {
    await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, p.id))
      .for("update");
    const [active] = await tx
      .select()
      .from(deliveriesTable)
      .where(
        and(
          eq(deliveriesTable.driverProfileId, p.id),
          inArray(deliveriesTable.status, ["assigned", "picked_up"]),
        ),
      )
      .limit(1);
    if (active)
      throw new CommerceError(
        409,
        "Finish or release your active delivery before changing your application",
      );
    const [previous] = await tx
      .select()
      .from(driverApplicationsTable)
      .where(eq(driverApplicationsTable.profileId, p.id));
    const next = {
      ...value.data,
      status: "pending",
      version: (previous?.version ?? 0) + 1,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: new Date(),
    };
    const [saved] = await tx
      .insert(driverApplicationsTable)
      .values({ ...next, profileId: p.id })
      .onConflictDoUpdate({
        target: driverApplicationsTable.profileId,
        set: next,
      })
      .returning();
    await tx
      .update(profilesTable)
      .set({ driverApproved: false })
      .where(eq(profilesTable.id, p.id));
    await tx
      .update(driverPresenceTable)
      .set({ available: false })
      .where(eq(driverPresenceTable.profileId, p.id));
    await audit(tx, p.id, "driver.application.submitted", p.id, {
      version: saved.version,
    });
    return saved;
  });
  res.json(row);
});
router.get("/admin/driver-applications", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.json(
    await db
      .select({
        application: driverApplicationsTable,
        displayName: profilesTable.displayName,
      })
      .from(driverApplicationsTable)
      .innerJoin(
        profilesTable,
        eq(profilesTable.id, driverApplicationsTable.profileId),
      )
      .orderBy(desc(driverApplicationsTable.submittedAt))
      .limit(200),
  );
});
router.post(
  "/admin/driver-applications/:profileId/review",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.profileId);
    const parsed = z
      .object({
        version: z.number().int().positive(),
        approved: z.boolean(),
        identityChecked: z.boolean(),
        screeningChecked: z.boolean(),
        insuranceChecked: z.boolean(),
        note: z.string().trim().min(10).max(1000),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error:
            "Provide a review version, evidence note and verification checklist",
        });
      return;
    }
    const v = parsed.data;
    if (
      v.approved &&
      !(v.identityChecked && v.screeningChecked && v.insuranceChecked)
    ) {
      res
        .status(400)
        .json({ error: "Complete all verification checks before approval" });
      return;
    }
    const row = await db.transaction(async (tx) => {
      const [driver] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, id))
        .for("update");
      if (!driver || driver.role !== "driver" || !driver.isActive)
        throw new CommerceError(404, "Active driver not found");
      const [current] = await tx
        .select()
        .from(driverApplicationsTable)
        .where(eq(driverApplicationsTable.profileId, id));
      if (!current) throw new CommerceError(404, "Application not found");
      if (current.version !== v.version || current.status !== "pending")
        throw new CommerceError(
          409,
          "Application changed or was already reviewed; refresh before reviewing",
        );
      if (
        v.approved &&
        current.licenseExpiresOn < new Date().toISOString().slice(0, 10)
      )
        throw new CommerceError(409, "Driver license has expired");
      const [updated] = await tx
        .update(driverApplicationsTable)
        .set({
          status: v.approved ? "approved" : "rejected",
          reviewNote: v.note,
          reviewedBy: p.id,
          reviewedAt: new Date(),
        })
        .where(eq(driverApplicationsTable.profileId, id))
        .returning();
      await tx
        .update(profilesTable)
        .set({ driverApproved: v.approved })
        .where(eq(profilesTable.id, id));
      await audit(tx, p.id, "driver.application.reviewed", id, {
        version: v.version,
        approved: v.approved,
        identityChecked: v.identityChecked,
        screeningChecked: v.screeningChecked,
        insuranceChecked: v.insuranceChecked,
      });
      return updated;
    });
    res.json(row);
  },
);
export default router;
