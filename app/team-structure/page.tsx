"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

interface TeamConfig {
  team_name: string;
  employees_per_supervisor: number;
  supervisors_per_manager: number;
}

export default function TeamStructurePage() {
  const [config, setConfig] = useState<TeamConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/team-configuration")
      .then((r) => r.json())
      .then((d) => setConfig(d.config));
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    const res = await fetch("/api/team-configuration", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    setConfig(data.config);
    setSaving(false);
  }

  if (!config) return <div className="px-8 py-6 text-sm text-gray-500">Loading...</div>;

  const totalEmployees = config.employees_per_supervisor * config.supervisors_per_manager;

  return (
    <div>
      <PageHeader
        title="Team Structure"
        description="Configure the reporting capacity for your billing operations team"
      />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Team / unit name
            </label>
            <input
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={config.team_name}
              onChange={(e) => setConfig({ ...config, team_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Employees per supervisor
            </label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={config.employees_per_supervisor}
              onChange={(e) => setConfig({ ...config, employees_per_supervisor: Number(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Supervisors per manager
            </label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: "var(--border-subtle)" }}
              value={config.supervisors_per_manager}
              onChange={(e) => setConfig({ ...config, supervisors_per_manager: Number(e.target.value) || 1 })}
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save configuration"}
          </button>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-1">{config.team_name} — configured capacity</h3>
          <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
            This is configured capacity, not actual assigned headcount. No employees have been hired or assigned.
          </p>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              1 Manager
            </div>
            <div className="pl-5 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              └── {config.supervisors_per_manager} Supervisors
            </div>
            <div className="pl-10 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              └── {config.employees_per_supervisor} Employees per supervisor
            </div>
          </div>

          <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Total configured capacity
            </div>
            <div className="text-2xl font-semibold mt-1">{totalEmployees} employees</div>
          </div>
        </div>
      </div>
    </div>
  );
}
