import { getDb } from "./db";
import { randomUUID } from "crypto";

export function logAudit(params: {
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, before_json, after_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    params.userId ?? "demo-user",
    params.entityType,
    params.entityId,
    params.action,
    params.before !== undefined ? JSON.stringify(params.before) : null,
    params.after !== undefined ? JSON.stringify(params.after) : null,
    new Date().toISOString()
  );
}

export function listAuditLogs(limit = 20) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}
