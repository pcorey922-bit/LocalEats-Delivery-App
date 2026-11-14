import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, platformSettingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { isConfiguredOwner } from "../lib/owner-access";
import { CommerceError } from "../lib/commerce-policy";
import { audit } from "../lib/commerce";
import { runPublicAccuracy } from "../lib/geocodio-accuracy";

// One durable allowance for this exact suite, across owners, tabs and restarts.
// No expiry, automatic reset, retry or owner-supplied run ID. Changing this suite
// allowance requires a separately reviewed software change, never a UI reset.
const settingKey = "geocodio_public_api_v1";
const router = Router();
function configuration() {
  const env = process.env;
  const safeguards = {
    privateStaging: env.ROCOEATS_PRIVATE_STAGING === "true",
    publicOrderingOff: env.ROCOEATS_ORDERING_ENABLED === "false",
    privateOrderingOff: env.ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED === "false",
    stripeTestOnly:
      env.PAYMENT_PROVIDER === "stripe_test" &&
      /^sk_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY ?? ""),
    municipalEnforcementOff:
      (env.ROCOEATS_DELIVERY_AREA_MODE ?? "provisional_postal") ===
      "provisional_postal",
  };
  const enabled = env.ROCOEATS_GEOCODIO_PUBLIC_TEST_ENABLED === "true";
  const keyConfigured = /^[a-zA-Z0-9_-]{16,200}$/.test(
    env.GEOCODIO_API_KEY ?? "",
  );
  return {
    enabled,
    keyConfigured,
    safeguards,
    ready: enabled && keyConfigured && Object.values(safeguards).every(Boolean),
  };
}
async function record() {
  const [saved] = await db
    .select({ value: platformSettingsTable.value })
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.settingKey, settingKey))
    .limit(1);
  return saved?.value ?? null;
}
router.use(
  "/admin/geocodio-public-test",
  requireAuth,
  async (req, res, next) => {
    const actor = await getActiveProfile(req, res);
    if (!actor || !requireRole(actor, ["admin"], res)) return;
    if (!isConfiguredOwner(actor.clerkUserId))
      throw new CommerceError(
        403,
        "Only a configured platform owner can verify public geocoding",
      );
    res.locals.geocodioOwner = actor;
    res.setHeader("Cache-Control", "no-store");
    next();
  },
);
router.get("/admin/geocodio-public-test", async (_req, res) => {
  res.json({ ...configuration(), run: await record() });
});
router.post("/admin/geocodio-public-test", async (req, res) => {
  z.object({ freeTierConfirmed: z.literal(true) })
    .strict()
    .parse(req.body);
  if (Object.keys(req.query).length)
    throw new CommerceError(400, "Custom test inputs are not supported");
  if (!configuration().ready)
    throw new CommerceError(
      409,
      "Public geocoding verification is disabled or required safeguards are not satisfied",
    );
  const actor = res.locals.geocodioOwner;
  // Commit the allowance BEFORE external I/O. A crash, disconnect or failed write
  // after provider execution must never permit another potentially billed call.
  const claimed = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(platformSettingsTable)
      .values({
        settingKey,
        value: { state: "started", report: null },
        description:
          "One-shot fixed public Geocodio verification; never reset automatically",
        updatedByProfileId: actor.id,
      })
      .onConflictDoNothing({ target: platformSettingsTable.settingKey })
      .returning({ id: platformSettingsTable.id });
    if (!rows.length) return false;
    await audit(tx, actor.id, "geocodio.public_test_started", settingKey, {
      maximumRequests: 5,
    });
    return true;
  });
  if (!claimed)
    throw new CommerceError(
      409,
      "This public test allowance is already used. Refresh its status; do not retry provider calls.",
    );
  // This imports no customer address inputs; fixed public cases only. Report is
  // allowlisted by the shared runner; no key, raw response or provider error.
  const report = await runPublicAccuracy({
    live: true,
    freeTierConfirmed: true,
  });
  await db.transaction(async (tx) => {
    await tx
      .update(platformSettingsTable)
      .set({ value: { state: "completed", report } })
      .where(eq(platformSettingsTable.settingKey, settingKey));
    await audit(tx, actor.id, "geocodio.public_test_completed", settingKey, {
      requestsMade: report.requestsMade,
      activationReady: false,
    });
  });
  res.json({ ...configuration(), run: { state: "completed", report } });
});
export default router;
