import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import {
  db,
  profilesTable,
  requestLimitsTable,
  auditLogsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { isConfiguredOwner } from "../lib/owner-access";
import { CommerceError } from "../lib/commerce-policy";
import { audit } from "../lib/commerce";
import { firebaseOAuthDiagnosticReady, verifyFirebaseOAuth } from "../lib/fcm";

const router = Router();
const path = "/admin/firebase-oauth";
const bucketKey = "firebase-oauth-diagnostic-v1";
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
router.use(path, requireAuth, async (req, res, next) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  if (!isConfiguredOwner(actor.clerkUserId))
    throw new CommerceError(
      403,
      "Only a configured platform owner can verify Firebase authentication",
    );
  res.locals.firebaseOwner = actor;
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get(path, async (_req, res) => {
  const [limit] = await db
    .select({
      retryAfter: requestLimitsTable.expiresAt,
      active: sql<boolean>`${requestLimitsTable.expiresAt}>clock_timestamp()`,
    })
    .from(requestLimitsTable)
    .where(eq(requestLimitsTable.bucketKey, bucketKey));
  const [last] = await db
    .select({
      action: auditLogsTable.action,
      details: auditLogsTable.details,
      at: auditLogsTable.createdAt,
    })
    .from(auditLogsTable)
    .where(
      and(
        eq(auditLogsTable.resourceId, bucketKey),
        inArray(auditLogsTable.action, [
          "firebase.oauth_started",
          "firebase.oauth_completed",
        ]),
      ),
    )
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(1);
  const completed = last?.action === "firebase.oauth_completed";
  const details = z
    .object({
      authenticated: z.boolean(),
      code: z.enum([
        "CREDENTIAL_UNAVAILABLE",
        "GOOGLE_OAUTH_AUTHENTICATED",
        "GOOGLE_OAUTH_UNAVAILABLE",
      ]),
    })
    .safeParse(last?.details);
  res.json({
    ready:
      safeguardsClosed() &&
      firebaseOAuthDiagnosticReady(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) &&
      !limit?.active,
    retryAfter: limit?.retryAfter ?? null,
    lastRun: last
      ? {
          state: completed ? "completed" : "unconfirmed",
          checkedAt: last.at,
          ...(completed && details.success ? details.data : {}),
        }
      : null,
  });
});
router.post(path, async (req, res) => {
  z.object({ confirmOAuthOnly: z.literal(true) })
    .strict()
    .parse(req.body);
  if (Object.keys(req.query).length)
    throw new CommerceError(400, "Custom diagnostic inputs are not supported");
  if (
    !safeguardsClosed() ||
    !firebaseOAuthDiagnosticReady(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  )
    throw new CommerceError(
      409,
      "Dedicated credentials and closed staging safeguards are required",
    );
  const actor = res.locals.firebaseOwner;
  // Commit the allowance before network I/O; concurrent requests/restarts cannot
  // duplicate a provider call. No database transaction is held during OAuth.
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
      .insert(requestLimitsTable)
      .values({
        bucketKey,
        expiresAt: sql`clock_timestamp()+interval '10 minutes'`,
      })
      .onConflictDoUpdate({
        target: requestLimitsTable.bucketKey,
        set: {
          requests: 1,
          expiresAt: sql`clock_timestamp()+interval '10 minutes'`,
        },
        setWhere: lte(requestLimitsTable.expiresAt, sql`clock_timestamp()`),
      })
      .returning({ expiresAt: requestLimitsTable.expiresAt });
    if (!claimed)
      throw new CommerceError(
        429,
        "OAuth verification is limited to one request every ten minutes; wait before manually trying again",
      );
    await audit(tx, actor.id, "firebase.oauth_started", bucketKey);
  });
  const result = await verifyFirebaseOAuth(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  );
  await db.transaction((tx) =>
    audit(tx, actor.id, "firebase.oauth_completed", bucketKey, result),
  );
  res.json({
    ...result,
    checkedAt: new Date().toISOString(),
    fcmPermissionVerified: false,
    notificationSent: false,
  });
});
export default router;
