import app from "./app";
import { drainPushBatch } from "./lib/push";
import { paymentMode } from "./lib/commerce-policy";
paymentMode(); // Refuse live payment keys at startup.
let pushRunning = false;
const pushTimer = setInterval(async () => {
  if (pushRunning) return;
  pushRunning = true;
  try {
    await drainPushBatch();
  } catch {
    logger.warn("Notification worker deferred");
  } finally {
    pushRunning = false;
  }
}, 15000);
pushTimer.unref();
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
