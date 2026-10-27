import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __ironbeatDb?: Db };

function resolveDriver(url: string): "neon" | "pg" {
  const forced = process.env.DB_DRIVER;
  if (forced === "neon" || forced === "pg") return forced;
  try {
    return new URL(url).hostname.endsWith("neon.tech") ? "neon" : "pg";
  } catch {
    return "pg";
  }
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  if (resolveDriver(url) === "neon") {
    return drizzleNeon(neon(url), { schema });
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  // node-postgres exposes the same query-builder surface as neon-http.
  return drizzlePg(pool, { schema }) as unknown as Db;
}

function getDb(): Db {
  globalForDb.__ironbeatDb ??= createDb();
  return globalForDb.__ironbeatDb;
}

/** Lazily connected so `next build` works without a database. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
