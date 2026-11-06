#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { searchDemoMailbox, getDemoMessageById } from "../lib/demo-mailbox";
import {
  createBillingRecord,
  listBillingRecords,
  updateBillingRecord,
  VALID_STATUSES,
} from "../lib/billing-service";

const server = new Server(
  { name: "inboxledger", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const SearchEmailsInput = z.object({
  query: z.string().nullable().optional(),
  sender: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  after: z.string().nullable().optional(),
  before: z.string().nullable().optional(),
  limit: z.number().int().positive().max(20).optional(),
});

const GetEmailInput = z.object({
  message_id: z.string(),
});

const CreateRecordInput = z.object({
  source_message_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  tax_amount: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  billing_category: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ListRecordsInput = z.object({
  status: z.string().nullable().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const UpdateRecordInput = z.object({
  record_id: z.string(),
  updates: z.record(z.string(), z.unknown()),
});

function textResult(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_billing_emails",
      description:
        "Search the connected mailbox for likely invoices, bills, receipts and billing-related messages. Does not create billing records. Returns provider message IDs for later retrieval.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search, e.g. 'invoice OR billing'" },
          sender: { type: "string", description: "Filter by sender address or domain" },
          subject: { type: "string", description: "Filter by subject substring" },
          after: { type: "string", description: "ISO date, only messages received after this" },
          before: { type: "string", description: "ISO date, only messages received before this" },
          limit: { type: "number", description: "Max results, default 5, max 20" },
        },
      },
    },
    {
      name: "get_email_message",
      description: "Retrieve one exact email by its provider message ID after it has been found via search_billing_emails.",
      inputSchema: {
        type: "object",
        properties: {
          message_id: { type: "string" },
        },
        required: ["message_id"],
      },
    },
    {
      name: "create_billing_record",
      description:
        "Persist a structured billing record prepared by Claude into InboxLedger. Missing fields should be left null, never guessed. Duplicate (source_message_id + invoice_number) pairs are rejected.",
      inputSchema: {
        type: "object",
        properties: {
          source_message_id: { type: "string" },
          vendor_name: { type: "string" },
          invoice_number: { type: "string" },
          invoice_date: { type: "string", description: "YYYY-MM-DD" },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          amount: { type: "number" },
          currency: { type: "string", description: "3-letter ISO code, e.g. INR, USD" },
          tax_amount: { type: "number" },
          description: { type: "string" },
          billing_category: { type: "string" },
          status: { type: "string", enum: VALID_STATUSES },
          notes: { type: "string" },
        },
      },
    },
    {
      name: "list_billing_records",
      description: "List billing records already stored in InboxLedger for the authenticated workspace.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: VALID_STATUSES },
          limit: { type: "number" },
        },
      },
    },
    {
      name: "update_billing_record",
      description:
        "Update an existing billing record's editable fields (vendor_name, invoice_number, invoice_date, due_date, amount, currency, tax_amount, description, billing_category, status, notes).",
      inputSchema: {
        type: "object",
        properties: {
          record_id: { type: "string" },
          updates: { type: "object" },
        },
        required: ["record_id", "updates"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_billing_emails": {
        const input = SearchEmailsInput.parse(args ?? {});
        const messages = searchDemoMailbox({
          query: input.query ?? null,
          sender: input.sender ?? null,
          subject: input.subject ?? null,
          after: input.after ?? null,
          before: input.before ?? null,
          limit: input.limit ?? 5,
        });
        return textResult({ messages, count: messages.length });
      }

      case "get_email_message": {
        const input = GetEmailInput.parse(args);
        const message = getDemoMessageById(input.message_id);
        if (!message) {
          return textResult({ error: "message_not_found" });
        }
        return textResult({ message });
      }

      case "create_billing_record": {
        const input = CreateRecordInput.parse(args ?? {});
        const result = createBillingRecord(input);
        if ("error" in result) {
          return textResult(result);
        }
        return textResult({ created: true, record: result.record });
      }

      case "list_billing_records": {
        const input = ListRecordsInput.parse(args ?? {});
        const records = listBillingRecords({ status: input.status ?? undefined, limit: input.limit });
        return textResult({ records, count: records.length });
      }

      case "update_billing_record": {
        const input = UpdateRecordInput.parse(args);
        const result = updateBillingRecord(input.record_id, input.updates);
        if ("error" in result) {
          return textResult(result);
        }
        return textResult({ updated: true, record: result.record });
      }

      default:
        return textResult({ error: `unknown_tool: ${name}` });
    }
  } catch (err) {
    return textResult({ error: err instanceof Error ? err.message : "unknown_error" });
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("InboxLedger MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
