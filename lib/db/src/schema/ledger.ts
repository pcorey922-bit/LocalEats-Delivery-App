import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";
export const ledgerTransactionsTable = pgTable(
  "ledger_transactions",
  {
    id: text("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id),
    kind: text("kind").notNull(),
    currency: text("currency").notNull().default("USD"),
    fingerprint: text("fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ledger_transactions_order_idx").on(t.orderId, t.createdAt),
    check("ledger_currency_usd", sql`${t.currency}='USD'`),
  ],
);
export const ledgerLinesTable = pgTable(
  "ledger_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => ledgerTransactionsTable.id),
    account: text("account").notNull(),
    partyProfileId: uuid("party_profile_id").references(() => profilesTable.id),
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [
    index("ledger_lines_transaction_idx").on(t.transactionId),
    index("ledger_lines_account_party_idx").on(t.account, t.partyProfileId),
    check("ledger_nonzero_amount", sql`${t.amountCents}<>0`),
    check(
      "ledger_account_valid",
      sql`${t.account} in ('platform_cash','customer_funds','restaurant_payable','driver_payable','tax_payable','platform_revenue','restaurant_recovery','driver_recovery','provider_fee')`,
    ),
    check(
      "ledger_party_required",
      sql`((${t.account} in ('restaurant_payable','driver_payable','restaurant_recovery','driver_recovery')) = (${t.partyProfileId} is not null))`,
    ),
  ],
);
