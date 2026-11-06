import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    provider: "demo",
    connected: true,
    account_email: "demo-mailbox@inboxledger.local",
    note: "Using the synthetic demo mailbox fallback. Swap in Gmail OAuth to connect a real inbox.",
  });
}
