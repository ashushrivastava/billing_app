# InboxLedger

Claude-powered billing inbox operations — a working proof of concept. Claude retrieves billing emails and creates structured records through MCP; InboxLedger persists them in a live, editable web dashboard. **No AI provider keys or API calls exist anywhere in this app.**

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `node:sqlite` (Node's built-in SQLite — no native binary/ABI issues)
- MCP server built on `@modelcontextprotocol/sdk`, exposed two ways from the same tool definitions (`lib/mcp-tools.ts`):
  - **Remote, stateless HTTP** at `/api/mcp` — mounted inside this Next.js app, so the deployed URL itself is the MCP endpoint. No separate service or local process required.
  - **Local stdio** (`mcp-server/index.ts`) — for running everything on your own machine instead of a deployed link.
- Web app and both MCP transports share the same database and the same service functions (`lib/billing-service.ts`), so anything Claude creates appears in the dashboard immediately.

## Run it locally

```bash
npm install
npm run dev        # web app + MCP endpoint at http://localhost:3000
```

The SQLite file is created automatically at `data/inboxledger.db` on first run.

## Deploying

Deploys as a single standard Next.js web service (tested on Render's free tier):

- **Build command:** `npm install && npm run build`
- **Start command:** `npm run start` (reads the `PORT` env var automatically — no extra flags needed)
- **Health check path:** `/healthz`

**Free-tier caveat:** there's no persistent disk on Render's free plan, so the SQLite file resets whenever the instance spins down or redeploys. Fine for a live evaluation/demo; move to a hosted Postgres or a paid plan with a persistent disk before trusting it with real data.

## Connect InboxLedger to Claude

### Remote (recommended — works from the deployed link, no local setup)

The deployed app's own **Settings** page shows this automatically, built from the live request:

1. In Claude (desktop or claude.ai) → **Settings → Connectors → Add custom connector**.
2. Paste: `https://YOUR-DEPLOYED-URL/api/mcp`
3. Save and enable it. Five tools appear: `search_billing_emails`, `get_email_message`, `create_billing_record`, `list_billing_records`, `update_billing_record`.

This endpoint is **intentionally unauthenticated** — a deliberate simplification for this single-workspace evaluation build, so anyone with the link can read/write this workspace's records. Don't reuse it for real customer data without adding an access token.

### Local (alternative — only if running on your own machine)

1. Open Claude Desktop → **Settings → Desktop app → Extensions → Local MCP servers → Edit config**.
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

(The exact path is also shown on the app's Settings page.)

3. Restart Claude Desktop.

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

If your email account is already connected to Claude separately (Gmail/Outlook), Claude will use that existing connection to read real invoices, and only calls InboxLedger's tools to create/update records — the two connections work together in the same chat.

Then open `/billing-records` on the deployed app (or `http://localhost:3000/billing-records` locally), open a created record, edit a field, and save — the change persists.

## Email source: demo mailbox

This POC ships with a **clearly labelled synthetic demo mailbox** (`lib/demo-mailbox.ts`, 6 sample emails) rather than live Gmail OAuth, per the spec's documented fallback for a 24-hour build. The MCP tools, validation, and persistence are fully real — only the mailbox is synthetic. Swapping in Gmail OAuth later means implementing `lib/demo-mailbox.ts`'s two functions (`searchDemoMailbox`, `getDemoMessageById`) against the real Gmail API; nothing else in the app changes.

## What's real vs. not

| Real | Not real (POC scope) |
|---|---|
| SQLite-backed billing records, full CRUD | Live Gmail/Outlook OAuth (documented fallback used instead) |
| MCP tools (remote HTTP + local stdio) calling the same validated service layer as the web UI | Multi-tenant auth / login, access tokens on the MCP endpoint |
| Duplicate detection, field validation, audit log | Persistent storage on Render's free tier (resets on spin-down/redeploy) |
| Editable dashboard, pricing config, team structure config | — |
| Public HTTPS deployment with a directly connectable MCP endpoint | — |

No `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or any AI provider credential exists in this codebase.
