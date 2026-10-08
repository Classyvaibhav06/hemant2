import path from "path";
import { spawnSync } from "child_process";

const NEON_CONN_STR =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_YMLfJWBk41nw@ep-dark-smoke-a5bia8cy.us-east-2.aws.neon.tech/freightdesk?sslmode=require";

export interface Statement<T = any> {
  all(...params: any[]): T[];
  get(...params: any[]): T | undefined;
  run(...params: any[]): { lastInsertRowid: number | bigint; changes: number };
}

export interface DatabaseInterface {
  prepare<T = any>(sql: string): Statement<T>;
  exec(sql: string): void;
  pragma(pragmaStr: string): void;
  transaction<F extends (...args: any[]) => any>(fn: F): F;
}

function parseHostAndPath(connStr: string) {
  try {
    const url = new URL(connStr.replace(/^postgres(ql)?:/, "https:"));
    return {
      hostname: url.hostname,
      pathname: "/sql",
    };
  } catch {
    return {
      hostname: "ep-dark-smoke-a5bia8cy.us-east-2.aws.neon.tech",
      pathname: "/sql",
    };
  }
}

const { hostname, pathname } = parseHostAndPath(NEON_CONN_STR);

function convertQuestionMarksToDollars(sql: string): string {
  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let out = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      out += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      out += char;
    } else if (char === "?" && !inSingleQuote && !inDoubleQuote) {
      out += "$" + paramIndex++;
    } else {
      out += char;
    }
  }
  return out;
}

function executeNeonSync(sql: string, params: any[] = []): any {
  const pgSql = convertQuestionMarksToDollars(sql);
  const payload = Buffer.from(JSON.stringify({ query: pgSql, params }));

  const runner = `
    const https = require('https');
    const req = https.request({
      hostname: process.env.NEON_HOST,
      path: process.env.NEON_PATH,
      method: 'POST',
      family: 4,
      headers: {
        'Neon-Connection-String': process.env.NEON_CONN,
        'Content-Type': 'application/json'
      }
    }, (res) => res.pipe(process.stdout));
    process.stdin.pipe(req);
  `;

  const child = spawnSync("node", ["-e", runner], {
    input: payload,
    env: {
      ...process.env,
      NEON_HOST: hostname,
      NEON_PATH: pathname,
      NEON_CONN: NEON_CONN_STR,
    },
    maxBuffer: 20 * 1024 * 1024,
  });

  if (child.error) {
    throw child.error;
  }

  const raw = child.stdout.toString().trim();
  if (!raw) {
    const err = child.stderr.toString().trim();
    throw new Error(`Neon SQL error: ${err || "Empty response"}`);
  }

  const result = JSON.parse(raw);
  if (result.message && !result.rows) {
    throw new Error(`Neon database error: ${result.message}`);
  }

  return result;
}

function createNeonDb(): DatabaseInterface {
  return {
    pragma(_p: string) {},
    exec(sql: string) {
      executeNeonSync(sql);
    },
    transaction<F extends (...args: any[]) => any>(fn: F): F {
      return ((...args: any[]) => {
        return fn(...args);
      }) as F;
    },
    prepare<T = any>(sql: string): Statement<T> {
      let runSql = sql.trim();
      const isInsert = /^insert\s+/i.test(runSql);

      let insertWithReturning = runSql;
      if (isInsert && !/returning\s+/i.test(runSql)) {
        insertWithReturning = `${runSql.replace(/;+\s*$/, "")} RETURNING id`;
      }

      return {
        all(...args: any[]): T[] {
          const res = executeNeonSync(runSql, args);
          return (res.rows || []) as T[];
        },
        get(...args: any[]): T | undefined {
          const res = executeNeonSync(runSql, args);
          return (res.rows && res.rows[0]) ? (res.rows[0] as T) : undefined;
        },
        run(...args: any[]): { lastInsertRowid: number; changes: number } {
          const res = executeNeonSync(insertWithReturning, args);
          const lastId = res.rows?.[0]?.id ?? 0;
          return {
            lastInsertRowid: Number(lastId),
            changes: res.rowCount ?? 0,
          };
        },
      };
    },
  };
}

// Global instance to survive hot reload
declare global {
  var __db: DatabaseInterface | undefined;
}

function getDb(): DatabaseInterface {
  if (global.__db) return global.__db;
  const database = createNeonDb();
  global.__db = database;
  return database;
}

export const db: DatabaseInterface = new Proxy({} as DatabaseInterface, {
  get(_t, prop) {
    const d = getDb();
    const v = Reflect.get(d as object, prop);
    return typeof v === "function" ? v.bind(d) : v;
  },
});

export const BILTY_STATUSES = [
  "BOOKED",
  "DISPATCHED",
  "IN_TRANSIT",
  "AT_DESTINATION",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "UNDELIVERED",
] as const;

export type BiltyStatus = (typeof BILTY_STATUSES)[number];

export function getDbInstance(): DatabaseInterface {
  return getDb();
}
