import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, verify } from "node:crypto";
import { createFcmSender } from "./fcm";
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const credentials = JSON.stringify({
  type: "service_account",
  project_id: "rocoeats-test",
  client_email: "sender@rocoeats-test.iam.gserviceaccount.com",
  private_key: keys.privateKey.export({ type: "pkcs8", format: "pem" }),
  token_uri: "https://untrusted.invalid/token",
});
test("FCM signs scoped OAuth assertions and shares cached access across concurrent sends", async () => {
  let authorizations = 0,
    sends = 0;
  const transport: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url === "https://oauth2.googleapis.com/token") {
      authorizations++;
      const params = init!.body as URLSearchParams;
      const jwt = params.get("assertion")!;
      const parts = jwt.split(".");
      assert.equal(
        params.get("grant_type"),
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      );
      assert.ok(
        verify(
          "RSA-SHA256",
          Buffer.from(parts.slice(0, 2).join(".")),
          keys.publicKey,
          Buffer.from(parts[2], "base64url"),
        ),
      );
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      assert.equal(claims.aud, url);
      assert.equal(
        claims.scope,
        "https://www.googleapis.com/auth/firebase.messaging",
      );
      assert.equal(claims.exp - claims.iat, 3600);
      return Response.json({
        access_token: "test_access_fixture",
        expires_in: 3600,
      });
    }
    assert.equal(
      url,
      "https://fcm.googleapis.com/v1/projects/rocoeats-test/messages:send",
    );
    assert.equal(
      new Headers(init!.headers).get("authorization"),
      "Bearer test_access_fixture",
    );
    const body = JSON.parse(String(init!.body));
    assert.equal(body.message.android.ttl, "300s");
    assert.equal(
      body.message.android.collapse_key,
      body.message.data.notificationId,
    );
    assert.ok(!JSON.stringify(body).includes("private_key"));
    sends++;
    return Response.json({ name: `projects/rocoeats-test/messages/${sends}` });
  };
  const send = createFcmSender(credentials, transport);
  await Promise.all([
    send("token_fixture", "notice1"),
    send("token_fixture", "notice2"),
  ]);
  await send("token_fixture", "notice3");
  assert.equal(authorizations, 1);
  assert.equal(sends, 3);
});
test("FCM distinguishes invalid registration from provider rejection and rejects missing acknowledgements", async () => {
  let mode = "invalid";
  const send = createFcmSender(credentials, async (input) => {
    if (String(input).includes("oauth2"))
      return Response.json({ access_token: "token_fixture", expires_in: 3600 });
    if (mode === "invalid")
      return Response.json(
        { error: { details: [{ errorCode: "UNREGISTERED" }] } },
        { status: 404 },
      );
    if (mode === "temporary")
      return Response.json(
        { error: { details: [{ errorCode: "UNAVAILABLE" }] } },
        { status: 503 },
      );
    return Response.json({});
  });
  await assert.rejects(
    send("device_fixture", "notice"),
    (error: unknown) =>
      (error as { code: string }).code ===
      "messaging/registration-token-not-registered",
  );
  mode = "temporary";
  await assert.rejects(
    send("device_fixture", "notice"),
    (error: unknown) =>
      (error as { code: string }).code === "messaging/provider-unavailable",
  );
  mode = "empty";
  await assert.rejects(
    send("device_fixture", "notice"),
    /Invalid FCM acknowledgement/,
  );
});
test("FCM fails closed on invalid credentials and OAuth failures", async () => {
  assert.throws(() => createFcmSender("{}"), /configuration/);
  let calls = 0;
  const send = createFcmSender(credentials, async () => {
    calls++;
    return Response.json({ error: "invalid_grant" }, { status: 401 });
  });
  await assert.rejects(
    send("device_fixture", "notice"),
    /authorization unavailable/,
  );
  await assert.rejects(
    send("device_fixture", "notice"),
    /authorization unavailable/,
  );
  assert.equal(calls, 2);
});
