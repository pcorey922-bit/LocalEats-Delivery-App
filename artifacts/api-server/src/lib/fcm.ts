import { createHash, createPrivateKey, sign } from "node:crypto";
const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/firebase.messaging";
type Access = { value: string; expiresAt: number };
// Only Google's fixed OAuth/FCM origins are used, regardless of credential JSON.
export function createFcmSender(raw: string, transport: typeof fetch = fetch) {
  const credentials = JSON.parse(raw) as Record<string, unknown>;
  if (
    credentials.type !== "service_account" ||
    typeof credentials.project_id !== "string" ||
    !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(credentials.project_id) ||
    typeof credentials.client_email !== "string" ||
    !credentials.client_email.endsWith(".iam.gserviceaccount.com") ||
    typeof credentials.private_key !== "string"
  )
    throw new Error("Invalid Firebase service account configuration");
  const key = createPrivateKey(credentials.private_key);
  if (key.asymmetricKeyType !== "rsa")
    throw new Error("Firebase signing key must be RSA");
  const email = credentials.client_email,
    project = credentials.project_id;
  let cached: Access | null = null,
    pending: Promise<Access> | null = null;
  async function accessToken() {
    if (cached && cached.expiresAt > Date.now() + 60000) return cached.value;
    if (!pending)
      pending = (async () => {
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(
          JSON.stringify({ alg: "RS256", typ: "JWT" }),
        ).toString("base64url");
        const claims = Buffer.from(
          JSON.stringify({
            iss: email,
            scope,
            aud: tokenUrl,
            iat: now,
            exp: now + 3600,
          }),
        ).toString("base64url");
        const data = `${header}.${claims}`,
          signature = sign("RSA-SHA256", Buffer.from(data), key).toString(
            "base64url",
          );
        const response = await transport(tokenUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: `${data}.${signature}`,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Firebase authorization unavailable");
        const body = (await response.json()) as {
          access_token?: unknown;
          expires_in?: unknown;
        };
        if (
          typeof body.access_token !== "string" ||
          !body.access_token ||
          typeof body.expires_in !== "number" ||
          body.expires_in < 120 ||
          body.expires_in > 3600
        )
          throw new Error("Invalid Firebase authorization response");
        return {
          value: body.access_token,
          expiresAt: Date.now() + body.expires_in * 1000,
        };
      })();
    try {
      cached = await pending;
      return cached.value;
    } finally {
      pending = null;
    }
  }
  return async (token: string, notificationId: string) => {
    const bearer = await accessToken();
    const response = await transport(
      `https://fcm.googleapis.com/v1/projects/${project}/messages:send`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${bearer}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: "RoCoEats test update",
              body: "Open RoCoEats to view your notification.",
            },
            data: { notificationId },
            android: {
              collapse_key: notificationId,
              ttl: "300s",
              notification: { tag: notificationId },
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      if (response.status === 401) cached = null;
      let unregistered = false;
      try {
        const body = (await response.json()) as {
          error?: { details?: Array<{ errorCode?: string }> };
        };
        unregistered =
          body.error?.details?.some(
            (detail) => detail.errorCode === "UNREGISTERED",
          ) ?? false;
      } catch {}
      throw Object.assign(new Error("FCM acknowledgement unavailable"), {
        code: unregistered
          ? "messaging/registration-token-not-registered"
          : "messaging/provider-unavailable",
      });
    }
    const body = (await response.json()) as { name?: unknown };
    if (
      typeof body.name !== "string" ||
      !body.name.startsWith(`projects/${project}/messages/`)
    )
      throw new Error("Invalid FCM acknowledgement");
  };
}
let sender: ReturnType<typeof createFcmSender> | undefined,
  configurationHash = "";
export async function sendFcm(token: string, notificationId: string) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase configuration required");
  const hash = createHash("sha256").update(raw).digest("hex");
  if (!sender || configurationHash !== hash) {
    sender = createFcmSender(raw);
    configurationHash = hash;
  }
  return sender(token, notificationId);
}
