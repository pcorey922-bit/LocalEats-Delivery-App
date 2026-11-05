import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

import { stripeWebhook } from "./routes/payment-webhook";
import { CommerceError } from "./lib/commerce-policy";
import { ZodError } from "zod";
import { readiness } from "./routes/operational-health";
import { limitMutations } from "./lib/request-limits";
import { randomUUID } from "node:crypto";
import { webHosting } from "./lib/web-hosting";
const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use((_req, res, next) => {
  res.setHeader("X-Request-ID", randomUUID());
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.get("/livez", (_req, res) => res.json({ alive: true }));
app.get("/readyz", readiness);
if (process.env.WEB_DIST_DIR) app.use(webHosting(process.env.WEB_DIST_DIR));
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
  }),
);
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json", limit: "256kb" }),
  stripeWebhook,
);
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.cookie &&
    !req.headers.authorization
  ) {
    const origin = req.get("origin");
    const trusted = new Set(
      [
        ...allowedOrigins,
        process.env.PUBLIC_APP_URL,
        `${req.protocol}://${req.get("host")}`,
      ].filter(Boolean),
    );
    if (!origin || !trusted.has(origin)) {
      res.status(403).json({ error: "Untrusted request origin" });
      return;
    }
  }
  next();
});
app.use("/api", limitMutations);
app.use("/api", router);

const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof CommerceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Review the supplied fields",
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
    return;
  }
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body is too large" });
    return;
  }
  // Never return provider payloads, SQL errors, tokens, or stack traces.
  logger.error({ errorType: error?.name ?? "Error" }, "Request failed");
  res.status(500).json({
    error: "The request could not be completed. Retry or contact support.",
  });
};
app.use(errors);
export default app;
