import { getDb } from "./db";
import { logAudit } from "./audit";
import { randomUUID } from "crypto";

const USER_ID = "demo-user";

export interface BillingRecordInput {
  source_message_id?: string | null;
  source_provider?: string | null;
  vendor_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  amount?: number | null;
  currency?: string | null;
  tax_amount?: number | null;
  description?: string | null;
  billing_category?: string | null;
  status?: string | null;
  notes?: string | null;
}

export const VALID_STATUSES = ["Pending", "Paid", "Overdue", "Under Review"];

const EDITABLE_FIELDS = [
  "vendor_name",
  "invoice_number",
  "invoice_date",
  "due_date",
  "amount",
  "currency",
  "tax_amount",
  "description",
  "billing_category",
  "status",
  "notes",
];

export function validateRecordInput(input: BillingRecordInput): string | null {
  if (input.amount !== undefined && input.amount !== null) {
    if (typeof input.amount !== "number" || isNaN(input.amount) || input.amount < 0) {
      return "amount must be a non-negative number";
    }
  }
  if (input.tax_amount !== undefined && input.tax_amount !== null) {
    if (typeof input.tax_amount !== "number" || isNaN(input.tax_amount) || input.tax_amount < 0) {
      return "tax_amount must be a non-negative number";
    }
  }
  for (const dateField of ["invoice_date", "due_date"] as const) {
    const v = input[dateField];
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return `${dateField} must be in YYYY-MM-DD format`;
    }
  }
  if (input.status && !VALID_STATUSES.includes(input.status)) {
    return `status must be one of: ${VALID_STATUSES.join(", ")}`;
  }
  if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    return "currency must be a 3-letter ISO code (e.g. INR, USD)";
  }
  return null;
}

export function findDuplicate(sourceMessageId: string | null | undefined, invoiceNumber: string | null | undefined) {
  if (!sourceMessageId) return null;
  const db = getDb();
  const query = invoiceNumber
    ? db.prepare(
        `SELECT * FROM billing_records WHERE user_id = ? AND source_message_id = ? AND invoice_number = ?`
      )
    : db.prepare(`SELECT * FROM billing_records WHERE user_id = ? AND source_message_id = ? AND invoice_number IS NULL`);
  const row = invoiceNumber
    ? query.get(USER_ID, sourceMessageId, invoiceNumber)
    : query.get(USER_ID, sourceMessageId);
  return row ?? null;
}

export function createBillingRecord(input: BillingRecordInput) {
  const error = validateRecordInput(input);
  if (error) return { error };

  const dup = findDuplicate(input.source_message_id, input.invoice_number);
  if (dup) {
    return { error: "duplicate", duplicate: dup };
  }

  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO billing_records (
      id, user_id, source_provider, source_message_id, vendor_name, invoice_number,
      invoice_date, due_date, amount, currency, tax_amount, description,
      billing_category, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    USER_ID,
    input.source_provider ?? "gmail",
    input.source_message_id ?? null,
    input.vendor_name ?? null,
    input.invoice_number ?? null,
    input.invoice_date ?? null,
    input.due_date ?? null,
    input.amount ?? null,
    input.currency ?? null,
    input.tax_amount ?? null,
    input.description ?? null,
    input.billing_category ?? null,
    input.status ?? "Pending",
    input.notes ?? null,
    now,
    now
  );

  const record = db.prepare("SELECT * FROM billing_records WHERE id = ?").get(id);
  logAudit({ entityType: "billing_record", entityId: id, action: "create", after: record });
  return { record };
}

export function listBillingRecords(filters: { status?: string | null; limit?: number } = {}) {
  const db = getDb();
  const limit = Math.min(filters.limit ?? 50, 100);
  if (filters.status) {
    return db
      .prepare(`SELECT * FROM billing_records WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT ?`)
      .all(USER_ID, filters.status, limit);
  }
  return db
    .prepare(`SELECT * FROM billing_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(USER_ID, limit);
}

export function getBillingRecord(id: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM billing_records WHERE id = ? AND user_id = ?`).get(id, USER_ID);
}

export function updateBillingRecord(id: string, updates: BillingRecordInput) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM billing_records WHERE id = ? AND user_id = ?`).get(id, USER_ID);
  if (!existing) return { error: "not_found" };

  const error = validateRecordInput(updates);
  if (error) return { error };

  const fields = Object.keys(updates).filter((k) => EDITABLE_FIELDS.includes(k));
  if (fields.length === 0) return { error: "no valid fields to update" };

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => (updates as Record<string, unknown>)[f] ?? null) as (string | number | null)[];
  const now = new Date().toISOString();

  db.prepare(`UPDATE billing_records SET ${setClause}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  const updated = db.prepare(`SELECT * FROM billing_records WHERE id = ?`).get(id);
  logAudit({
    entityType: "billing_record",
    entityId: id,
    action: "update",
    before: existing,
    after: updated,
  });
  return { record: updated };
}

export function getOverviewStats() {
  const db = getDb();
  const records = db.prepare(`SELECT * FROM billing_records WHERE user_id = ?`).all(USER_ID) as Array<{
    amount: number | null;
    status: string;
  }>;
  const total = records.length;
  const pendingAmount = records
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const paidAmount = records
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const overdueCount = records.filter((r) => r.status === "Overdue").length;
  return { total, pendingAmount, paidAmount, overdueCount };
}
