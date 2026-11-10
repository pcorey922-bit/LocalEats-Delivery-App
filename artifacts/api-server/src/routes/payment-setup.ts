import { Router } from "express";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, webhookInboxTable } from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { readPricing, audit } from "../lib/commerce";
import {
  checkoutOrigin,
  CommerceError,
  orderingEnabled,
  paymentMode,
} from "../lib/commerce-policy";
import { stripeTest } from "../lib/payment-provider";
import {
  inspectStripeSetup,
  stripeApiVersion,
  stripeTestEvents,
} from "../lib/stripe-setup";
const router = Router();
async function summary() {
  let pricingReady = false;
  try {
    await readPricing();
    pricingReady = true;
  } catch (error) {
    if (!(error instanceof CommerceError && error.status === 503)) throw error;
  }
  let expectedWebhookUrl: string | null = null;
  try {
    expectedWebhookUrl = `${checkoutOrigin()}/api/webhooks/stripe`;
  } catch {}
  let testProviderConfigured = false;
  try {
    testProviderConfigured = paymentMode() === "stripe_test";
  } catch {}
  const [last] = await db
    .select({
      id: webhookInboxTable.id,
      type: webhookInboxTable.eventType,
      state: webhookInboxTable.state,
      receivedAt: webhookInboxTable.receivedAt,
      processedAt: webhookInboxTable.processedAt,
    })
    .from(webhookInboxTable)
    .orderBy(desc(webhookInboxTable.receivedAt), desc(webhookInboxTable.id))
    .limit(1);
  return {
    pricingReady,
    testProviderConfigured,
    expectedWebhookUrl,
    apiVersion: stripeApiVersion,
    requiredEvents: stripeTestEvents,
    webhookSecretPresent: /^whsec_[A-Za-z0-9]+$/.test(
      process.env.STRIPE_WEBHOOK_SECRET || "",
    ),
    lastAcceptedSignedEventAt: last?.receivedAt ?? null,
    latestSignedEvent: last ?? null,
    orderingEnabled: orderingEnabled(),
    liveChargesEnabled: false,
  };
}
router.get("/admin/payment-setup", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(await summary());
});
router.post("/admin/payment-setup/verify", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  z.object({})
    .strict()
    .parse(req.body ?? {});
  const current = await summary();
  if (!current.testProviderConfigured || !current.expectedWebhookUrl)
    throw new CommerceError(
      503,
      "Configure Stripe TEST credentials and the trusted HTTPS app origin in Render",
    );
  // No SQL transaction is held across Stripe requests; return no provider payloads.
  const provider = await inspectStripeSetup(
    stripeTest(),
    current.expectedWebhookUrl,
  );
  await db.transaction((tx) =>
    audit(tx, actor.id, "payment.setup_checked", "stripe_test", {
      testModeConfirmed: provider.testModeConfirmed,
      endpointConfigurationVerified: provider.endpointConfigurationVerified,
    }),
  );
  res.setHeader("Cache-Control", "no-store");
  res.json({ ...current, provider });
});
export default router;
