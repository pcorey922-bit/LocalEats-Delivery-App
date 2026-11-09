import { orderingEnabled } from "../lib/commerce-policy";
import { Router } from "express";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, mobileAuthFlowsTable } from "@workspace/db";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../middlewares/require-auth";
import { guestRateLimit } from "../lib/guest-access";
import { databaseNow } from "../lib/database-clock";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
const router = Router(),
  proof = z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  uuid = z.string().uuid();
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
router.get("/mobile/readiness", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const configured =
    process.env.ROCOEATS_PRIVATE_STAGING === "true" &&
    process.env.PAYMENT_PROVIDER === "stripe_test" &&
    !orderingEnabled() &&
    /^pk_test_/.test(process.env.CLERK_PUBLISHABLE_KEY || "");
  res
    .status(configured ? 200 : 503)
    .json({
      nativeProtocolVersion: 1,
      privateTestStaging: configured,
      orderingEnabled: orderingEnabled(),
      liveChargesEnabled: false,
      clerkPublishableKey: configured
        ? process.env.CLERK_PUBLISHABLE_KEY
        : null,
    });
});
router.use("/mobile/auth", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (
    process.env.ROCOEATS_PRIVATE_STAGING !== "true" ||
    process.env.PAYMENT_PROVIDER !== "stripe_test"
  )
    throw new CommerceError(
      503,
      "Native sign-in is enabled only in private TEST staging",
    );
  next();
});
router.post("/mobile/auth/start", async (req, res) => {
  await guestRateLimit(
    `mobile-start:${req.ip || req.socket.remoteAddress}`,
    20,
    3600,
  );
  const { challenge } = z.object({ challenge: proof }).strict().parse(req.body);
  if (
    process.env.PUBLIC_APP_URL !== "https://localeats-delivery-app.onrender.com"
  )
    throw new CommerceError(
      503,
      "Native authentication staging origin is not configured",
    );
  const state = randomBytes(32).toString("base64url");
  const flow = await db.transaction(async (tx) => {
    const now = await databaseNow(tx);
    const [created] = await tx
      .insert(mobileAuthFlowsTable)
      .values({
        challenge,
        stateHash: hash(state),
        expiresAt: new Date(now.getTime() + 5 * 60000),
      })
      .returning();
    return created;
  });
  res.status(201).json({
    id: flow.id,
    expiresAt: flow.expiresAt,
    authorizationUrl: `${process.env.PUBLIC_APP_URL}/mobile/authorize#flow=${flow.id}&state=${state}`,
  });
});
router.post("/mobile/auth/approve", requireAuth, async (req, res) => {
  const { id, state } = z
      .object({ id: uuid, state: proof })
      .strict()
      .parse(req.body),
    userId = getAuthenticatedUserId(req);
  await db.transaction(async (tx) => {
    const [flow] = await tx
      .select()
      .from(mobileAuthFlowsTable)
      .where(eq(mobileAuthFlowsTable.id, id))
      .for("update");
    const now = await databaseNow(tx);
    if (
      !flow ||
      flow.stateHash !== hash(state) ||
      flow.expiresAt <= now ||
      flow.consumedAt
    )
      throw new CommerceError(
        410,
        "Sign-in request is invalid or expired. Restart in the app.",
      );
    if (flow.clerkUserId && flow.clerkUserId !== userId)
      throw new CommerceError(
        409,
        "A different identity already approved this sign-in",
      );
    if (flow.approvedAt) return;
    await tx
      .update(mobileAuthFlowsTable)
      .set({ clerkUserId: userId, approvedAt: now })
      .where(eq(mobileAuthFlowsTable.id, id));
    await audit(tx, null, "mobile.auth.approved", id, { clerkUserId: userId });
  });
  res.json({ approved: true });
});
router.post("/mobile/auth/redeem", async (req, res) => {
  await guestRateLimit(
    `mobile-redeem:${req.ip || req.socket.remoteAddress}`,
    300,
  );
  const { id, verifier } = z
    .object({ id: uuid, verifier: proof })
    .strict()
    .parse(req.body);
  const userId = await db.transaction(async (tx) => {
    const [flow] = await tx
      .select()
      .from(mobileAuthFlowsTable)
      .where(eq(mobileAuthFlowsTable.id, id))
      .for("update");
    const now = await databaseNow(tx);
    if (!flow || flow.expiresAt <= now || flow.consumedAt)
      throw new CommerceError(
        410,
        "Sign-in request expired or was used. Restart in the app.",
      );
    if (
      createHash("sha256").update(verifier).digest("base64url") !==
      flow.challenge
    )
      throw new CommerceError(403, "Invalid sign-in proof");
    if (!flow.clerkUserId) return null;
    // Consume before external API I/O: never duplicate a credential on retries.
    await tx
      .update(mobileAuthFlowsTable)
      .set({ consumedAt: now })
      .where(eq(mobileAuthFlowsTable.id, id));
    await audit(tx, null, "mobile.auth.consumed", id);
    return flow.clerkUserId;
  });
  if (!userId) {
    res.status(202).json({ pending: true });
    return;
  }
  try {
    const client = clerkClient;
    const token = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60,
    });
    res.json({ ticket: token.token });
  } catch {
    throw new CommerceError(
      503,
      "Sign-in could not finish securely. Restart in the app.",
    );
  }
});
export default router;
