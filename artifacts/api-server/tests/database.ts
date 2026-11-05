import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { drizzle as postgresDrizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../../lib/db/src/schema";
// GitHub CI uses real PostgreSQL with multiple connections. The local fallback
// runs the same migrations/HTTP tests using PostgreSQL compiled to WebAssembly.
const pool = process.env.TEST_DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      statement_timeout: 15000,
    })
  : null;
const embedded = pool ? null : new PGlite();
export const engine = pool
  ? { exec: (sql: string) => pool.query(sql), close: () => pool.end() }
  : embedded!;
export const db = pool
  ? postgresDrizzle(pool, { schema })
  : pgliteDrizzle(embedded!, { schema });
export * from "../../../lib/db/src/schema";
