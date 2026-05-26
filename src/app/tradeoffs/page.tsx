import Link from "next/link";
import { listTradeoffsWithEvidence } from "@memory/repository";

export default async function TradeoffsPage() {
  const rows = await listTradeoffsWithEvidence();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Tradeoff viewer
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          What was gained, what was lost, and who bears the cost — grounded in
          evidence spans.
        </p>
      </section>

      <ul className="space-y-6">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-ink-muted">
            No tradeoffs extracted yet.{" "}
            <Link href="/upload" className="underline text-ink">
              Ingest a document
            </Link>
            .
          </li>
        ) : (
          rows.map(({ tradeoff, evidence }) => (
            <li
              key={tradeoff.id}
              className="rounded-lg border border-stone-200 bg-white p-6 space-y-4 shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-faint mb-1">
                  Axis
                </p>
                <p className="text-[15px] font-medium text-ink">{tradeoff.axis}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-ink-faint text-xs uppercase mb-1">Option A</p>
                  <p className="text-ink-muted">{tradeoff.optionA ?? "—"}</p>
                </div>
                <div>
                  <p className="text-ink-faint text-xs uppercase mb-1">Option B</p>
                  <p className="text-ink-muted">{tradeoff.optionB ?? "—"}</p>
                </div>
                <div>
                  <p className="text-ink-faint text-xs uppercase mb-1">Gained</p>
                  <p className="text-ink-muted">{tradeoff.gained ?? "—"}</p>
                </div>
                <div>
                  <p className="text-ink-faint text-xs uppercase mb-1">Lost</p>
                  <p className="text-ink-muted">{tradeoff.lost ?? "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-ink-faint mb-2">
                  Evidence
                </p>
                <ul className="space-y-2">
                  {evidence.map((e) => (
                    <li
                      key={e.id}
                      className="text-sm border-l-2 border-stone-300 pl-3 text-ink-muted leading-relaxed"
                    >
                      <span className="font-mono text-[10px] text-ink-faint block">
                        [{e.startOffset}:{e.endOffset}]
                      </span>
                      {e.quoteText}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
