import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, or, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ledgerTransactionsTable as journals,
  ledgerLinesTable as lines,
  paymentsTable,
  ordersTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
const router: IRouter = Router();
const cursorSchema = z
  .object({
    at: z.string().datetime({ offset: true }),
    id: z.string().min(1).max(255),
  })
  .strict();
router.get("/admin/ledger", requireAuth, async (req, res) => {
  const actor = await getActiveProfile(req, res);
  if (!actor || !requireRole(actor, ["admin"], res)) return;
  const query = z
    .object({
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
      orderId: z.string().uuid().optional(),
      cursor: z.string().max(1024).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict()
    .parse(req.query);
  const from = query.from ? new Date(query.from) : undefined,
    to = query.to ? new Date(query.to) : undefined;
  if (from && to && from >= to) {
    res.status(400).json({ error: "Report end must follow start" });
    return;
  }
  let cursor: z.infer<typeof cursorSchema> | undefined;
  if (query.cursor) {
    try {
      cursor = cursorSchema.parse(
        JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8")),
      );
    } catch {
      res.status(400).json({ error: "Invalid journal cursor" });
      return;
    }
  }
  const scope = and(
    from ? gte(journals.createdAt, from) : undefined,
    to ? lt(journals.createdAt, to) : undefined,
    query.orderId ? eq(journals.orderId, query.orderId) : undefined,
  );
  // One repeatable-read snapshot keeps balances and journal pages consistent
  // while other workers post money movements. Numeric strings avoid precision loss.
  const report = await db.transaction(
    async (tx) => {
      const balances = await tx
        .select({
          account: lines.account,
          debitsCents: sql<string>`coalesce(sum(case when ${lines.amountCents}>0 then ${lines.amountCents} else 0 end),0)::text`,
          creditsCents: sql<string>`coalesce(sum(case when ${lines.amountCents}<0 then -${lines.amountCents}::bigint else 0 end),0)::text`,
          balanceCents: sql<string>`sum(${lines.amountCents})::text`,
        })
        .from(lines)
        .innerJoin(journals, eq(journals.id, lines.transactionId))
        .where(scope)
        .groupBy(lines.account)
        .orderBy(lines.account);
      const page = await tx
        .select({
          id: journals.id,
          orderId: journals.orderId,
          kind: journals.kind,
          currency: journals.currency,
          createdAt: journals.createdAt,
          cursorAt: sql<string>`to_char(${journals.createdAt} at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
        })
        .from(journals)
        .where(
          and(
            scope,
            cursor
              ? or(
                  sql`${journals.createdAt}<${cursor.at}::timestamptz`,
                  and(
                    sql`${journals.createdAt}=${cursor.at}::timestamptz`,
                    lt(journals.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(journals.createdAt), desc(journals.id))
        .limit(query.limit + 1);
      const recent = page.slice(0, query.limit);
      const details = recent.length
        ? await tx
            .select({
              transactionId: lines.transactionId,
              account: lines.account,
              partyProfileId: lines.partyProfileId,
              amountCents: lines.amountCents,
            })
            .from(lines)
            .where(
              inArray(
                lines.transactionId,
                recent.map((row) => row.id),
              ),
            )
            .orderBy(lines.account, lines.partyProfileId, lines.amountCents)
        : [];
      const detailed = recent.map(({ cursorAt, ...journal }) => ({
        ...journal,
        lines: details
          .filter((line) => line.transactionId === journal.id)
          .map(({ transactionId, ...line }) => line),
      }));
      const missing = await tx
        .select({ count: sql<string>`count(*)::text` })
        .from(paymentsTable)
        .innerJoin(ordersTable, eq(ordersTable.id, paymentsTable.orderId))
        .leftJoin(
          journals,
          eq(journals.id, sql`'payment:' || ${paymentsTable.orderId}::text`),
        )
        .where(
          and(
            sql`${paymentsTable.status} in ('succeeded','refunded')`,
            sql`${journals.id} is null`,
            query.orderId ? eq(ordersTable.id, query.orderId) : undefined,
          ),
        );
      const last = recent.at(-1);
      return {
        balances,
        journals: detailed,
        missingPaymentBaselines: missing[0].count,
        nextCursor:
          page.length > query.limit && last
            ? Buffer.from(
                JSON.stringify({ at: last.cursorAt, id: last.id }),
              ).toString("base64url")
            : null,
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
  res.json({
    ...report,
    currency: "USD",
    scope: {
      from: query.from ?? null,
      to: query.to ?? null,
      orderId: query.orderId ?? null,
    },
    balanced:
      report.balances.reduce(
        (sum, row) => sum + BigInt(row.balanceCents),
        0n,
      ) === 0n,
    liveChargesEnabled: false,
    notice:
      "Gross operational ledger. Provider fees, disputes, tax remittances and bank payouts are not yet reconciled. Missing payment baselines are counted across all dates for this order scope; do not interpret this report as net profit or a bank statement.",
  });
});
export default router;
