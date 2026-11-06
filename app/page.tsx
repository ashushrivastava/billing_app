import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { getOverviewStats, listBillingRecords } from "@/lib/billing-service";
import { listAuditLogs } from "@/lib/audit";
import Link from "next/link";

function formatMoney(amount: number) {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "default" | "amber" | "green" | "red" }) {
  const toneColor =
    tone === "amber" ? "var(--status-pending)" : tone === "green" ? "var(--status-paid)" : tone === "red" ? "var(--status-overdue)" : "var(--text-primary)";
  return (
    <div className="card px-5 py-4 flex-1 min-w-[180px]">
      <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1.5" style={{ color: toneColor }}>
        {value}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const stats = getOverviewStats();
  const records = listBillingRecords({ limit: 6 });
  const logs = listAuditLogs(6) as Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }>;

  return (
    <div>
      <PageHeader title="Overview" description="Billing operations at a glance" />

      <div className="px-8 py-6 space-y-6">
        <div className="flex gap-4 flex-wrap">
          <StatCard label="Total billing records" value={String(stats.total)} />
          <StatCard label="Pending amount" value={`₹${formatMoney(stats.pendingAmount)}`} tone="amber" />
          <StatCard label="Paid amount" value={`₹${formatMoney(stats.paidAmount)}`} tone="green" />
          <StatCard label="Overdue records" value={String(stats.overdueCount)} tone="red" />
        </div>

        <div className="card px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Email connection
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium">Connected — demo-mailbox@inboxledger.local</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Demo mailbox</span>
            </div>
            <Link href="/settings" className="text-sm font-medium text-indigo-600 hover:underline">
              Manage
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold">Recent billing records</h2>
              <Link href="/billing-records" className="text-sm text-indigo-600 font-medium hover:underline">
                View all
              </Link>
            </div>
            {records.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                No billing records yet. Ask Claude to find recent invoices and add them to InboxLedger.
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(records as Array<Record<string, unknown>>).map((r) => (
                    <tr key={r.id as string} className="border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                      <td className="px-5 py-3 font-medium">{(r.vendor_name as string) || "—"}</td>
                      <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                        {(r.invoice_number as string) || "—"}
                      </td>
                      <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                        {r.amount != null ? `${r.currency ?? ""} ${formatMoney(r.amount as number)}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status as string} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold">Recent activity</h2>
            </div>
            {logs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                No activity yet.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {logs.map((log) => (
                  <li key={log.id} className="px-5 py-3 text-sm">
                    <span className="font-medium capitalize">{log.action}</span>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>{log.entity_type.replace("_", " ")}</span>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
