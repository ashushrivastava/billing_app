export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-8 py-5 flex items-center justify-between"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
