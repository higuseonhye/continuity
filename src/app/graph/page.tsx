import Link from "next/link";
import { buildReasoningGraph } from "@synthesis/reasoning_graph";

export default async function ReasoningGraphPage() {
  const g = await buildReasoningGraph();

  return (
    <div className="space-y-10 max-w-3xl">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Reasoning graph
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          Supersedes edges between decisions — continuity over novelty. Read-only;
          timeline remains the primary surface.
        </p>
      </section>

      {g.edges.length === 0 ? (
        <p className="text-sm text-ink-muted rounded-lg border border-stone-200 bg-white p-6">
          No lineage edges yet. Ingest documents that revise prior decisions (see{" "}
          <Link href="/upload" className="underline text-ink">
            Ingest
          </Link>
          ).
        </p>
      ) : (
        <ul className="space-y-3">
          {g.edges.map((e, i) => {
            const from = g.nodes.find((n) => n.id === e.fromId);
            const to = g.nodes.find((n) => n.id === e.toId);
            return (
              <li
                key={`${e.fromId}-${e.toId}-${i}`}
                className="rounded-lg border border-stone-200 bg-white p-4 text-sm shadow-sm"
              >
                <span className="font-medium text-ink">
                  <Link href={`/timeline/${e.fromId}`} className="underline">
                    {from?.label ?? e.fromId}
                  </Link>
                </span>
                <span className="text-ink-muted mx-2">supersedes →</span>
                <span className="text-ink-muted">
                  <Link href={`/timeline/${e.toId}`} className="underline">
                    {to?.label ?? e.toId}
                  </Link>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <section className="text-xs text-ink-faint space-y-1">
        <p>Nodes in memory: {g.nodes.length}</p>
        <p>Edges shown: {g.edges.length}</p>
      </section>
    </div>
  );
}
