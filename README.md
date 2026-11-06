# InboxLedger

Claude-powered billing inbox operations — a working proof of concept. Claude retrieves billing emails and creates structured records through MCP; InboxLedger persists them in a live, editable web dashboard. **No AI provider keys or API calls exist anywhere in this app.**

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `node:sqlite` (Node's built-in SQLite — no native binary/ABI issues)
- MCP server built on `@modelcontextprotocol/sdk`, stdio transport
- Web app and MCP server share the same database and the same service functions (`lib/billing-service.ts`), so anything Claude creates appears in the dashboard immediately

## Run it

```bash
npm install
npm run dev        # web app at http://localhost:3000
```

The SQLite file is created automatically at `data/inboxledger.db` on first run.

## Connect InboxLedger to Claude (MCP)

This POC uses Claude Desktop's local MCP config with a `stdio` transport — the simplest, most reliable connection method, and it talks to the exact same database file the web app reads.

1. Open Claude Desktop → **Settings → Developer → Edit Config**.
2. Add:

```json
{
  "mcpServers": {
    "inboxledger": {
      "command": "npx",
      "args": ["tsx", "ABSOLUTE_PATH_TO/mcp-server/index.ts"],
      "cwd": "ABSOLUTE_PATH_TO_PROJECT_ROOT"
    }
  }
}
```

(The exact path is also shown on the app's **Settings** page.)

3. Restart Claude Desktop. Five tools appear: `search_billing_emails`, `get_email_message`, `create_billing_record`, `list_billing_records`, `update_billing_record`.

## Demo prompts

```
Find my five most recent invoice or billing emails. Show the sender, subject, date and a short summary. Do not create records yet.
```

```
Take those five invoice emails, extract the available vendor name, invoice number, invoice date, due date, amount, currency and description, and add them to InboxLedger. Do not guess missing fields.
```

```
Find the email from billing@acmecloud.com and add its invoice details to InboxLedger.
```

Then open `http://localhost:3000/billing-records`, open a created record, edit a field, and save — the change persists.

## Email source: demo mailbox

This POC ships with a **clearly labelled synthetic demo mailbox** (`lib/demo-mailbox.ts`, 6 sample emails) rather than live Gmail OAuth, per the spec's documented fallback for a 24-hour build. The MCP tools, validation, and persistence are fully real — only the mailbox is synthetic. Swapping in Gmail OAuth later means implementing `lib/demo-mailbox.ts`'s two functions (`searchDemoMailbox`, `getDemoMessageById`) against the real Gmail API; nothing else in the app changes.

## What's real vs. not

| Real | Not real (POC scope) |
|---|---|
| SQLite-backed billing records, full CRUD | Live Gmail/Outlook OAuth (documented fallback used instead) |
| MCP tools calling the same validated service layer as the web UI | Multi-tenant auth / login |
| Duplicate detection, field validation, audit log | Public HTTPS deployment (run locally for this submission) |
| Editable dashboard, pricing config, team structure config | — |

No `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or any AI provider credential exists in this codebase.
