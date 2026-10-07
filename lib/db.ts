import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";

function hashPwd(pwd: string): string {
  return crypto.createHash("sha256").update("fd$" + pwd).digest("hex");
}

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "freightdesk.db");

// Singleton: survive hot reloads and keep a single connection per process.
// eslint-disable-next-line
declare global {
  // eslint-disable-next-line
  var __db: Database.Database | undefined;
}

function migrate(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS session_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  mobile TEXT,
  mobile2 TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  email TEXT,
  credit_limit REAL NOT NULL DEFAULT 0,
  opening_balance REAL NOT NULL DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  opening_balance REAL NOT NULL DEFAULT 0,
  payment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL
);

-- commission_type: PER_PARCEL|PER_KG|FIXED|PERCENT|SLAB
CREATE TABLE IF NOT EXISTS rate_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  name TEXT NOT NULL,
  commission_type TEXT NOT NULL,
  commission_value REAL NOT NULL,          -- per-parcel ₹, per-kg ₹, fixed ₹, %, slab @ value/kg
  min_weight REAL NOT NULL DEFAULT 0,
  max_weight REAL NOT NULL DEFAULT 0,      -- 0 = no upper bound
  active INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  created_at TEXT NOT NULL
);

-- Rate history: never overwrite old rates. When a rate is edited (or statuses change)
-- we insert a new row with a new valid_from.
CREATE TABLE IF NOT EXISTS rate_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate_id INTEGER NOT NULL REFERENCES rate_configs(id),
  commission_type TEXT NOT NULL,
  commission_value REAL NOT NULL,
  min_weight REAL NOT NULL DEFAULT 0,
  max_weight REAL NOT NULL DEFAULT 0,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  source TEXT NOT NULL DEFAULT 'INITIAL',
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS bilty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bilty_no TEXT UNIQUE NOT NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'BOOKED',
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  sender_name TEXT NOT NULL, sender_mobile TEXT, sender_address TEXT,
  receiver_name TEXT NOT NULL, receiver_mobile TEXT, receiver_address TEXT,
  from_city TEXT NOT NULL, to_city TEXT NOT NULL,
  parcel_type TEXT NOT NULL,
  parcel_count INTEGER NOT NULL,
  actual_weight REAL NOT NULL,
  chargeable_weight REAL NOT NULL,
  rate_config_id INTEGER REFERENCES rate_configs(id),
  company_rate REAL NOT NULL,  -- we charge the customer
  vendor_rate REAL NOT NULL,   -- we pay the vendor
  freight REAL NOT NULL DEFAULT 0,
  loading_charge REAL NOT NULL DEFAULT 0,
  unloading_charge REAL NOT NULL DEFAULT 0,
  other_charges REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  cod_amount REAL NOT NULL DEFAULT 0,
  payment_mode TEXT,
  remarks TEXT,
  -- calculated
  customer_amount REAL NOT NULL,   -- company_rate * chargeable_weight
  vendor_amount REAL NOT NULL,     -- vendor_rate * chargeable_weight
  commission REAL NOT NULL,
  total_charges REAL NOT NULL,     -- customer_amount + loading + unloading + other - discount
  vendor_cost REAL NOT NULL,       -- vendor_amount + loading + unloading + other
  gross_margin REAL NOT NULL,      -- customer_amount - vendor_amount
  net_amount REAL NOT NULL,        -- total_charges - vendor_cost (profit)
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bilty_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bilty_id INTEGER NOT NULL REFERENCES bilty(id),
  status TEXT NOT NULL,
  at TEXT NOT NULL,
  by TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bilty_id INTEGER NOT NULL REFERENCES bilty(id),
  dispatch_date TEXT NOT NULL,
  vehicle_no TEXT NOT NULL,
  driver TEXT NOT NULL,
  manifest_no TEXT NOT NULL,
  route TEXT,
  dispatch_branch TEXT,
  remarks TEXT,
  dispatched_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT
);
`);
}

function getDb(): Database.Database {
  if (global.__db) return global.__db;
  const db = new Database(DB_PATH);
  migrate(db);
  seed(db);
  global.__db = db;
  return db;
}

// Shared instance for route handlers (server only).
export const db = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const d = getDb();
    const v = Reflect.get(d as object, prop);
    return typeof v === "function" ? v.bind(d) : v;
  },
});

function seed(db: Database.Database) {
  const hasUsers = db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number };
  if (hasUsers.c > 0) return;

  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)").run(
    "admin", hashPwd("admin123"), "Administrator", "SUPER_ADMIN"
  );
  db.prepare("INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)").run(
    "booking", hashPwd("booking123"), "Booking Counter", "BOOKING_STAFF"
  );
  db.prepare("INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)").run(
    "viewer", hashPwd("viewer123"), "Auditor (read-only)", "VIEWER"
  );

  const insVendor = db.prepare(`
    INSERT INTO vendors (code,name,company,mobile,city,state,gstin,payment_terms,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  insVendor.run("V001", "Sharma Roadlines", "Sharma Roadlines Pvt Ltd", "9810011111", "Delhi", "DL", "07AABCS1429B1Z1", "30 days", now);
  insVendor.run("V002", "Patel Transport", "Patel Transport Co", "9820022222", "Mumbai", "MH", "27AABCP1234C1Z2", "on delivery", now);

  const insRate = db.prepare(`
    INSERT INTO rate_configs (vendor_id,name,commission_type,commission_value,min_weight,max_weight,valid_from,valid_to,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  const insRateHistory = db.prepare(`
    INSERT INTO rate_history (rate_id,commission_type,commission_value,min_weight,max_weight,valid_from,source)
    VALUES (?,?,?,?,?,?,?)`);
  // Sharma: SLAB ₹8/kg up to 100kg, ₹6/kg above (vendor pays 80%). Patel: PER_KG ₹7.
  const r1 = insRate.run(1, "Upto 100kg", "SLAB", 8, 0, 100, "2020-01-01", null, now);
  insRateHistory.run(r1.lastInsertRowid, "SLAB", 8, 0, 100, "2020-01-01", "INITIAL");
  const r2 = insRate.run(1, "Above 100kg", "SLAB", 6, 100.001, 0, "2020-01-01", null, now);
  insRateHistory.run(r2.lastInsertRowid, "SLAB", 6, 100.001, 0, "2020-01-01", "INITIAL");
  const r3 = insRate.run(2, "Standard", "PER_KG", 7, 0, 0, "2020-01-01", null, now);
  insRateHistory.run(r3.lastInsertRowid, "PER_KG", 7, 0, 0, "2020-01-01", "INITIAL");

  const insCustomer = db.prepare(`
    INSERT INTO customers (code,name,company,mobile,address,city,state,pincode,gstin,email,credit_limit,payment_terms,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  insCustomer.run("C001", "Anand Traders", "Anand Traders Pvt Ltd", "9900112233", "12, Karol Bagh", "Delhi", "DL", "110005", "07AAACA1111B1Z9", "anand@example.com", 50000, "15 days", now);
  insCustomer.run("C002", "Mehta Distributors", "Mehta Distributors", "9900445566", "88, MG Road", "Gurgaon", "HR", "122001", "06AAACM2222C1Z3", "mehta@example.com", 25000, "COD", now);
}

// Keep in sync with the UI enum
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

export function getDbInstance() {
  return getDb();
}
