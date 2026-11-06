"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments without clipboard API permission
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-md border bg-white hover:bg-gray-50 transition-colors"
      style={{ borderColor: "var(--border-subtle)", color: copied ? "var(--status-paid)" : "var(--text-secondary)" }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
