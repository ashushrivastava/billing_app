import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "inboxledger.db");

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  ensureDataDir();
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  migrate(db);
  return db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS billing_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'demo-user',
      source_provider TEXT,
      source_message_id TEXT,
      vendor_name TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      due_date TEXT,
      amount REAL,
      currency TEXT,
      tax_amount REAL,
      description TEXT,
      billing_category TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'demo-user',
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_config (
      id TEXT PRIMARY KEY,
      service_name TEXT NOT NULL,
      internal_rate REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_config (
      id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL DEFAULT 'Billing Operations',
      employees_per_supervisor INTEGER NOT NULL DEFAULT 5,
      supervisors_per_manager INTEGER NOT NULL DEFAULT 5,
      updated_at TEXT NOT NULL
    );
  `);

  const row = d.prepare("SELECT id FROM team_config WHERE id = 'default'").get();
  if (!row) {
    d.prepare(
      `INSERT INTO team_config (id, team_name, employees_per_supervisor, supervisors_per_manager, updated_at)
       VALUES ('default', 'Billing Operations', 5, 5, ?)`
    ).run(new Date().toISOString());
  }

  const pricingCount = d.prepare("SELECT COUNT(*) as c FROM pricing_config").get() as { c: number };
  if (pricingCount.c === 0) {
    const now = new Date().toISOString();
    const seed = d.prepare(
      `INSERT INTO pricing_config (id, service_name, internal_rate, unit, notes, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    );
    seed.run(randomUUID(), "Invoice processing", 25, "Per invoice", "", now, now);
    seed.run(randomUUID(), "Billing operations", 500, "Per month", "", now, now);
  }

  const recordCount = d.prepare("SELECT COUNT(*) as c FROM billing_records").get() as { c: number };
  if (recordCount.c === 0) {
    const now = new Date().toISOString();
    const seedRecord = d.prepare(
      `INSERT INTO billing_records (
        id, user_id, source_provider, source_message_id, vendor_name, invoice_number,
        invoice_date, due_date, amount, currency, tax_amount, description,
        billing_category, status, notes, created_at, updated_at
      ) VALUES (?, 'demo-user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    // Distinct from the demo-mailbox messages/invoice numbers so they never collide
    // with duplicate-detection when Claude actually creates records during a demo.
    const seedNotes = "Sample record shown as created via Claude, for demo purposes.";
    const sample: Array<[string, string, string, string, number, string, string, string]> = [
      ["Northwind Hosting", "NW-1183", "2026-10-15", "2026-11-14", 18500, "Software", "Annual hosting renewal", "Pending"],
      ["Keystone Stationers", "KS-2042", "2026-10-20", "2026-11-05", 3200, "Supplies", "Quarterly office supplies", "Paid"],
      ["Everline Freight", "EF-7701", "2026-10-28", "2026-10-28", 9600, "Logistics", "October freight charges", "Overdue"],
    ];
    for (const [vendor, invoiceNo, invDate, dueDate, amount, category, desc, status] of sample) {
      seedRecord.run(
        randomUUID(), "claude", null, vendor, invoiceNo, invDate, dueDate, amount, "INR", null, desc, category, status, seedNotes, now, now
      );
    }
  }
}
