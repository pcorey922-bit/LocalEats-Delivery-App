import test from "node:test";
import assert from "node:assert/strict";
import http, { type IncomingHttpHeaders, type Server } from "node:http";
import express from "express";
import { createProxyServer } from "httpxy";
import { gzipSync } from "node:zlib";
import {
  CLERK_PROXY_PATH,
  forwardClerkRequests,
  clerkProxyMiddleware,
} from "../src/middlewares/clerkProxyMiddleware";
const listen = (server: Server) =>
  new Promise<number>((resolve) => {
    server.listen(0, "127.0.0.1", () =>
      resolve((server.address() as { port: number }).port),
    );
  });
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
function request(port: number, path: string, method = "GET", body?: string) {
  return new Promise<{
    status: number;
    headers: IncomingHttpHeaders;
    body: Buffer;
  }>((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          host: "app.example.test",
          "x-forwarded-host": "app.example.test",
          "x-forwarded-proto": "https",
          "content-type": "application/json",
          ...(body ? { "content-length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode!,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end(body);
  });
}
test("same proxy engine preserves mounted paths, request bodies, secret isolation, gzip and cookies", async () => {
  const fixtureSecret = "proxy-fixture-not-a-real-credential";
  const zipped = gzipSync("fixture response");
  let observed: {
    path?: string;
    body?: string;
    secret?: string;
    proxy?: string;
    host?: string;
  } = {};
  const upstream = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      observed = {
        path: req.url,
        body: Buffer.concat(chunks).toString(),
        secret: String(req.headers["clerk-secret-key"]),
        proxy: String(req.headers["clerk-proxy-url"]),
        host: req.headers.host,
      };
      res.writeHead(200, {
        "content-encoding": "gzip",
        "content-type": "text/plain",
        "set-cookie": ["fixture_a=1; HttpOnly; Secure", "fixture_b=2; Secure"],
      });
      res.write(zipped.subarray(0, 3));
      res.end(zipped.subarray(3));
    });
  });
  const upstreamPort = await listen(upstream),
    app = express();
  const engine = createProxyServer({
    target: `http://127.0.0.1:${upstreamPort}`,
    changeOrigin: true,
    selfHandleResponse: true,
  });
  app.use(CLERK_PROXY_PATH, forwardClerkRequests(fixtureSecret, engine));
  const server = http.createServer(app),
    port = await listen(server);
  try {
    const response = await request(
      port,
      CLERK_PROXY_PATH + "/v1/client?fixture=1",
      "POST",
      '{"fixture":true}',
    );
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, zipped);
    assert.equal(response.headers["content-length"], String(zipped.length));
    assert.equal(response.headers["transfer-encoding"], undefined);
    assert.equal(response.headers["content-encoding"], "gzip");
    assert.equal(response.headers["clerk-secret-key"], undefined);
    assert.deepEqual(response.headers["set-cookie"], [
      "fixture_a=1; HttpOnly; Secure",
      "fixture_b=2; Secure",
    ]);
    assert.deepEqual(observed, {
      path: "/v1/client?fixture=1",
      body: '{"fixture":true}',
      secret: fixtureSecret,
      proxy: "https://app.example.test" + CLERK_PROXY_PATH,
      host: `127.0.0.1:${upstreamPort}`,
    });
  } finally {
    await close(server);
    await close(upstream);
    engine.close();
  }
});
test("proxy retains HEAD/204/304 semantics and network failure returns a bounded empty gateway error", async () => {
  const upstream = http.createServer((req, res) => {
    const status =
      req.url === "/empty" ? 204 : req.url === "/cached" ? 304 : 200;
    res.writeHead(status, { "content-length": "42" });
    res.end();
  });
  const upstreamPort = await listen(upstream);
  const app = express(),
    engine = createProxyServer({
      target: `http://127.0.0.1:${upstreamPort}`,
      selfHandleResponse: true,
    });
  app.use(CLERK_PROXY_PATH, forwardClerkRequests("fixture", engine));
  const server = http.createServer(app),
    port = await listen(server);
  try {
    for (const [path, method, status, length] of [
      ["/head", "HEAD", 200, "42"],
      ["/empty", "GET", 204, undefined],
      ["/cached", "GET", 304, "42"],
    ] as const) {
      const r = await request(port, CLERK_PROXY_PATH + path, method);
      assert.equal(r.status, status);
      assert.equal(r.body.length, 0);
      assert.equal(r.headers["content-length"], length);
    }
    await close(upstream);
    const failed = await request(port, CLERK_PROXY_PATH + "/unavailable");
    assert.equal(failed.status, 502);
    assert.equal(failed.body.length, 0);
  } finally {
    await close(server);
    if (upstream.listening) await close(upstream);
    engine.close();
  }
});
test("Clerk proxy remains bypassed for private TEST credentials in production", async () => {
  const previous = {
    mode: process.env.NODE_ENV,
    key: process.env.CLERK_SECRET_KEY,
  };
  process.env.NODE_ENV = "production";
  process.env.CLERK_SECRET_KEY = "sk_test_fixture";
  const app = express();
  app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
  app.use((_req, res) => res.status(418).end());
  const server = http.createServer(app),
    port = await listen(server);
  try {
    assert.equal(
      (await request(port, CLERK_PROXY_PATH + "/v1/client")).status,
      418,
    );
  } finally {
    await close(server);
    if (previous.mode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.mode;
    if (previous.key === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = previous.key;
  }
});


test('production Clerk proxy origin and client identity cannot be selected by forwarded headers',async()=>{
 const prior={origin:process.env.PUBLIC_APP_URL,mode:process.env.NODE_ENV};
 process.env.PUBLIC_APP_URL='https://app.example.test';process.env.NODE_ENV='production';
 let observed:Record<string,unknown>={};
 const upstream=http.createServer((req,res)=>{observed={proxy:req.headers['clerk-proxy-url'],ip:req.headers['x-forwarded-for']};res.end('ok');});
 const upstreamPort=await listen(upstream),engine=createProxyServer({target:`http://127.0.0.1:${upstreamPort}`,selfHandleResponse:true});
 const app=express();app.use(CLERK_PROXY_PATH,forwardClerkRequests('fixture-not-real',engine));const server=http.createServer(app),port=await listen(server);
 try{
  const response=await fetch(`http://127.0.0.1:${port}${CLERK_PROXY_PATH}/v1/client`,{headers:{host:'evil.example','x-forwarded-host':'evil.example','x-forwarded-proto':'http','x-forwarded-for':'192.0.2.66'}});
  assert.equal(response.status,200);assert.equal(observed.proxy,'https://app.example.test'+CLERK_PROXY_PATH);assert.equal(observed.ip,'127.0.0.1');
  delete process.env.PUBLIC_APP_URL;
  assert.equal((await fetch(`http://127.0.0.1:${port}${CLERK_PROXY_PATH}/v1/client`)).status,503);
 }finally{await close(server);await close(upstream);engine.close();for(const [name,value] of [['PUBLIC_APP_URL',prior.origin],['NODE_ENV',prior.mode]])if(value===undefined)delete process.env[name!];else process.env[name!]=value;}
});
