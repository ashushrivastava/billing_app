import { NextRequest, NextResponse } from "next/server";
import { getBillingRecord, updateBillingRecord } from "@/lib/billing-service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getBillingRecord(id);
  if (!record) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ record });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = updateBillingRecord(id, body);
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
