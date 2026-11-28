import { pushLifetime } from "./push-expiry";
import pushPolicy from "../../../../config/native-push-policy.json";
import { createHash, createPrivateKey, sign } from "node:crypto";
import { prepareFcmPermissionProbe } from "./fcm-permission-probe";
const tokenUrl = "https://oauth2.googleapis.com/token";
const scope = "https://www.googleapis.com/auth/firebase.messaging";
type Access = { value: string; expiresAt: number };
function parseCredentials(raw: string) {
  // Never propagate JSON/OpenSSL errors: they may include credential fragments.
  try {
    const credentials: unknown = JSON.parse(raw);
    if (
      !credentials ||
      typeof credentials !== "object" ||
      Array.isArray(credentials) ||
      !("type" in credentials) ||
      !("project_id" in credentials) ||
      !("client_email" in credentials) ||
      !("private_key" in credentials) ||
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
    return {
      key,
      email: credentials.client_email,
      project: credentials.project_id,
    };
  } catch {
    throw new Error("Invalid Firebase service account configuration");
  }
}

export type FcmCredentialStatus = "missing" | "invalid" | "locally_valid";
let inspectedHash = "",
  inspectedStatus: FcmCredentialStatus = "missing";
// Local parsing only: no OAuth, network request, IAM check or send authorization.
export function fcmCredentialStatus(
  raw: string | undefined,
): FcmCredentialStatus {
  if (!raw) return "missing";
  const hash = createHash("sha256").update(raw).digest("hex");
  if (hash !== inspectedHash) {
    try {
      parseCredentials(raw);
      inspectedStatus = "locally_valid";
    } catch {
      inspectedStatus = "invalid";
    }
    inspectedHash = hash;
  }
  return inspectedStatus;
}

async function requestAccessToken(
  { key, email }: ReturnType<typeof parseCredentials>,
  transport: typeof fetch,
): Promise<Access> {
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
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Firebase authorization unavailable"));
    }, 10000);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await transport(tokenUrl, {
          method: "POST",
          redirect: "error",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: `${data}.${signature}`,
          }),
          signal: controller.signal,
        });
        if (!response.ok || response.redirected)
          throw new Error("Firebase authorization unavailable");
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
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

const diagnosticIdentity = {
  project: "rocoeats-3bd55",
  email: "rocoeats-staging-fcm@rocoeats-3bd55.iam.gserviceaccount.com",
};
export function firebaseOAuthDiagnosticReady(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const parsed = parseCredentials(raw);
    return (
      parsed.project === diagnosticIdentity.project &&
      parsed.email === diagnosticIdentity.email
    );
  } catch {
    return false;
  }
}

// Intentionally does not call createFcmSender or populate its token cache.
// Never returns provider payloads, JWT assertions, credentials or access tokens.
export async function verifyFirebaseOAuth(
  raw: string | undefined,
  transport: typeof fetch = fetch,
) {
  if (!firebaseOAuthDiagnosticReady(raw))
    return { authenticated: false, code: "CREDENTIAL_UNAVAILABLE" } as const;
  let access: Access | undefined;
  try {
    access = await requestAccessToken(parseCredentials(raw!), transport);
    return { authenticated: true, code: "GOOGLE_OAUTH_AUTHENTICATED" } as const;
  } catch {
    return { authenticated: false, code: "GOOGLE_OAUTH_UNAVAILABLE" } as const;
  } finally {
    // Drop our reference immediately; no diagnostic token is cached or persisted.
    if (access) access.value = "";
    access = undefined;
  }
}

// Only Google's fixed OAuth/FCM origins are used, regardless of credential JSON.
// Separate from verifyFirebaseOAuth: requires separate approval even though it
// cannot deliver a message. Never invoke the normal cached sending function.
export async function validateFcmPermission(
  raw: string | undefined,
  transport: typeof fetch = fetch,
) {
  if (!firebaseOAuthDiagnosticReady(raw))
    return {
      authenticated: false,
      permissionValidated: false,
      code: "CREDENTIAL_UNAVAILABLE",
    } as const;
  let access: Access | undefined;
  let authenticated = false;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    access = await requestAccessToken(parseCredentials(raw!), transport);
    authenticated = true;
    const probe = prepareFcmPermissionProbe();
    // Defense at the actual network boundary, independent of UI/request inputs.
    if (JSON.parse(probe.body).validate_only !== true)
      throw Error("Validation-only required");
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(Error("Validation unavailable"));
      }, 10000);
    });
    await Promise.race([
      (async () => {
        const response = await transport(probe.url, {
          method: probe.method,
          redirect: probe.redirect,
          body: probe.body,
          headers: {
            authorization: `Bearer ${access!.value}`,
            "content-type": "application/json",
          },
          signal: controller.signal,
        });
        if (response.status !== 200 || response.redirected)
          throw Error("Validation unavailable");
        const body = (await response.json()) as { name?: unknown };
        const prefix = "projects/rocoeats-3bd55/messages/";
        if (
          typeof body?.name !== "string" ||
          !body.name.startsWith(prefix) ||
          !body.name.slice(prefix.length) ||
          /[\s/?#]/.test(body.name.slice(prefix.length))
        )
          throw Error("Validation unavailable");
      })(),
      deadline,
    ]);
    return {
      authenticated: true,
      permissionValidated: true,
      code: "FCM_PERMISSION_VALIDATED",
    } as const;
  } catch {
    return {
      authenticated,
      permissionValidated: false,
      code: "FCM_PERMISSION_UNVERIFIED",
    } as const;
  } finally {
    clearTimeout(timer);
    if (access) access.value = "";
    access = undefined;
  }
}

export function createFcmSender(raw: string, transport: typeof fetch = fetch) {
  const { key, email, project } = parseCredentials(raw);
  let cached: Access | null = null,
    pending: Promise<Access> | null = null;
  async function accessToken() {
    if (cached && cached.expiresAt > Date.now() + 60000) return cached.value;
    if (!pending)
      pending = (async () => {
        return requestAccessToken({ key, email, project }, transport);
      })();
    try {
      cached = await pending;
      return cached.value;
    } finally {
      pending = null;
    }
  }
  return async (token: string, notificationId: string, expiresAt?: Date) => {
    const bearer = await accessToken();
    const lifetime = pushLifetime(expiresAt);
    const response = await transport(
      `https://fcm.googleapis.com/v1/projects/${project}/messages:send`,
      {
        method: "POST",
        redirect: "error",
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
              // These messages always include a visible notification. Normal
              // priority may wait for a Doze maintenance window and miss offers.
              priority: "HIGH",
              collapse_key: notificationId,
              ttl: `${lifetime.ttlSeconds}s`,
              notification: {
                tag: notificationId,
                channel_id: pushPolicy.androidChannel.id,
              },
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (response.redirected) throw new Error("FCM acknowledgement unavailable");
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
    const prefix = `projects/${project}/messages/`;
    if (
      typeof body.name !== "string" ||
      !body.name.startsWith(prefix) ||
      body.name.length === prefix.length ||
      /[\s/?#]/.test(body.name.slice(prefix.length))
    )
      throw new Error("Invalid FCM acknowledgement");
  };
}
let sender: ReturnType<typeof createFcmSender> | undefined,
  configurationHash = "";
export async function sendFcm(
  token: string,
  notificationId: string,
  expiresAt?: Date,
) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase configuration required");
  const hash = createHash("sha256").update(raw).digest("hex");
  if (!sender || configurationHash !== hash) {
    sender = createFcmSender(raw);
    configurationHash = hash;
  }
  return sender(token, notificationId, expiresAt);
}
