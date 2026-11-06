import PageHeader from "@/components/PageHeader";
import path from "path";

export default function SettingsPage() {
  const mcpScriptPath = path.join(process.cwd(), "mcp-server", "index.ts");

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
          <h3 className="text-sm font-semibold mb-1">Connect InboxLedger to Claude</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            The MCP server shares the same database as this app, so anything Claude creates appears here immediately.
          </p>
          <ol className="text-sm space-y-2 list-decimal pl-5" style={{ color: "var(--text-primary)" }}>
            <li>Open Claude Desktop → Settings → Developer → Edit Config.</li>
            <li>
              Add an MCP server entry pointing at:
              <pre className="mt-1.5 text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
{`"inboxledger": {
  "command": "npx",
  "args": ["tsx", "${mcpScriptPath.replace(/\\/g, "\\\\")}"]
}`}
              </pre>
            </li>
            <li>Restart Claude Desktop. InboxLedger's 5 tools will appear in the tool list.</li>
            <li>
              Try: <em>&quot;Find my five most recent invoice or billing emails.&quot;</em>
            </li>
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
