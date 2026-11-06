// Synthetic demo mailbox used as the documented POC fallback (see detail.md section 3 "Demo fallback").
// These are clearly-labelled synthetic messages, never presented as real customer email.

export interface DemoEmail {
  message_id: string;
  sender: string;
  subject: string;
  received_at: string;
  snippet: string;
  body_text: string;
}

export const DEMO_MAILBOX: DemoEmail[] = [
  {
    message_id: "demo-msg-001",
    sender: "billing@acmecloud.com",
    subject: "Invoice INV-2041 - Acme Cloud Services",
    received_at: "2026-11-01T10:30:00Z",
    snippet: "Please find your invoice for November cloud services attached.",
    body_text:
      "Dear Customer,\n\nPlease find below your invoice details.\n\nInvoice Number: INV-2041\nInvoice Date: 2026-11-01\nDue Date: 2026-11-30\nAmount Due: INR 25000\nDescription: Monthly cloud infrastructure services\n\nThank you for your business.\nAcme Cloud Billing Team",
  },
  {
    message_id: "demo-msg-002",
    sender: "accounts@brightoffice.com",
    subject: "Your November invoice from Bright Office Supplies",
    received_at: "2026-11-02T14:05:00Z",
    snippet: "Attached is your invoice #BO-5532 for office supplies.",
    body_text:
      "Hello,\n\nInvoice #: BO-5532\nDate: 2026-11-02\nPayment due by: 2026-11-16\nTotal: INR 4850\nFor: Office stationery and supplies\n\nRegards,\nBright Office Supplies",
  },
  {
    message_id: "demo-msg-003",
    sender: "billing@swiftlogistics.co",
    subject: "Receipt - Swift Logistics Shipment Charges",
    received_at: "2026-11-03T09:15:00Z",
    snippet: "Your shipment charges receipt for October deliveries.",
    body_text:
      "Receipt No: SL-9981\nIssue Date: 2026-11-03\nAmount: INR 12300\nCurrency: INR\nDescription: October courier and logistics charges\nStatus: Paid on receipt\n\nSwift Logistics",
  },
  {
    message_id: "demo-msg-004",
    sender: "support@cloudhost.io",
    subject: "CloudHost Invoice #CH-77210 is ready",
    received_at: "2026-11-04T08:00:00Z",
    snippet: "Your monthly hosting invoice is now available.",
    body_text:
      "Invoice: CH-77210\nBilling period: Oct 2026\nDue date: 2026-11-20\nAmount: USD 180\nService: Cloud hosting - Pro plan\n\nCloudHost Team",
  },
  {
    message_id: "demo-msg-005",
    sender: "billing@workspacetools.com",
    subject: "March invoice - Workspace Tools subscription",
    received_at: "2026-11-05T11:45:00Z",
    snippet: "Your subscription renewal invoice for next billing cycle.",
    body_text:
      "Invoice Number: WT-3391\nInvoice Date: 2026-11-05\nDue Date: 2026-12-05\nAmount: INR 9999\nCurrency: INR\nDescription: Annual workspace tools subscription renewal\n\nWorkspace Tools Inc.",
  },
  {
    message_id: "demo-msg-006",
    sender: "no-reply@newslettertech.com",
    subject: "Your weekly product digest",
    received_at: "2026-11-05T07:00:00Z",
    snippet: "This week in tech: new releases and updates.",
    body_text: "A roundup of new feature releases and product updates from this week.",
  },
];

export function searchDemoMailbox(params: {
  query?: string | null;
  sender?: string | null;
  subject?: string | null;
  after?: string | null;
  before?: string | null;
  limit: number;
}): DemoEmail[] {
  let results = [...DEMO_MAILBOX];

  if (params.sender) {
    const s = params.sender.toLowerCase();
    results = results.filter((m) => m.sender.toLowerCase().includes(s));
  }
  if (params.subject) {
    const s = params.subject.toLowerCase();
    results = results.filter((m) => m.subject.toLowerCase().includes(s));
  }
  if (params.after) {
    results = results.filter((m) => m.received_at >= params.after!);
  }
  if (params.before) {
    results = results.filter((m) => m.received_at <= params.before!);
  }
  if (params.query) {
    const terms = params.query
      .toLowerCase()
      .replace(/ or /gi, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (terms.length > 0) {
      results = results.filter((m) => {
        const haystack = (m.subject + " " + m.snippet + " " + m.body_text).toLowerCase();
        return terms.some((t) => haystack.includes(t));
      });
    }
  } else if (!params.sender && !params.subject) {
    // default billing-likely filter: exclude obvious non-billing messages
    results = results.filter((m) =>
      /invoice|billing|receipt|payment/i.test(m.subject + " " + m.body_text)
    );
  }

  results.sort((a, b) => (a.received_at < b.received_at ? 1 : -1));
  return results.slice(0, params.limit);
}

export function getDemoMessageById(messageId: string): DemoEmail | undefined {
  return DEMO_MAILBOX.find((m) => m.message_id === messageId);
}
