import { pruneDutyLocations } from "./lib/duty-location";
import { processReservationExpiry } from "./lib/reservation-expiry";
import { processOrderTiming } from "./lib/order-timing";
import { randomUUID } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import {
  db,
  pool,
  workerHeartbeatsTable,
  requestLimitsTable,
  driverOfferDeclinesTable,
  mobileAuthFlowsTable,
} from "@workspace/db";
import app from "./app";
import { processWebhookInbox } from "./lib/webhook-worker";
import { processFinancialOperation } from "./lib/financial-operations";
import { processPayoutProvisioning } from "./lib/payout-onboarding";
import { drainPushBatch } from "./lib/push";
import { paymentMode } from "./lib/commerce-policy";
import { startWorkerLoop } from "./lib/worker-loop";
import { logger } from "./lib/logger";
paymentMode();
const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be an integer from 1 to 65535");
const instanceId = randomUUID();
function worker(
  component: string,
  intervalMs: number,
  run: (
    stopping: () => boolean,
    progress: () => Promise<void>,
  ) => Promise<void>,
) {
  return startWorkerLoop({
    intervalMs,
    run,
    onError: () =>
      logger.error(
        { component },
        "Worker failed; saved jobs remain recoverable",
      ),
    onSuccess: async () => {
      const workerId = `${instanceId}:${component}`;
      await db
        .insert(workerHeartbeatsTable)
        .values({ workerId, component })
        .onConflictDoUpdate({
          target: workerHeartbeatsTable.workerId,
          set: { lastSuccessAt: new Date() },
        });
    },
  });
}
const loops = [
  worker("orders", 15000, async (stopping, progress) => {
    for (let i = 0; i < 50 && !stopping(); i++) {
      if (!(await processReservationExpiry())) break;
      await progress();
    }
    for (let i = 0; i < 50 && !stopping(); i++) {
      if (!(await processOrderTiming())) break;
      await progress();
    }
  }),
  worker("webhooks", 2000, async (stopping, progress) => {
    if (paymentMode() !== "stripe_test") return;
    for (let i = 0; i < 20 && !stopping(); i++) {
      if (!(await processWebhookInbox())) break;
      await progress();
    }
  }),
  worker("finance", 2000, async (stopping, progress) => {
    if (paymentMode() !== "stripe_test") return;
    for (let i = 0; i < 3 && !stopping(); i++) {
      const work = await Promise.all(
        Array.from({ length: 4 }, () => processFinancialOperation()),
      );
      if (!work.some(Boolean)) break;
      await progress();
    }
  }),
  worker("onboarding", 2000, async (stopping, progress) => {
    if (paymentMode() !== "stripe_test") return;
    for (let i = 0; i < 5 && !stopping(); i++) {
      if (!(await processPayoutProvisioning())) break;
      await progress();
    }
  }),
  worker("push", 15000, async (stopping, progress) => {
    await drainPushBatch(stopping, progress);
  }),
  worker("maintenance", 60000, async () => {
    await pruneDutyLocations();
    await db.delete(mobileAuthFlowsTable).where(lt(mobileAuthFlowsTable.expiresAt,new Date(Date.now()-86400000)));
    await db.delete(driverOfferDeclinesTable).where(lt(driverOfferDeclinesTable.expiresAt,sql`now()-interval '1 day'`));
    await db
      .delete(requestLimitsTable)
      .where(lt(requestLimitsTable.expiresAt, new Date()));
    await db
      .delete(workerHeartbeatsTable)
      .where(
        lt(
          workerHeartbeatsTable.lastSuccessAt,
          new Date(Date.now() - 86400000),
        ),
      );
  }),
];
const server = app.listen(port, () =>
  logger.info({ port }, "Server listening"),
);
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.env.ROCOEATS_DRAINING = "1";
  logger.info({ signal }, "Draining requests and workers");
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    logger.error(
      "Drain deadline reached; unconfirmed jobs retain recovery leases",
    );
    process.exit(1);
  }, 45000);
  deadline.unref();
  try {
    await Promise.all([
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
      ...loops.map((loop) => loop.stop()),
    ]);
    await pool.end();
    clearTimeout(deadline);
    process.exit(0);
  } catch {
    clearTimeout(deadline);
    logger.error("Shutdown failed; saved job leases remain recoverable");
    process.exit(1);
  }
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
