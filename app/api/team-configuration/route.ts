import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const config = db.prepare(`SELECT * FROM team_config WHERE id = 'default'`).get();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE team_config SET team_name = ?, employees_per_supervisor = ?, supervisors_per_manager = ?, updated_at = ? WHERE id = 'default'`
  ).run(body.team_name ?? "Billing Operations", body.employees_per_supervisor ?? 5, body.supervisors_per_manager ?? 5, now);
  const config = db.prepare(`SELECT * FROM team_config WHERE id = 'default'`).get();
  return NextResponse.json({ config });
}
