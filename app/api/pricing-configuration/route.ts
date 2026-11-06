import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM pricing_config ORDER BY created_at ASC`).all();
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.service_name || typeof body.internal_rate !== "number" || !body.unit) {
    return NextResponse.json({ error: "service_name, internal_rate, unit are required" }, { status: 400 });
  }
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO pricing_config (id, service_name, internal_rate, unit, notes, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, body.service_name, body.internal_rate, body.unit, body.notes ?? null, body.active === false ? 0 : 1, now, now);
  const item = db.prepare(`SELECT * FROM pricing_config WHERE id = ?`).get(id);
  return NextResponse.json({ item }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM pricing_config WHERE id = ?`).get(body.id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE pricing_config SET service_name = ?, internal_rate = ?, unit = ?, notes = ?, active = ?, updated_at = ? WHERE id = ?`
  ).run(
    body.service_name,
    body.internal_rate,
    body.unit,
    body.notes ?? null,
    body.active === false ? 0 : 1,
    now,
    body.id
  );
  const item = db.prepare(`SELECT * FROM pricing_config WHERE id = ?`).get(body.id);
  return NextResponse.json({ item });
}
