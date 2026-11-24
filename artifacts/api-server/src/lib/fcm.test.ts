import pushPolicy from '../../../../config/native-push-policy.json';
import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, verify } from "node:crypto";
import { createFcmSender } from "./fcm";
import { createServer } from "node:http";
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
    assert.equal(body.message.android.priority, "HIGH", "User-visible delivery alerts must not default to Doze-delayed normal priority");
    assert.equal(
      body.message.android.collapse_key,
      body.message.data.notificationId,
    );
    assert.equal(body.message.android.notification.channel_id,pushPolicy.androidChannel.id);
    assert.ok(body.message.notification.title && body.message.notification.body,'High priority is paired with a user-visible alert, never silent polling');
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

test('FCM uses remaining original lifetime and sends nothing if OAuth consumes the deadline',async()=>{
  let ttl='', messages=0;
  const send=createFcmSender(credentials,async(input,init)=>{
    if(String(input).includes('oauth2'))return Response.json({access_token:'fixture',expires_in:3600});
    messages++;ttl=JSON.parse(String(init?.body)).message.android.ttl;
    return Response.json({name:'projects/rocoeats-test/messages/expiry-fixture'});
  });
  await send('token_fixture','notice',new Date(Date.now()+180000));
  assert.ok(parseInt(ttl)>0&&parseInt(ttl)<=180);assert.equal(messages,1);
  const realNow=Date.now;let clock=1800000000000;
  try {
    Date.now=()=>clock;
    const slow=createFcmSender(credentials,async()=>{clock+=4000;return Response.json({access_token:'fixture',expires_in:3600});});
    await assert.rejects(slow('token_fixture','old',new Date(clock+3000)),error=>(error as {code:string}).code==='notification/expired');
  } finally {Date.now=realNow;}
});


test('FCM fixes OAuth and message requests to their original endpoints without redirects',async()=>{
  const calls:string[]=[];
  const sender=createFcmSender(credentials,async(input,init)=>{
    calls.push(String(input));assert.equal(init?.redirect,'error','Signed OAuth assertions and message requests must never follow redirects');
    return String(input).includes('oauth2')?Response.json({access_token:'synthetic_access',expires_in:3600}):Response.json({name:'projects/rocoeats-test/messages/0:1500415314455276%31bd1c9631bd1c96'});
  });
  await sender('synthetic_device','synthetic_notice');assert.equal(calls.length,2);
});
test('FCM requires a complete same-project message resource before accepting delivery evidence',async()=>{
  for(const name of ['projects/rocoeats-test/messages/','projects/rocoeats-test/messages/ ', 'projects/rocoeats-test/messages/id/extra','projects/rocoeats-test/messages/id?query','projects/rocoeats-test/messages/id#fragment','projects/other-project/messages/id']){
    const sender=createFcmSender(credentials,async input=>String(input).includes('oauth2')?Response.json({access_token:'synthetic_access',expires_in:3600}):Response.json({name}));
    await assert.rejects(sender('synthetic_device','synthetic_notice'),/Invalid FCM acknowledgement/,'Malformed receipt cannot mark provider acceptance');
  }
});

test('real Fetch refuses simulated OAuth and message307 redirects without forwarding credentials',async()=>{
  let redirectedRequests=0,redirectStage='oauth';
  const server=createServer((request,response)=>{
    request.resume();
    if(request.url==='/redirect-target'){redirectedRequests++;response.writeHead(200,{'content-type':'application/json'});response.end('{}');return;}
    if(request.url==='/'+redirectStage){response.writeHead(307,{location:'/redirect-target'});response.end();return;}
    response.writeHead(200,{'content-type':'application/json'});
    response.end(JSON.stringify(request.url==='/oauth'?{access_token:'synthetic_access',expires_in:3600}:{name:'projects/rocoeats-test/messages/synthetic-receipt'}));
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const origin='http://127.0.0.1:'+(server.address() as {port:number}).port;
    for(const stage of ['oauth','message']){
      redirectStage=stage;
      const sender=createFcmSender(credentials,(input,init)=>fetch(origin+(String(input).includes('oauth2')?'/oauth':'/message'),init));
      await assert.rejects(sender('synthetic_device','synthetic_notice'));
    }
    assert.equal(redirectedRequests,0,'Neither signed OAuth assertions nor message credentials may reach a redirect target');
  } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('FCM rejects redirected responses even if an injected transport ignores redirect policy',async()=>{
  for(const stage of ['oauth','message']){
    const sender=createFcmSender(credentials,async input=>{
      const auth=String(input).includes('oauth2');const response=Response.json(auth?{access_token:'synthetic_access',expires_in:3600}:{name:'projects/rocoeats-test/messages/synthetic-receipt'});
      if((auth?'oauth':'message')===stage)Object.defineProperty(response,'redirected',{value:true});return response;
    });
    await assert.rejects(sender('synthetic_device','synthetic_notice'),stage==='oauth'?/Firebase authorization unavailable/:/FCM acknowledgement unavailable/);
  }
});
