import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, platformSettingsTable, profilesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { isConfiguredOwner } from "../lib/owner-access";
import { CommerceError } from "../lib/commerce-policy";
import { audit } from "../lib/commerce";
import {
  firebaseOAuthDiagnosticReady,
  validateFcmPermission,
} from "../lib/fcm";

const router = Router(),
  path = "/admin/fcm-permission-validation";
const settingKey = "fcm_permission_validation_v1";
function safeguardsClosed() {
  const e = process.env;
  return (
    e.ROCOEATS_PRIVATE_STAGING === "true" &&
    e.ROCOEATS_ORDERING_ENABLED === "false" &&
    e.ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED === "false" &&
    e.ROCOEATS_PUSH_DELIVERY_ENABLED !== "true" &&
    e.ROCOEATS_TEST_PAYOUTS_ENABLED !== "true" &&
    e.ROCOEATS_WEBHOOK_RETENTION_ENABLED !== "true" &&
    (e.ROCOEATS_DELIVERY_AREA_MODE ?? "provisional_postal") ===
      "provisional_postal" &&
    e.PAYMENT_PROVIDER === "stripe_test" &&
    /^sk_test_[A-Za-z0-9]+$/.test(e.STRIPE_SECRET_KEY ?? "")
  );
}
const reportSchema = z.object({
  authenticated: z.boolean(),
  permissionValidated: z.boolean(),
  code: z.enum([
    "CREDENTIAL_UNAVAILABLE",
    "FCM_PERMISSION_VALIDATED",
    "FCM_PERMISSION_UNVERIFIED",
  ]),
});
router.use(path, requireAuth, async (req, res, next) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  if (!isConfiguredOwner(actor.clerkUserId))
    throw new CommerceError(
      403,
      "Only a configured platform owner can validate FCM permission",
    );
  res.locals.fcmOwner = actor;
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get(path, async (_req, res) => {
  const [saved] = await db
    .select({ value: platformSettingsTable.value })
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.settingKey, settingKey))
    .limit(1);
  const value = saved?.value as Record<string, unknown> | undefined;
  const report = reportSchema.safeParse(value?.report);
  res.json({
    ready:
      !saved &&
      safeguardsClosed() &&
      firebaseOAuthDiagnosticReady(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    allowanceUsed: Boolean(saved),
    run: saved
      ? {
          state: value?.state === "completed" ? "completed" : "unconfirmed",
          report: report.success ? report.data : null,
        }
      : null,
  });
});
router.post(path, async (req, res) => {
  z.object({ confirmValidationOnly: z.literal(true) })
    .strict()
    .parse(req.body);
  if (Object.keys(req.query).length)
    throw new CommerceError(400, "Custom validation inputs are not supported");
  if (
    !safeguardsClosed() ||
    !firebaseOAuthDiagnosticReady(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  )
    throw new CommerceError(
      409,
      "Dedicated credentials and closed staging safeguards are required",
    );
  const actor = res.locals.fcmOwner;
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, actor.id))
      .for("update");
    if (
      !current?.isActive ||
      current.role !== "admin" ||
      !isConfiguredOwner(current.clerkUserId)
    )
      throw new CommerceError(403, "Owner access is no longer active");
    if (!safeguardsClosed())
      throw new CommerceError(409, "Staging safeguards must remain closed");
    const [claimed] = await tx
      .insert(platformSettingsTable)
      .values({
        settingKey,
        value: { state: "started", report: null },
        description:
          "One-shot FCM validation-only permission probe; no automatic reset",
        updatedByProfileId: actor.id,
      })
      .onConflictDoNothing({ target: platformSettingsTable.settingKey })
      .returning({ id: platformSettingsTable.id });
    if (!claimed)
      throw new CommerceError(
        409,
        "Validation allowance already used; refresh status without retrying",
      );
    await audit(tx, actor.id, "fcm.permission_validation_started", settingKey, {
      validationOnly: true,
    });
  });
  const report = await validateFcmPermission(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  );
  await db.transaction(async (tx) => {
    await tx
      .update(platformSettingsTable)
      .set({ value: { state: "completed", report } })
      .where(eq(platformSettingsTable.settingKey, settingKey));
    await audit(
      tx,
      actor.id,
      "fcm.permission_validation_completed",
      settingKey,
      { ...report, validationOnly: true, notificationSent: false },
    );
  });
  res.json({
    ...report,
    validationOnly: true,
    notificationSent: false,
    deviceDeliveryVerified: false,
  });
});
export default router;
