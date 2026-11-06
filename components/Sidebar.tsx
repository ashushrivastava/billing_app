"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/billing-records", label: "Billing Records", icon: "doc" },
  { href: "/team-structure", label: "Team Structure", icon: "users" },
  { href: "/pricing-configuration", label: "Pricing Configuration", icon: "tag" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h8" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <circle cx="17.5" cy="8.5" r="2.5" />
          <path d="M21.5 20c0-2.8-1.7-5-4.5-5.7" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20 12.5 12.5 20a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h5.9a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 .6 1.7Z" />
          <circle cx="7.5" cy="7.5" r="1.3" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.6-2-3.4-2.4.8a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.7 7.7 0 0 0-2.6 1.5l-2.4-.8-2 3.4 2 1.6a7.8 7.8 0 0 0 0 3l-2 1.6 2 3.4 2.4-.8a7.7 7.7 0 0 0 2.6 1.5L10 22h4l.4-2.3a7.7 7.7 0 0 0 2.6-1.5l2.4.8 2-3.4Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "var(--bg-sidebar)" }}
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col py-5"
    >
      <div className="px-5 pb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
          IL
        </div>
        <div>
          <div className="text-white font-semibold text-[15px] leading-tight">InboxLedger</div>
          <div className="text-[11px]" style={{ color: "var(--text-sidebar)" }}>
            Billing Inbox Ops
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                color: active ? "#ffffff" : "var(--text-sidebar)",
                background: active ? "var(--bg-sidebar-active)" : "transparent",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pt-4 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-400/30 flex items-center justify-center text-white text-xs font-semibold">
            DU
          </div>
          <div>
            <div className="text-white text-[13px] font-medium leading-tight">Demo Workspace</div>
            <div className="text-[11px]" style={{ color: "var(--text-sidebar)" }}>
              Owner
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
