import Link from "next/link";
import { buildStrategicSynthesis } from "@synthesis/cross_doc";

export default async function SynthesisPage() {
  const s = await buildStrategicSynthesis();

  return (
    <div className="space-y-10 max-w-3xl">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Strategic synthesis workspace
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          Cross-document view: counts and a short operator brief — not generated
          “answers,” but compositional visibility over what your memory already
          contains.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
          <span>
            Decisions: <strong className="text-ink">{s.decisionCount}</strong>
          </span>
          <span>
            Tradeoffs: <strong className="text-ink">{s.tradeoffCount}</strong>
          </span>
          <span>
            Open tensions:{" "}
            <strong className="text-ink">{s.openTensionCount}</strong>
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Executive brief
        </h3>
        <p className="text-sm text-ink leading-relaxed">{s.executiveBrief}</p>
        <p className="text-xs text-ink-faint">
          See also:{" "}
          <Link href="/timeline" className="underline text-ink-muted">
            timeline
          </Link>
          ,{" "}
          <Link href="/tradeoffs" className="underline text-ink-muted">
            tradeoffs
          </Link>
          ,{" "}
          <Link href="/tensions" className="underline text-ink-muted">
            tensions
          </Link>
          .
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-surface p-5 space-y-2">
          <h3 className="text-sm font-medium text-ink">Open tension themes</h3>
          <ul className="text-sm text-ink-muted space-y-2 list-disc list-inside">
            {s.openTensionThemes.length === 0 ? (
              <li>None ingested yet.</li>
            ) : (
              s.openTensionThemes.map((t, i) => (
                <li key={i}>{t.statement}</li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-lg border border-stone-200 bg-surface p-5 space-y-2">
          <h3 className="text-sm font-medium text-ink">Recent tradeoff axes</h3>
          <ul className="text-sm text-ink-muted space-y-2 list-disc list-inside">
            {s.recentTradeoffAxes.length === 0 ? (
              <li>None ingested yet.</li>
            ) : (
              s.recentTradeoffAxes.map((a, i) => (
                <li key={i}>{a}</li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
