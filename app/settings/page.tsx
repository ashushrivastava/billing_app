import PageHeader from "@/components/PageHeader";
import path from "path";
import { headers } from "next/headers";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const mcpScriptPath = path.join(process.cwd(), "mcp-server", "index.ts");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const mcpUrl = `${proto}://${host}/api/mcp`;
  const localConfigSnippet = `"mcpServers": {
  "inboxledger": {
    "command": "npx",
    "args": ["tsx", "${mcpScriptPath.replace(/\\/g, "\\\\")}"],
    "cwd": "${process.cwd().replace(/\\/g, "\\\\")}"
  }
}`;

  return (
    <div>
      <PageHeader title="Settings" description="Email connection, MCP endpoint and workspace profile" />

      <div className="px-8 py-6 space-y-6 max-w-3xl">
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-1">Email connection</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Connected provider used by the <code>search_billing_emails</code> and <code>get_email_message</code> MCP tools.
          </p>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50">
            <div>
              <div className="text-sm font-medium">demo-mailbox@inboxledger.local</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Synthetic demo mailbox (6 sample billing emails) — swap in Gmail OAuth for a live inbox.
              </div>
            </div>
            <span className="status-badge status-paid">Connected</span>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-1">Connect InboxLedger to Claude — remote (recommended)</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Works from this deployed link — no local setup. Claude calls this URL directly, which reads and writes
            the exact same database this dashboard shows.
          </p>
          <ol className="text-sm space-y-2 list-decimal pl-5" style={{ color: "var(--text-primary)" }}>
            <li>In Claude (desktop or claude.ai) → Settings → Connectors → Add custom connector.</li>
            <li>
              Paste this URL:
              <div className="mt-1.5 flex items-center gap-2 bg-gray-900 text-gray-100 rounded-lg p-3">
                <pre className="flex-1 text-xs overflow-x-auto">{mcpUrl}</pre>
                <CopyButton text={mcpUrl} />
              </div>
            </li>
            <li>Save and enable it. InboxLedger&apos;s 5 tools will appear in the tool list for this chat.</li>
            <li>
              Try: <em>&quot;List my billing records in InboxLedger&quot;</em> or, after reading real invoice emails via
              your own email connector, <em>&quot;Add these to InboxLedger.&quot;</em>
            </li>
          </ol>
          <p className="text-xs mt-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-800">
            This endpoint is intentionally open (no auth) for this single-workspace evaluation build — anyone with
            the URL can read/write this workspace&apos;s records. Don&apos;t reuse it for real customer data without
            adding an access token.
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-1">Connect InboxLedger to Claude — local (alternative)</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Runs the MCP server as a local process via stdio. Only useful if you&apos;re running this app on your
            own machine rather than the deployed link above.
          </p>
          <ol className="text-sm space-y-2 list-decimal pl-5" style={{ color: "var(--text-primary)" }}>
            <li>Open Claude Desktop → Settings → Desktop app → Extensions → Local MCP servers → Edit config.</li>
            <li>
              Add:
              <div className="mt-1.5 flex items-start gap-2 bg-gray-900 text-gray-100 rounded-lg p-3">
                <pre className="flex-1 text-xs overflow-x-auto">{localConfigSnippet}</pre>
                <CopyButton text={localConfigSnippet} />
              </div>
            </li>
            <li>Restart Claude Desktop.</li>
          </ol>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-2">MCP tools exposed</h3>
          <ul className="text-sm space-y-1.5" style={{ color: "var(--text-secondary)" }}>
            <li><span className="font-mono text-indigo-600">search_billing_emails</span> — search the connected mailbox</li>
            <li><span className="font-mono text-indigo-600">get_email_message</span> — fetch one exact email</li>
            <li><span className="font-mono text-indigo-600">create_billing_record</span> — save a structured billing record</li>
            <li><span className="font-mono text-indigo-600">list_billing_records</span> — list existing records</li>
            <li><span className="font-mono text-indigo-600">update_billing_record</span> — update an existing record</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
