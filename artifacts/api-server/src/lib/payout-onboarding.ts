import { databaseNow } from "./database-clock";
import { randomUUID } from "node:crypto";
import { and, asc, eq, lte, or, sql } from "drizzle-orm";
import {
  db,
  payoutProvisioningTable as jobs,
  connectedAccountsTable,
  profilesTable,
  type Profile,
} from "@workspace/db";
import { audit } from "./commerce";
import { CommerceError, checkoutOrigin } from "./commerce-policy";
import { stripeTest } from "./payment-provider";
export async function requestPayoutOnboarding(profile: Profile) {
  if (!["restaurant", "driver"].includes(profile.role))
    throw new CommerceError(403, "Partner account required");
  const [account] = await db
    .select()
    .from(connectedAccountsTable)
    .where(eq(connectedAccountsTable.profileId, profile.id))
    .limit(1);
  if (account) {
    if (account.provider !== "stripe_test")
      throw new CommerceError(409, "Payout account provider mismatch");
    // Creating a short-lived link has no financial effect; keep the call outside
    // transactions, and never return a link for a client-supplied account ID.
    const link = await stripeTest().accountLinks.create({
      account: account.providerAccountId,
      type: "account_onboarding",
      refresh_url: `${checkoutOrigin()}/earnings`,
      return_url: `${checkoutOrigin()}/earnings`,
    });
    return {
      account,
      url: link.url,
      provisioningState: "succeeded",
      testMode: true,
    };
  }
  await db.insert(jobs).values({ profileId: profile.id }).onConflictDoNothing();
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.profileId, profile.id))
    .limit(1);
  return {
    account: null,
    url: null,
    provisioningState: job.state,
    testMode: true,
  };
}
export async function processPayoutProvisioning(
  execute: (profileId: string) => Promise<string> = async (profileId) =>
    (
      await stripeTest().accounts.create(
        {
          type: "express",
          country: "US",
          capabilities: { transfers: { requested: true } },
          metadata: { profileId, operationId: `account:${profileId}` },
        },
        { idempotencyKey: `account:${profileId}` },
      )
    ).id,
) {
  const now = await databaseNow();
  const job = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(jobs)
      .where(
        or(
          and(
            eq(jobs.state, "queued"),
            lte(jobs.nextAttemptAt, sql`clock_timestamp()`),
          ),
          and(
            eq(jobs.state, "processing"),
            lte(jobs.leaseExpiresAt, sql`clock_timestamp()`),
          ),
        ),
      )
      .orderBy(asc(jobs.createdAt))
      .for("update", { skipLocked: true })
      .limit(1);
    if (!row) return null;
    if (
      row.firstAttemptAt &&
      now.getTime() - row.firstAttemptAt.getTime() > 23 * 60 * 60 * 1000
    ) {
      await tx
        .update(jobs)
        .set({
          state: "reconciliation",
          errorCode: "IDEMPOTENCY_WINDOW_EXPIRED",
          leaseToken: null,
          leaseExpiresAt: null,
        })
        .where(eq(jobs.profileId, row.profileId));
      return null;
    }
    const [claimed] = await tx
      .update(jobs)
      .set({
        state: "processing",
        attempts: row.attempts + 1,
        firstAttemptAt: row.firstAttemptAt ?? now,
        leaseToken: randomUUID(),
        leaseExpiresAt: new Date(now.getTime() + 120000),
      })
      .where(eq(jobs.profileId, row.profileId))
      .returning();
    return claimed;
  });
  if (!job) return false;
  try {
    const accountId = await execute(job.profileId);
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(jobs)
        .where(eq(jobs.profileId, job.profileId))
        .for("update")
        .limit(1);
      if (
        current.leaseToken !== job.leaseToken ||
        current.state !== "processing"
      )
        return;
      await tx
        .insert(connectedAccountsTable)
        .values({
          profileId: job.profileId,
          provider: "stripe_test",
          providerAccountId: accountId,
          ready: false,
        })
        .onConflictDoNothing();
      const [saved] = await tx
        .select()
        .from(connectedAccountsTable)
        .where(eq(connectedAccountsTable.profileId, job.profileId))
        .limit(1);
      if (saved.providerAccountId !== accountId)
        throw new CommerceError(
          409,
          "Conflicting account provisioning outcome",
        );
      await tx
        .update(jobs)
        .set({
          state: "succeeded",
          providerAccountId: accountId,
          leaseToken: null,
          leaseExpiresAt: null,
          errorCode: null,
        })
        .where(eq(jobs.profileId, job.profileId));
      await audit(tx, null, "payout_account.provisioned", job.profileId, {
        accountId,
      });
    });
  } catch (error) {
    await db
      .update(jobs)
      .set({
        state:
          error instanceof CommerceError ||
          (error as { statusCode?: number }).statusCode === 500
            ? "reconciliation"
            : "queued",
        errorCode: "PROVISIONING_UNCONFIRMED",
        nextAttemptAt: new Date(
          (await databaseNow()).getTime() +
            Math.min(3600000, 1000 * 2 ** Math.min(job.attempts, 12)),
        ),
        leaseToken: null,
        leaseExpiresAt: null,
      })
      .where(
        and(
          eq(jobs.profileId, job.profileId),
          eq(jobs.leaseToken, job.leaseToken!),
        ),
      );
  }
  return true;
}
