# InboxLedger
### Architecture and Implementation Notes

---

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER                                │
│   types a request in their own Claude account (desktop or claude.ai) │
└───────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                               CLAUDE                                 │
│  - Reads the customer's real inbox via their OWN, separately         │
│    connected email integration (Gmail/Outlook connector)             │
│  - Interprets each email: vendor, invoice #, amount, dates           │
│  - Decides which InboxLedger tool to call, with what arguments       │
│  - Customer's own Claude plan pays for all of this reasoning         │
└───────────────────────────────┬───────────────────────────────────┘
                                 │  MCP (JSON-RPC over Streamable HTTP)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOXLEDGER MCP ENDPOINT  (/api/mcp)               │
│         mounted inside the same Next.js app — one deployed URL        │
│                                                                         │
│   search_billing_emails   get_email_message   create_billing_record   │
│   list_billing_records    update_billing_record                       │
│                                                                         │
│   Every tool call runs through the SAME validated service layer       │
│   (lib/billing-service.ts) that the web dashboard's API routes use —  │
│   no tool bypasses validation, duplicate checks, or the audit log.    │
└───────────────┬───────────────────────────────┬───────────────────┘
                │                                 │
                ▼                                 ▼
┌───────────────────────────┐     ┌─────────────────────────────────┐
│   DEMO MAILBOX (POC only)   │     │        SQLite DATABASE           │
│   lib/demo-mailbox.ts       │     │        data/inboxledger.db       │
│   6 synthetic sample emails │     │  billing_records, audit_logs,    │
│   (documented fallback for  │     │  pricing_config, team_config     │
│   a 24-hour build; real     │     └────────────────┬────────────────┘
│   Gmail OAuth is the        │                      │
│   intended production path) │                      │
└───────────────────────────┘                      │
                                                       ▼
                                    ┌─────────────────────────────────┐
                                    │     INBOXLEDGER WEB DASHBOARD     │
                                    │  Overview · Billing Records ·     │
                                    │  Team Structure · Pricing Config  │
                                    │  · Settings                        │
                                    │                                     │
                                    │  A human opens a record Claude     │
                                    │  created, edits it, saves it.      │
                                    │  Every change is audit-logged.     │
                                    └─────────────────────────────────┘
```

**Key architectural decision:** the MCP server is not a separate deployment. It is mounted as a route (`app/api/mcp/route.ts`) inside the same Next.js application that serves the dashboard, using the MCP SDK's Web-Standard Streamable HTTP transport (built on the Fetch `Request`/`Response` API, which is exactly what Next.js route handlers use). This means one deployed URL, one running process, one database — Claude's writes are immediately visible in the dashboard with no sync step.

---

## 2. Data Flow (Step by Step)

1. **Read.** The customer's email account is connected to Claude through Claude's own, separate email integration — not through InboxLedger. InboxLedger never sees raw mailbox credentials.
2. **Interpret.** Claude reads the relevant emails and extracts billing fields. Any field it cannot confidently determine is left `null`, never guessed, per explicit tool-description instructions.
3. **Write.** Claude calls `create_billing_record` (or `update_billing_record`) on InboxLedger's MCP endpoint, passing only structured, already-interpreted data.
4. **Validate & persist.** InboxLedger's service layer validates types, dates, currency codes and status values; checks for a duplicate on `(source_message_id, invoice_number)`; writes the row; and appends an audit log entry. This is identical code whether the write came from Claude (MCP) or a human (web API) — the validation path cannot be bypassed from either side.
5. **Display.** The web dashboard reads the same SQLite database directly, so the new or updated record appears on next page load/refresh — no polling, no webhook, no cache to invalidate.
6. **Edit.** A human opens the record in the Billing Records screen, corrects or completes it, and saves. This goes through the same `PATCH /api/billing-records/:id` → `updateBillingRecord()` path, so it is equally validated and equally audit-logged.
7. **(Demo-mailbox path only)** For the `search_billing_emails` / `get_email_message` tools specifically, the "mailbox" Claude reads from in this POC is a synthetic, clearly labelled demo mailbox (6 sample emails), not a live inbox. This affects *only* those two tools — `create_billing_record`, `list_billing_records` and `update_billing_record` operate on fully real, persisted data regardless.

---

## 3. Responsibility Split

| Responsibility | Claude (the customer's AI) | InboxLedger (this app) |
|---|---|---|
| Reading and authenticating against the customer's real email | ✅ via the customer's own, separately connected email integration | ❌ never touches real mailbox credentials |
| Interpreting unstructured email text into billing fields | ✅ all extraction, summarization and judgment | ❌ no AI/model calls exist in this codebase |
| Deciding which record to create/update and with what values | ✅ | ❌ |
| Validating field types, formats, and business rules | ❌ | ✅ (`lib/billing-service.ts`) |
| Duplicate detection | ❌ | ✅ (`source_message_id` + `invoice_number`) |
| Persisting data durably across sessions | ❌ (a chat ends; nothing is kept) | ✅ (SQLite, independent of any chat) |
| Presenting an editable, human-usable interface | ❌ | ✅ (the dashboard) |
| Enforcing who can edit what | n/a in this POC | Partially — single workspace, no per-user auth yet (see Limitations) |
| Audit trail of changes | ❌ | ✅ (`audit_logs` table) |
| Paying for AI inference | ✅ the customer's own Claude/ChatGPT plan | ✅ pays **nothing** — no model API calls anywhere |

This split is the core of the assignment's premise: Claude is the thinking layer the customer already pays for; InboxLedger is the persistence, validation and interface layer that keeps the result useful after the conversation ends.

---

## 4. Tools Used

- **Next.js (App Router) + TypeScript + Tailwind CSS** — the web dashboard and all HTTP API routes.
- **`node:sqlite`** (Node's built-in SQLite module) — chosen after `better-sqlite3`'s native binary segfaulted in this environment; the built-in driver removes that entire class of native-binary/ABI risk for a POC.
- **`@modelcontextprotocol/sdk`** — both transports used:
  - `WebStandardStreamableHTTPServerTransport` for the remote, deployed `/api/mcp` endpoint.
  - `StdioServerTransport` for an optional local-only connection method.
- **`zod`** — input validation for every MCP tool argument before it reaches the service layer.
- **Render** — hosting for the deployed web service (free tier, Node runtime).
- **Git/GitHub** — version control and the delivered source.

No AI/LLM provider SDK, API key, or client (Anthropic, OpenAI, or otherwise) exists anywhere in this repository.

---

## 5. Assumptions

- The customer already has Claude (or another MCP-capable AI client) connected to their own email account through that client's native integration; InboxLedger is not responsible for that connection.
- A single shared workspace is sufficient for this evaluation — the assignment calls for one evaluator to exercise the workflow, not multiple simultaneous tenants.
- Ephemeral storage is acceptable for this submission; the evaluator was told explicitly that data may reset between sessions on the free hosting tier.
- "Live on the internet" is satisfied by a standard web deployment reachable over HTTPS; a custom domain was not required.
- Currency, date and status formats follow the conventions documented in each MCP tool's description, and Claude is expected to follow them when calling the tools.

---

## 6. Limitations (What We Built vs. the Proposed Production System)

| Area | What we built (this POC) | Proposed production system |
|---|---|---|
| Email source | A synthetic, clearly labelled demo mailbox (6 sample emails) | Real Gmail/Outlook OAuth, read-only scopes, server-stored encrypted refresh tokens |
| MCP authentication | None — endpoint is open by design for single-workspace evaluation | Per-workspace API key or OAuth-protected connector, so only an authorized customer's Claude can read/write their own data |
| Tenancy | Single hardcoded workspace (`user_id = "demo-user"`) | Multi-tenant: each customer's workspace fully isolated, enforced server-side on every query |
| Database | SQLite, file-based, no persistent disk on the current hosting tier | Managed Postgres (or equivalent) with backups and a persistent volume |
| Department/client routing | Not built — `billing_category` field exists but no routing logic | Automatic routing of each record to a department/client queue based on sender or configuration |
| Supervisor assignment | Not built — Team Structure page configures capacity only (employees-per-supervisor, supervisors-per-manager), with no per-record assignment | Each record assigned to an accountable reviewer, reassignable from the record itself |
| Price-change detection | Not built — duplicate detection exists but does not diff values | Compare each new invoice from a vendor/client against their last one and flag price or term changes automatically |
| Payment loop | Not built | WhatsApp Business API notification to the end customer with an invoice summary and a payment link/QR code, closing inbox → cash |
| Access control in the UI | None — the dashboard is a single open workspace | Authenticated login, role-based access (owner/admin vs. reviewer), pricing config restricted to owners only |

Nothing in the table above is misrepresented as already working — the **Settings** page and this document both state plainly that the demo mailbox is synthetic and the MCP endpoint is unauthenticated, so the evaluator can distinguish the proven mechanism (Claude → MCP → persisted, editable record) from the scope still to be built.

---

## 7. Next Steps

1. Replace the demo mailbox with real Gmail OAuth (the integration point is isolated to two functions in `lib/demo-mailbox.ts`, so nothing else in the app changes).
2. Add a lightweight bearer-token or OAuth check on `/api/mcp` once this moves beyond single-evaluator use.
3. Move from SQLite to a managed Postgres instance with persistent storage.
4. Add department/client routing and per-record supervisor assignment on top of the existing Team Structure configuration.
5. Add price-change detection by extending the existing duplicate-check logic to diff amounts across a vendor's/client's invoice history.
6. Build the WhatsApp notification + payment-link module, triggered from a record's status change.
7. Add authenticated, multi-tenant login so each customer's workspace is fully isolated.

---

## 8. What Is Proven Today

The full loop — a request typed in Claude → Claude reading real invoice content → a structured record created through InboxLedger's MCP tool → the record appearing immediately in a live, human-editable dashboard → a person editing and saving it — has been run end-to-end and verified, including duplicate-record rejection. This is the mechanism every feature in the production roadmap above is built on top of; it is not a mockup.
