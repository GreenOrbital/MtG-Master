import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  _pool = new Pool({ connectionString: url });
  _db = drizzle(_pool, { schema });
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    if (!_pool) {
      const url = process.env.DATABASE_URL;
      if (!url) throw new Error("DATABASE_URL must be set.");
      _pool = new Pool({ connectionString: url });
    }
    return (_pool as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export * from "./schema";
