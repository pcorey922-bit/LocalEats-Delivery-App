import { databaseNow } from "./database-clock";
import { createPrivateKey, sign, randomUUID } from "node:crypto";
import { connect } from "node:http2";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { and, eq, lt, lte, or, inArray, isNull, ne, asc } from "drizzle-orm";
import {
  db,
  notificationsTable,
  notificationDevicesTable,
  pushDeliveriesTable as deliveries,
} from "@workspace/db";
import { logger } from "./logger";
export function pushConfiguration() {
  return {
    android: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    ios: Boolean(
      process.env.APNS_PRIVATE_KEY &&
      process.env.APNS_KEY_ID &&
      process.env.APNS_TEAM_ID,
    ),
    testMode: true,
  };
}
async function sendApns(token: string, notificationId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", kid: process.env.APNS_KEY_ID }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: now }),
  ).toString("base64url");
  const data = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(data), {
    key: createPrivateKey(process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n")),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  // Only APNs sandbox is allowed in this branch. Release APNs remains disabled.
  await new Promise<void>((resolve, reject) => {
    const client = connect("https://api.sandbox.push.apple.com");
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error("APNs timeout"));
    }, 10000);
    const finish = (error?: Error) => {
      clearTimeout(timer);
      client.close();
      error ? reject(error) : resolve();
    };
    client.on("error", () => finish(new Error("APNs connection failed")));
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${data}.${signature}`,
      "apns-topic": "com.rocoeats.app",
      "apns-push-type": "alert",
      "apns-collapse-id": notificationId,
    });
    let status = 0;
    request.on("response", (headers) => {
      status = Number(headers[":status"]);
    });
    request.on("data", () => {});
    request.on("error", () => finish(new Error("APNs request failed")));
    request.on("end", () =>
      finish(status === 200 ? undefined : new Error(`APNs status ${status}`)),
    );
    request.end(
      JSON.stringify({
        aps: {
          alert: {
            title: "RoCoEats test update",
            body: "Open RoCoEats to view your notification.",
          },
          sound: "default",
        },
        notificationId,
      }),
    );
  });
}
async function sendPush(
  platform: string,
  token: string,
  notificationId: string,
) {
  if (platform === "ios") return sendApns(token, notificationId);
  if (!getApps().length)
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)),
    });
  await getMessaging().send({
    token,
    notification: {
      title: "RoCoEats test update",
      body: "Open RoCoEats to view your notification.",
    },
    data: { notificationId },
    android: {
      collapseKey: notificationId,
      notification: { tag: notificationId },
    },
  });
}
// A provider acknowledgement is not proof that a device displayed a message.
// Push is at-least-once; the durable in-app inbox remains the source of truth.
export async function fanOutPushNotifications() {
  const now = await databaseNow();
  return db.transaction(async (tx) => {
    const batch = await tx
      .select()
      .from(notificationsTable)
      .where(
        and(
          inArray(notificationsTable.pushState, ["pending", "processing"]),
          lte(notificationsTable.pushNextAttemptAt, now),
        ),
      )
      .orderBy(asc(notificationsTable.createdAt), asc(notificationsTable.id))
      .for("update", { skipLocked: true })
      .limit(25);
    for (const notification of batch) {
      const devices = await tx
        .select()
        .from(notificationDevicesTable)
        .where(eq(notificationDevicesTable.profileId, notification.profileId));
      if (devices.length)
        await tx
          .insert(deliveries)
          .values(
            devices.map((device) => ({
              notificationId: notification.id,
              deviceId: device.id,
            })),
          )
          .onConflictDoNothing();
      await tx
        .update(notificationsTable)
        .set({ pushState: devices.length ? "queued" : "not_registered" })
        .where(eq(notificationsTable.id, notification.id));
    }
    return batch.length;
  });
}
type PushConfiguration = ReturnType<typeof pushConfiguration>;
type PushSender = (
  platform: string,
  token: string,
  notificationId: string,
) => Promise<void>;
function invalidToken(error: unknown) {
  const code = (error as { code?: string })?.code;
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    (error instanceof Error && error.message === "APNs status 410")
  );
}
async function summarize(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  notificationId: string,
) {
  const rows = await tx
    .select({ state: deliveries.state })
    .from(deliveries)
    .where(eq(deliveries.notificationId, notificationId));
  const pending = rows.some((row) =>
    ["pending", "processing"].includes(row.state),
  );
  const accepted = rows.some((row) => row.state === "provider_accepted");
  const failed = rows.some((row) => row.state !== "provider_accepted");
  await tx
    .update(notificationsTable)
    .set({
      pushState: pending
        ? "queued"
        : accepted
          ? failed
            ? "partial_failure"
            : "provider_accepted"
          : "failed",
    })
    .where(eq(notificationsTable.id, notificationId));
}
export async function processPushDelivery(
  send: PushSender = sendPush,
  config: PushConfiguration = pushConfiguration(),
) {
  const now = await databaseNow();
  const claimed = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        delivery: deliveries,
        device: notificationDevicesTable,
        notification: notificationsTable,
      })
      .from(deliveries)
      .innerJoin(
        notificationsTable,
        eq(notificationsTable.id, deliveries.notificationId),
      )
      .leftJoin(
        notificationDevicesTable,
        eq(notificationDevicesTable.id, deliveries.deviceId),
      )
      .where(
        and(
          inArray(deliveries.state, ["pending", "processing"]),
          lt(deliveries.attempts, 5),
          lte(deliveries.nextAttemptAt, now),
          or(
            isNull(deliveries.leaseExpiresAt),
            lte(deliveries.leaseExpiresAt, now),
          ),
          or(
            isNull(notificationDevicesTable.id),
            ne(
              notificationDevicesTable.profileId,
              notificationsTable.profileId,
            ),
            config.android
              ? eq(notificationDevicesTable.platform, "android")
              : undefined,
            config.ios
              ? eq(notificationDevicesTable.platform, "ios")
              : undefined,
          ),
        ),
      )
      .orderBy(asc(deliveries.nextAttemptAt), asc(deliveries.id))
      .for("update", { of: deliveries, skipLocked: true })
      .limit(1);
    if (!row) return null;
    const token = randomUUID();
    await tx
      .update(deliveries)
      .set({
        state: "processing",
        attempts: row.delivery.attempts + 1,
        leaseToken: token,
        leaseExpiresAt: new Date(now.getTime() + 120000),
      })
      .where(eq(deliveries.id, row.delivery.id));
    return { ...row, token };
  });
  if (!claimed) return false;
  let state = "provider_accepted",
    errorCode: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Recheck device ownership after claim, before external I/O. Payloads carry
    // no order/customer data even if ownership changes while I/O is in flight.
    const [current] = await db
      .select()
      .from(notificationDevicesTable)
      .where(
        and(
          eq(notificationDevicesTable.id, claimed.delivery.deviceId),
          eq(
            notificationDevicesTable.profileId,
            claimed.notification.profileId,
          ),
        ),
      )
      .limit(1);
    if (!current) {
      state = "unregistered";
      errorCode = "DEVICE_UNREGISTERED";
    } else
      await Promise.race([
        send(current.platform, current.token, claimed.notification.id),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Push acknowledgement timed out")),
            20000,
          );
        }),
      ]);
  } catch (error) {
    const permanent = invalidToken(error);
    state = permanent
      ? "invalid_token"
      : claimed.delivery.attempts >= 4
        ? "failed"
        : "pending";
    errorCode = permanent
      ? "INVALID_DEVICE_TOKEN"
      : "PROVIDER_ACKNOWLEDGEMENT_UNCONFIRMED";
  } finally {
    if (timer) clearTimeout(timer);
  }
  await db.transaction(async (tx) => {
    await tx
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(eq(notificationsTable.id, claimed.notification.id))
      .for("update");
    const [updated] = await tx
      .update(deliveries)
      .set({
        state,
        errorCode,
        leaseToken: null,
        leaseExpiresAt: null,
        acceptedAt: state === "provider_accepted" ? new Date() : null,
        nextAttemptAt: new Date(
          (await databaseNow(tx)).getTime() +
            Math.min(3600000, 30000 * 2 ** claimed.delivery.attempts),
        ),
      })
      .where(
        and(
          eq(deliveries.id, claimed.delivery.id),
          eq(deliveries.leaseToken, claimed.token),
        ),
      )
      .returning({ id: deliveries.id });
    if (!updated) return;
    if (state === "invalid_token")
      await tx
        .delete(notificationDevicesTable)
        .where(
          and(
            eq(notificationDevicesTable.id, claimed.delivery.deviceId),
            eq(
              notificationDevicesTable.profileId,
              claimed.notification.profileId,
            ),
          ),
        );
    await summarize(tx, claimed.notification.id);
  });
  if (errorCode)
    logger.warn(
      { notificationId: claimed.notification.id, errorCode },
      "Push acknowledgement unavailable; notification remains in app",
    );
  return true;
}
export async function drainPushBatch(
  stopping: () => boolean = () => false,
  progress: () => Promise<void> = async () => {},
) {
  await fanOutPushNotifications();
  for (let i = 0; i < 25 && !stopping(); i++) {
    if (!(await processPushDelivery())) break;
    await progress();
  }
}
