# InboxLedger
### Claude-Powered Billing Inbox Operations — Strategy & Execution

---

## Page 1 — Business Strategy

### The Problem

Businesses that invoice at volume — and businesses that *receive* invoices at volume — share the same operational headache: billing information lives scattered across email. A single shared mailbox (`billing@company.com`) routinely receives dozens of invoices, receipts, and payment notices a week, mixed from many vendors or many clients, with no structure. Someone has to manually open each email, read it, decide which department or client it belongs to, and re-key it into a spreadsheet or finance tool. This is slow, error-prone, and gets worse as the business grows — and when a vendor or client discreetly changes a price, adds a new approver, or updates billing terms, nobody notices until a payment dispute happens.

Finance and operations teams don't need another AI tool to summarize an email — they already have Claude for that. What they lack is a system of record: somewhere that interpretation permanently lands, is correctly routed, stays editable by a human, and connects downstream to supervisors and payment.

### The Idea

**InboxLedger turns a shared billing inbox into a structured, routed, department-aware billing register — operated through Claude.**

A customer (or their finance team) asks Claude, in plain language, to go through their connected mailbox: *"Find this week's invoices and route them."* Claude reads the mailbox (via the customer's own already-connected email integration), identifies the vendor/client, the amount, and any changes versus the last invoice from that sender, and calls InboxLedger's MCP tools to create or update a structured billing record. InboxLedger does the rest: it slots the record into the correct department queue, flags price changes automatically, assigns it to the right supervisor for approval, and — optionally — triggers a WhatsApp notification to the end customer with a payment link.

The customer's own Claude plan pays for every bit of reading, reasoning and writing. InboxLedger charges only for staying alive, structured, routed, and connected to payments.

### Who It's For

- **Small and medium businesses** running one shared billing inbox across multiple clients or vendors, with no dedicated finance software.
- **Agencies and service businesses** issuing recurring invoices to many clients from a single mailbox, needing those invoices tracked, approved and paid without manual spreadsheet work.
- **Collection and billing operations teams** that need multiple invoices or billing threads automatically split across departments (e.g., Billing, Collections, Client Success) instead of one shared inbox everyone digs through.
- **Any team where a billing record isn't just "create once"** — it needs a supervisor to review it, a note when a price has dropped or increased since last cycle, and a clean way to notify the end customer and collect payment.

### Why They Need InboxLedger, Not Just Claude

Claude can read an inbox and summarize ten emails in seconds — but the moment the chat ends, that insight evaporates. InboxLedger is the layer that:

- **Routes** each billing record to the correct department/client queue automatically, instead of one undifferentiated inbox.
- **Tracks price and term changes** record-over-record per vendor/client, surfacing a flag the moment a recurring bill changes versus last cycle — something no email client does on its own.
- **Assigns ownership** — a configurable Employee → Supervisor → Manager structure means every record has an accountable reviewer, and a supervisor can be added to any billing thread with one click.
- **Closes the loop to payment** — a WhatsApp message with the invoice summary and a payment QR/link goes out to the end customer directly from the app, shortening the billing-to-payment cycle without anyone manually chasing clients.
- **Persists and audits** — every creation and edit is logged, searchable and remains available long after the Claude conversation that created it has ended.

### Business Model

- **AI inference cost to InboxLedger: ₹0.** The customer's own Claude (or ChatGPT) plan performs all reading and reasoning; InboxLedger never calls a model API.
- **What InboxLedger actually costs to run, per customer:** app hosting, the database, WhatsApp Business API message fees (usage-based, pass-through or lightly marked up), and payment-gateway fees (typically borne by standard gateway pricing, not InboxLedger).
- **Pricing (hypothesis to validate):** ₹999–₹2,499 per workspace per month for the core routed billing register (Pending/Paid/Overdue tracking, department routing, supervisor assignment, audit history), plus a usage-based add-on (e.g., ₹2–₹5 per WhatsApp notification sent) for the WhatsApp + payment-link module.
- **First 100 customers:** direct outreach to small billing/collections teams, accounting firms managing multiple client mailboxes, and agencies with recurring-invoice workflows; offer a free guided pilot connecting their first mailbox and routing their first week of invoices live, so the value is visible before they pay.
- **Year 1:** a reliable, routed email-to-billing-to-payment workflow for one email provider (Gmail first, Outlook next), validated pricing from early pilot customers, and the price-change/alerting feature proven as a genuine differentiator.
- **Year 3, only if demand supports it:** broader finance-operations workflows (recurring billing calendars, multi-mailbox consolidation across branches, deeper payment reconciliation) — expansion driven by what paying customers actually ask for, not speculative scope.

---

## Page 2 — Product Execution

### How It Works (Claude → MCP → InboxLedger)

1. The customer's email account is connected to Claude as it already is today (Gmail/Outlook).
2. The customer types a request in Claude: *"Find my last five invoice emails and add them to InboxLedger."*
3. Claude reads the real inbox using its own existing email connection, interprets each message, extracts vendor, invoice number, amount, due date and description — leaving anything uncertain as null rather than guessing.
4. Claude calls InboxLedger's MCP tool `create_billing_record` for each invoice. InboxLedger validates the data, checks for duplicates against the source message, and persists the record.
5. The record appears instantly in the live InboxLedger dashboard — routed to the configured department queue and assigned a default reviewing supervisor.
6. A human opens the record, reassigns the supervisor if needed, corrects or completes any field, and changes its status (Pending → Paid, etc.). Every change is captured in the audit log.
7. *(Extension module)* When a record is marked ready, InboxLedger can send a WhatsApp message to the end customer with the invoice summary and a payment link/QR code, closing the loop from inbox to cash.

### What's Built Today (Working Proof of Concept)

- **Live web application** (Next.js) with an enterprise-style dashboard: Overview, Billing Records, Team Structure, Pricing Configuration, and Settings — no AI provider key anywhere in the codebase.
- **Billing Records register**: searchable, filterable by status, with a full edit drawer (vendor, invoice number, dates, amount, currency, tax, category, status, notes) and a visible audit trail per record.
- **MCP server** (`@modelcontextprotocol/sdk`, stdio transport) exposing five tools — `search_billing_emails`, `get_email_message`, `create_billing_record`, `list_billing_records`, `update_billing_record` — backed by the exact same validated service layer the web app uses, so nothing Claude creates bypasses business rules.
- **End-to-end verified**: a message read from the mailbox → turned into a structured record via `create_billing_record` → visible immediately in the dashboard → edited and saved by a human, with duplicate-record protection confirmed working.
- **Team Structure and Pricing Configuration** screens are in place as configuration primitives — the foundation the supervisor-assignment and department-routing features build directly on top of.

### What's Next to Reach the Full Vision

| Capability | Status |
|---|---|
| Department/client-queue routing per record | Designed, next build increment on top of existing `billing_category`/`status` fields |
| Supervisor assignment per record, backed by the Team Structure hierarchy | Team Structure config exists; per-record assignment is the next step |
| Price-change detection (compare new invoice vs. last from same vendor/client) | Natural extension of the existing duplicate-detection logic already running on every create |
| Live Gmail/Outlook OAuth for real mailbox search (currently a clearly labelled demo mailbox for this POC) | OAuth scaffold documented; swap-in point isolated to one file |
| WhatsApp notification + payment link/QR on an outbound invoice | New module: WhatsApp Business API integration plus a payment-gateway link generator, triggered from the existing record-status change |

### The Demo (What You'll See)

Type a request in Claude → Claude reads real billing emails via the existing email connection → Claude calls InboxLedger's MCP tool to create the records → the records appear instantly in the live InboxLedger dashboard → a person opens one, edits a field, and saves it — the change persists. This closed loop, from inbox to a live, human-editable record, is working today and is the foundation every routing, approval and payment feature above is built on.
