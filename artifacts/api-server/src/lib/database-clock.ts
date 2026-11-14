import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
// Due times default to PostgreSQL's clock. Comparing them with an application
// host's clock can delay claims or cause premature lease takeover under skew.
export async function databaseNow(executor: Pick<typeof db, "execute"> = db) {
  const result = await executor.execute<{ now: Date }>(
    sql`select clock_timestamp() as now`,
  );
  return new Date(result.rows[0].now);
}
