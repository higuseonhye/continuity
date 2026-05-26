import Link from "next/link";
import { buildTimelineModel } from "@synthesis/timeline";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const entries = await buildTimelineModel();
  const filtered = sp.status
    ? entries.filter((e) => e.decision.status === sp.status)
    : entries;

  const statuses = ["proposed", "decided", "reversed", "superseded"];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Decision timeline
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          Chronological organizational memory — filter by status; open a decision
          for rationale, evidence, and lineage.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterChip href="/timeline" active={!sp.status} label="All" />
          {statuses.map((s) => (
            <FilterChip
              key={s}
              href={`/timeline?status=${s}`}
              active={sp.status === s}
              label={s}
            />
          ))}
        </div>
      </section>

      <ul className="space-y-4">
        {filtered.length === 0 ? (
          <li className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-ink-muted">
            No decisions yet.{" "}
            <Link href="/upload" className="underline text-ink">
              Ingest a document
            </Link>
            .
          </li>
        ) : (
          filtered.map((entry) => (
            <li
              key={entry.decision.id}
              className="rounded-lg border border-stone-200 bg-white shadow-sm"
            >
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-ink-faint uppercase tracking-wide">
                      {entry.decision.decisionDate ??
                        entry.decision.createdAt.slice(0, 10)}
                    </p>
                    <p className="text-[15px] text-ink leading-snug font-medium">
                      {entry.decision.statement}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-surface-muted text-ink-muted border border-stone-200/80">
                      {entry.decision.status}
                    </span>
                    <Link
                      href={`/timeline/${entry.decision.id}`}
                      className="text-sm text-ink-muted hover:text-ink underline underline-offset-4"
                    >
                      Details
                    </Link>
                  </div>
                </div>

                {entry.supersededById ? (
                  <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-950">
                    Superseded by{" "}
                    <Link
                      className="underline font-medium"
                      href={`/timeline/${entry.supersededById}`}
                    >
                      newer decision
                    </Link>
                    .
                  </div>
                ) : null}

                {entry.supersedesIds.length > 0 ? (
                  <div className="rounded-md bg-stone-50 border border-stone-100 px-3 py-2 text-xs text-ink-muted">
                    Supersedes {entry.supersedesIds.length} prior decision(s).
                  </div>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full border text-xs uppercase tracking-wide transition-colors ${
        active
          ? "border-stone-800 bg-stone-800 text-white"
          : "border-stone-200 bg-white text-ink-muted hover:border-stone-400"
      }`}
    >
      {label}
    </Link>
  );
}
