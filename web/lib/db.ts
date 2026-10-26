import postgres from "postgres";

// One pool per server process; dev hot reloads keep reusing it.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? "postgres:///appcrawl", {
    max: 10,
    types: {
      // int8 columns (counts, installs) fit comfortably in a JS number.
      bigint: { to: 20, from: [20], parse: (value: string) => Number(value), serialize: (value: number) => String(value) },
    },
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
