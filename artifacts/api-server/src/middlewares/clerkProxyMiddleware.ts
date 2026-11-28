import { clientAddress } from "../lib/client-address";
/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through your domain, enabling Clerk
 * authentication on custom domains and .replit.app deployments without
 * requiring CNAME DNS configuration.
 *
 * AUTH CONFIGURATION: To manage users, enable/disable login providers
 * (Google, GitHub, etc.), change app branding, or configure OAuth credentials,
 * use the Auth pane in the workspace toolbar. There is no external Clerk
 * dashboard — all auth configuration is done through the Auth pane.
 *
 * IMPORTANT:
 * - Only active in production (Clerk proxying doesn't work for dev instances)
 * - Must be mounted BEFORE express.json() middleware
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import type { IncomingHttpHeaders } from "http";
import type { RequestHandler } from "express";
import { createProxyServer, type ProxyServer } from "httpxy";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

// Authentication origin comes from protected deployment configuration, not
// forwarded headers. TEST/dev without configuration may use the direct Host.
function configuredClerkOrigin(): string | undefined {
  try {
    const url=new URL(process.env.PUBLIC_APP_URL || '');
    if(url.username || url.password || url.pathname!=='/' || url.search || url.hash) return;
    if(url.protocol!=='https:' && !(process.env.NODE_ENV!=='production' && url.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) return;
    return url.origin;
  }catch{return;}
}
export function getClerkProxyHost(req: {headers:IncomingHttpHeaders}):string|undefined {
  const origin=configuredClerkOrigin();if(origin)return new URL(origin).host;
  if(process.env.NODE_ENV==='production' || process.env.PUBLIC_APP_URL) return;
  const raw=req.headers.host;
  if(typeof raw!=='string' || /[\s,/@?#]/.test(raw)) return;
  try {const url=new URL('https://'+raw);return url.host.toLowerCase()===raw.toLowerCase()?url.host:undefined;}catch{return;}
}

export function clerkProxyMiddleware(): RequestHandler {
  // Only run proxy in production — Clerk proxying doesn't work for dev instances
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_")) {
    return (_req, _res, next) => next();
  }

  return forwardClerkRequests(secretKey);
}

// Use the same forwarding engine as the former middleware, without its unused
// glob matcher (unpatched picomatch ReDoS advisory GHSA-fc5q-39xc-vjpf).
// Injecting an engine is for offline compatibility tests; HTTP callers cannot
// choose a target. Production always uses the fixed Clerk HTTPS upstream.
export function forwardClerkRequests(
  secretKey: string,
  proxy: ProxyServer = createProxyServer({
    target: CLERK_FAPI,
    changeOrigin: true,
    selfHandleResponse: true,
  }),
): RequestHandler {
  proxy.on("proxyReq", (proxyReq, req) => {
    const origin=configuredClerkOrigin();
    const host=getClerkProxyHost(req);
    proxyReq.setHeader("Clerk-Proxy-Url", `${origin || 'https://'+host}${CLERK_PROXY_PATH}`);
    proxyReq.setHeader("Clerk-Secret-Key", secretKey);
    proxyReq.setHeader("X-Forwarded-For", clientAddress(req));
  });
  // Clerk's dynamic Frontend API responses (/v1/environment, /v1/client,
  // JWKS, ...) arrive without a Content-Length, so relaying them would use
  // Transfer-Encoding: chunked — which the deployment edge (Cloud Run)
  // rejects, turning the app's 200 into a 500. Buffer only those so they can
  // be re-sent with a Content-Length; the body is forwarded untouched so
  // Content-Encoding is preserved. Length-known responses (e.g. /npm/*
  // assets) and body-less responses stream through without buffering.
  proxy.on("proxyRes", (proxyRes, req, res) => {
    const headers = { ...proxyRes.headers };
    // Transfer-Encoding/Connection are hop-by-hop (RFC 7230 §6.1).
    delete headers["transfer-encoding"];
    delete headers["connection"];
    delete headers["keep-alive"];

    const status = proxyRes.statusCode ?? 502;
    // Content-Length is forbidden on 1xx/204; HEAD/304 may keep theirs.
    if (status < 200 || status === 204) {
      delete headers["content-length"];
    }

    const bodyless =
      req.method === "HEAD" || status < 200 || status === 204 || status === 304;
    if (headers["content-length"] !== undefined || bodyless) {
      res.writeHead(status, headers);
      // Headers are already sent, so abort the response if the upstream
      // stream errors mid-pipe (e.g. ECONNRESET) rather than leaving an
      // unhandled 'error' or a hung client.
      proxyRes.on("error", () => res.destroy());
      proxyRes.pipe(res);
      return;
    }

    const chunks: Buffer[] = [];
    proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
    proxyRes.on("end", () => {
      const body = Buffer.concat(chunks);
      headers["content-length"] = String(body.length);
      res.writeHead(status, headers);
      res.end(body);
    });
    proxyRes.on("error", () => {
      if (!res.headersSent) {
        // Set a length so the empty 502 isn't sent chunked (which the
        // deployment edge would reject just like the original response).
        res.writeHead(502, { "content-length": "0" });
      }
      res.end();
    });
  });
  return async (req, res) => {
    if (!getClerkProxyHost(req)) {
      res.writeHead(503, {"content-length":"0"}).end();return;
    }
    req.url = req.url.replace(/^\/api\/__clerk(?=\/|$)/, "");
    try {
      await proxy.web(req, res);
    } catch {
      if (res.headersSent) res.destroy();
      else res.writeHead(502, { "content-length": "0" }).end();
    }
  };
}
