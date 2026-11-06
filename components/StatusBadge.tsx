const CLASS_MAP: Record<string, string> = {
  Pending: "status-pending",
  Paid: "status-paid",
  Overdue: "status-overdue",
  "Under Review": "status-under-review",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = CLASS_MAP[status] ?? "status-pending";
  return <span className={`status-badge ${cls}`}>{status}</span>;
}
