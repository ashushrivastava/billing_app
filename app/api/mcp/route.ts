import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createInboxLedgerServer } from "@/lib/mcp-tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stateless: a fresh Server + transport per request. Simple and safe for a
// single-workspace POC — no session state to lose between requests, and it
// works regardless of how many server instances are behind the deployment.
async function handle(req: Request): Promise<Response> {
  const server = createInboxLedgerServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  const res = await transport.handleRequest(req);

  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Mcp-Protocol-Version");
  return res;
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Mcp-Protocol-Version",
    },
  });
}
