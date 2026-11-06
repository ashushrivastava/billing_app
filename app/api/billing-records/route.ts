import { NextRequest, NextResponse } from "next/server";
import { createBillingRecord, listBillingRecords } from "@/lib/billing-service";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const records = listBillingRecords({ status: status || undefined });
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = createBillingRecord(body);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
