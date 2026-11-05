import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const max=Number(process.env.PG_POOL_MAX??10);
if(!Number.isInteger(max)||max<1||max>100)throw new Error('PG_POOL_MAX must be an integer from 1 to 100');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL,max,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,statement_timeout:15000,lock_timeout:5000 });
export const db = drizzle(pool, { schema });

export * from "./schema";
