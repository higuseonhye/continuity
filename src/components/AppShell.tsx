import Link from "next/link";

const nav = [
  { href: "/timeline", label: "Decision timeline" },
  { href: "/tradeoffs", label: "Tradeoffs" },
  { href: "/tensions", label: "Unresolved tensions" },
  { href: "/synthesis", label: "Synthesis" },
  { href: "/graph", label: "Reasoning graph" },
  { href: "/upload", label: "Ingest" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">
            Organizational reasoning infrastructure
          </p>
          <h1 className="text-lg font-medium text-ink tracking-tight">
            Decision reasoning continuity
          </h1>
          <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
            Scale reasoning, not chaos — preserve decisions, tradeoffs, and tensions
            with evidence-backed memory.
          </p>
        </div>
        <nav className="mx-auto max-w-5xl px-6 pb-4 flex flex-wrap gap-4 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-muted hover:text-ink border-b border-transparent hover:border-stone-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">{children}</main>
      <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-ink-faint">
        Calm, reflective surfaces — not another chatbot.
      </footer>
    </div>
  );
}
