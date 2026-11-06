"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

interface PricingItem {
  id: string;
  service_name: string;
  internal_rate: number;
  unit: string;
  notes: string | null;
  active: number;
}

export default function PricingConfigurationPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [form, setForm] = useState({ service_name: "", internal_rate: "", unit: "Per invoice", notes: "" });

  async function load() {
    const res = await fetch("/api/pricing-configuration");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem() {
    if (!form.service_name || !form.internal_rate) return;
    await fetch("/api/pricing-configuration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, internal_rate: Number(form.internal_rate) }),
    });
    setForm({ service_name: "", internal_rate: "", unit: "Per invoice", notes: "" });
    load();
  }

  async function toggleActive(item: PricingItem) {
    await fetch("/api/pricing-configuration", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, active: item.active ? false : true }),
    });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Pricing Configuration"
        description="Internal rates — visible only to the workspace owner, never exposed through MCP or client-facing pages"
      />

      <div className="px-8 py-6 space-y-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border-subtle)" }}>
                {["Service", "Internal rate", "Unit", "Notes", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-3 font-medium">{item.service_name}</td>
                  <td className="px-5 py-3">₹{item.internal_rate.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{item.unit}</td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{item.notes || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`status-badge ${item.active ? "status-paid" : "status-overdue"}`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleActive(item)} className="text-indigo-600 text-sm font-medium hover:underline">
                      {item.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Add internal rate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              placeholder="Service name"
              className="px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.service_name}
              onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            />
            <input
              placeholder="Rate"
              type="number"
              className="px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.internal_rate}
              onChange={(e) => setForm({ ...form, internal_rate: e.target.value })}
            />
            <input
              placeholder="Unit"
              className="px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Add rate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
