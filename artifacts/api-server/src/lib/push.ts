import { createPrivateKey, sign } from "node:crypto";
import { connect } from "node:http2";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { and, eq, lt, or, inArray } from "drizzle-orm";
import {
  db,
  notificationsTable,
  notificationDevicesTable,
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
export async function drainPushBatch() {
  const config = pushConfiguration();
  if (!config.android && !config.ios) return;
  const now = new Date();
  const batch = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(notificationsTable)
      .where(
        and(
          inArray(notificationsTable.pushState, ["pending", "processing"]),
          lt(notificationsTable.pushAttempts, 5),
          lt(notificationsTable.pushNextAttemptAt, now),
        ),
      )
      .for("update", { skipLocked: true })
      .limit(25);
    for (const row of rows)
      await tx
        .update(notificationsTable)
        .set({
          pushState: "processing",
          pushAttempts: row.pushAttempts + 1,
          pushNextAttemptAt: new Date(Date.now() + 120000),
        })
        .where(eq(notificationsTable.id, row.id));
    return rows;
  });
  for (const notification of batch) {
    const devices = await db
      .select()
      .from(notificationDevicesTable)
      .where(eq(notificationDevicesTable.profileId, notification.profileId));
    try {
      const supported = devices.filter((d) =>
        d.platform === "ios" ? config.ios : config.android,
      );
      if (!supported.length) {
        await db
          .update(notificationsTable)
          .set({ pushState: "not_registered" })
          .where(eq(notificationsTable.id, notification.id));
        continue;
      }
      for (const device of supported)
        await sendPush(device.platform, device.token, notification.id);
      await db
        .update(notificationsTable)
        .set({ pushState: "delivered" })
        .where(eq(notificationsTable.id, notification.id));
    } catch {
      await db
        .update(notificationsTable)
        .set({
          pushState: notification.pushAttempts >= 4 ? "failed" : "pending",
          pushNextAttemptAt: new Date(
            Date.now() +
              Math.min(3600000, 30000 * 2 ** notification.pushAttempts),
          ),
        })
        .where(eq(notificationsTable.id, notification.id));
      logger.warn(
        { notificationId: notification.id },
        "Push delivery deferred; details remain available in app",
      );
    }
  }
}
