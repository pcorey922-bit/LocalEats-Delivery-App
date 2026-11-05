import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { sql } from "drizzle-orm";
import { db, requestLimitsTable as limits } from "@workspace/db";
export const limitMutations: RequestHandler = async (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  const userId = getAuth(req).userId;
  if (!userId) {
    next();
    return;
  }
  const configured = Number(process.env.API_MUTATION_LIMIT_PER_MINUTE ?? 120);
  if (!Number.isInteger(configured) || configured < 1 || configured > 10000)
    throw new Error("Invalid mutation rate limit configuration");
  const minute = Math.floor(Date.now() / 60000);
  const bucketKey = createHash("sha256")
    .update(`${userId}:${minute}`)
    .digest("hex");
  const [bucket] = await db
    .insert(limits)
    .values({ bucketKey, expiresAt: new Date((minute + 2) * 60000) })
    .onConflictDoUpdate({
      target: limits.bucketKey,
      set: { requests: sql`least(${limits.requests}+1,10001)` },
    })
    .returning({ requests: limits.requests });
  if (bucket.requests > configured) {
    res.setHeader(
      "Retry-After",
      String(Math.max(1, 60 - (Math.floor(Date.now() / 1000) % 60))),
    );
    res.status(429).json({ error: "Too many requests. Please retry shortly." });
    return;
  }
  next();
};
