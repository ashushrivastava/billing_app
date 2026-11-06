import { NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/audit";

export async function GET() {
  return NextResponse.json({ logs: listAuditLogs(20) });
}
