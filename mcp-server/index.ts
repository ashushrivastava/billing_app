#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createInboxLedgerServer } from "../lib/mcp-tools";

async function main() {
  const server = createInboxLedgerServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("InboxLedger MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
