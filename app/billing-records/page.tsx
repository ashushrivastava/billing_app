"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

interface BillingRecord {
  id: string;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount: number | null;
  currency: string | null;
  tax_amount: number | null;
  description: string | null;
  billing_category: string | null;
  status: string;
  notes: string | null;
  source_provider: string | null;
  source_message_id: string | null;
  updated_at: string;
}

const STATUSES = ["Pending", "Paid", "Overdue", "Under Review"];

export default function BillingRecordsPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<BillingRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    const res = await fetch(`/api/billing-records${qs}`);
    const data = await res.json();
    setRecords(data.records ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const s = search.toLowerCase();
    return records.filter(
      (r) =>
        (r.vendor_name ?? "").toLowerCase().includes(s) ||
        (r.invoice_number ?? "").toLowerCase().includes(s)
    );
  }, [records, search]);

  async function handleSave(updated: BillingRecord) {
    const res = await fetch(`/api/billing-records/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: updated.vendor_name,
        invoice_number: updated.invoice_number,
        invoice_date: updated.invoice_date,
        due_date: updated.due_date,
        amount: updated.amount,
        currency: updated.currency,
        tax_amount: updated.tax_amount,
        description: updated.description,
        billing_category: updated.billing_category,
        status: updated.status,
        notes: updated.notes,
      }),
    });
    if (res.ok) {
      setToast("Record saved");
      setSelected(null);
      load();
    } else {
      const err = await res.json();
      setToast(`Error: ${err.error ?? "could not save"}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing Records"
        description="Records created by Claude from your inbox, editable by your team"
      />

      <div className="px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor or invoice number"
            className="w-72 px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "var(--border-subtle)" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex-1" />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              No billing records yet. Ask Claude to find recent invoices and add them to InboxLedger.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  {["Vendor", "Invoice #", "Invoice date", "Due date", "Amount", "Status", "Source", "Updated", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 font-medium text-xs uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-5 py-3 font-medium">{r.vendor_name || "—"}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{r.invoice_number || "—"}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{r.invoice_date || "—"}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{r.due_date || "—"}</td>
                    <td className="px-5 py-3">
                      {r.amount != null ? `${r.currency ?? ""} ${r.amount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {r.source_provider ?? "manual"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {new Date(r.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-indigo-600 font-medium text-sm hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <EditDrawer record={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function EditDrawer({
  record,
  onClose,
  onSave,
}: {
  record: BillingRecord;
  onClose: () => void;
  onSave: (r: BillingRecord) => void;
}) {
  const [form, setForm] = useState<BillingRecord>(record);

  function set<K extends keyof BillingRecord>(key: K, value: BillingRecord[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="fixed inset-0 z-20 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-base font-semibold">Edit billing record</h2>
            {record.source_message_id && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Source email: {record.source_message_id}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {field(
            "Vendor name",
            <input
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.vendor_name ?? ""}
              onChange={(e) => set("vendor_name", e.target.value)}
            />
          )}
          {field(
            "Invoice number",
            <input
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.invoice_number ?? ""}
              onChange={(e) => set("invoice_number", e.target.value)}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Invoice date",
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: "var(--border-subtle)" }}
                value={form.invoice_date ?? ""}
                onChange={(e) => set("invoice_date", e.target.value)}
              />
            )}
            {field(
              "Due date",
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: "var(--border-subtle)" }}
                value={form.due_date ?? ""}
                onChange={(e) => set("due_date", e.target.value)}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Amount",
              <input
                type="number"
                min="0"
                className={inputCls}
                style={{ borderColor: "var(--border-subtle)" }}
                value={form.amount ?? ""}
                onChange={(e) => set("amount", e.target.value === "" ? null : Number(e.target.value))}
              />
            )}
            {field(
              "Currency",
              <input
                className={inputCls}
                style={{ borderColor: "var(--border-subtle)" }}
                value={form.currency ?? ""}
                maxLength={3}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            )}
          </div>
          {field(
            "Tax amount",
            <input
              type="number"
              min="0"
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.tax_amount ?? ""}
              onChange={(e) => set("tax_amount", e.target.value === "" ? null : Number(e.target.value))}
            />
          )}
          {field(
            "Description",
            <input
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          )}
          {field(
            "Category",
            <input
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.billing_category ?? ""}
              onChange={(e) => set("billing_category", e.target.value)}
            />
          )}
          {field(
            "Status",
            <select
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {field(
            "Notes",
            <textarea
              className={inputCls}
              style={{ borderColor: "var(--border-subtle)" }}
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
