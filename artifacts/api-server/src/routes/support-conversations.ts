import { Router } from "express";
import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  supportCasesTable,
  supportMessagesTable,
  profilesTable,
  notificationsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
import { databaseNow } from "../lib/database-clock";
const router = Router();
router.get("/support/cases/:id/messages", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p) return;
  const id = z.string().uuid().parse(req.params.id),
    query = z
      .object({ beforeVersion: z.coerce.number().int().positive().optional() })
      .strict()
      .parse(req.query);
  const [entry] = await db
    .select()
    .from(supportCasesTable)
    .where(eq(supportCasesTable.id, id));
  if (!entry || (p.role !== "admin" && entry.createdBy !== p.id))
    throw new CommerceError(404, "Support case not found");
  const rows = await db
    .select({
      id: supportMessagesTable.id,
      authorRole: supportMessagesTable.authorRole,
      kind: supportMessagesTable.kind,
      body: supportMessagesTable.body,
      caseVersion: supportMessagesTable.caseVersion,
      statusAfter: supportMessagesTable.statusAfter,
      createdAt: supportMessagesTable.createdAt,
    })
    .from(supportMessagesTable)
    .where(
      and(
        eq(supportMessagesTable.caseId, id),
        query.beforeVersion
          ? lt(supportMessagesTable.caseVersion, query.beforeVersion)
          : undefined,
      ),
    )
    .orderBy(desc(supportMessagesTable.caseVersion))
    .limit(31);
  const page = rows.slice(0, 30);
  res.setHeader("Cache-Control", "no-store");
  res.json({
    case: { id: entry.id, status: entry.status, version: entry.version },
    messages: page.reverse(),
    nextBeforeVersion: rows.length > 30 ? rows[29].caseVersion : null,
  });
});
router.post("/support/cases/:id/messages", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p) return;
  const id = z.string().uuid().parse(req.params.id),
    input = z
      .object({
        id: z.string().uuid(),
        version: z.number().int().positive(),
        message: z.string().trim().min(3).max(3000),
      })
      .strict()
      .parse(req.body);
  const result = await db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(supportCasesTable)
      .where(eq(supportCasesTable.id, id))
      .for("update");
    if (!entry || (p.role !== "admin" && entry.createdBy !== p.id))
      throw new CommerceError(404, "Support case not found");
    const [existing] = await tx
      .select()
      .from(supportMessagesTable)
      .where(eq(supportMessagesTable.id, input.id));
    if (existing) {
      if (
        existing.caseId !== id ||
        existing.authorProfileId !== p.id ||
        existing.kind !== "reply" ||
        existing.body !== input.message ||
        existing.caseVersion !== input.version + 1
      )
        throw new CommerceError(409, "Reply ID conflicts with a saved message");
      return existing;
    }
    if (entry.version !== input.version)
      throw new CommerceError(
        409,
        "Conversation changed. Review the latest messages before replying",
      );
    const status = entry.status === "resolved" ? "open" : entry.status,
      version = entry.version + 1,
      now = await databaseNow(tx);
    const [message] = await tx
      .insert(supportMessagesTable)
      .values({
        id: input.id,
        caseId: id,
        authorProfileId: p.id,
        authorRole: p.role,
        kind: "reply",
        body: input.message,
        caseVersion: version,
        statusAfter: status,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!message) throw new CommerceError(409, "Reply ID is already used");
    await tx
      .update(supportCasesTable)
      .set({
        status,
        version,
        updatedAt: now,
        ...(entry.status === "resolved"
          ? { resolution: null, reviewedBy: null }
          : {}),
      })
      .where(eq(supportCasesTable.id, id));
    const recipients =
      p.role === "admin"
        ? [{ id: entry.createdBy }]
        : await tx
            .select({ id: profilesTable.id })
            .from(profilesTable)
            .where(
              and(
                eq(profilesTable.role, "admin"),
                eq(profilesTable.isActive, true),
              ),
            );
    for (const recipient of recipients)
      if (recipient.id !== p.id)
        await tx
          .insert(notificationsTable)
          .values({
            profileId: recipient.id,
            orderId: entry.orderId,
            eventKey: `support.reply:${input.id}`,
            title: "Support conversation updated",
            body: "Open support to review a new message. Operational and payment actions require their separate authorized controls.",
          })
          .onConflictDoNothing();
    await audit(tx, p.id, "support.replied", id, {
      messageId: input.id,
      version,
      reopened: entry.status === "resolved",
    });
    return message;
  });
  res.status(201).json(result);
});
export default router;
