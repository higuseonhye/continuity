import Link from "next/link";
import { notFound } from "next/navigation";
import { getDecisionDetail } from "@memory/repository";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDecisionDetail(id);
  if (!detail) notFound();

  const { decision, rationales, outgoingLinks, incomingLinks, evidence } =
    detail;

  /** This decision supersedes older decisions (outgoing). */
  const supersedesOlder = outgoingLinks.filter(
    (l) => l.linkType === "decision_supersedes" && l.toType === "decision"
  );
  /** A newer decision supersedes this one (incoming). */
  const supersededByNewer = incomingLinks.filter(
    (l) => l.linkType === "decision_supersedes" && l.fromType === "decision"
  );

  return (
    <article className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <Link
          href="/timeline"
          className="text-xs uppercase tracking-wider text-ink-muted hover:text-ink"
        >
          ← Timeline
        </Link>
        <h2 className="text-2xl font-medium text-ink tracking-tight leading-snug">
          {decision.statement}
        </h2>
        <p className="text-sm text-ink-muted">
          Status:{" "}
          <span className="font-mono text-xs">{decision.status}</span>
          {" · "}
          {decision.decisionDate ?? decision.createdAt.slice(0, 10)}
        </p>
      </div>

      {supersededByNewer.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Superseded by a newer decision:{" "}
          {supersededByNewer.map((l) => (
            <Link
              key={l.id}
              href={`/timeline/${l.fromId}`}
              className="underline font-medium"
            >
              view successor
            </Link>
          ))}
        </div>
      ) : null}

      {supersedesOlder.length > 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink-muted">
          This decision supersedes prior reasoning:{" "}
          {supersedesOlder.map((l) => (
            <Link
              key={l.id}
              href={`/timeline/${l.toId}`}
              className="underline text-ink"
            >
              prior decision
            </Link>
          ))}
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Rationale memory
        </h3>
        {rationales.length === 0 ? (
          <p className="text-sm text-ink-muted">No rationale summaries stored.</p>
        ) : (
          <ul className="space-y-2">
            {rationales.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm leading-relaxed text-ink"
              >
                {r.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Evidence spans
        </h3>
        {evidence.length === 0 ? (
          <p className="text-sm text-ink-muted">No anchored quotes.</p>
        ) : (
          <ul className="space-y-3">
            {evidence.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-stone-200 bg-surface px-4 py-3 text-sm"
              >
                <p className="font-mono text-[11px] text-ink-faint mb-2">
                  [{e.startOffset}:{e.endOffset}]
                </p>
                <blockquote className="text-ink leading-relaxed border-l-2 border-stone-300 pl-3">
                  {e.quoteText}
                </blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
