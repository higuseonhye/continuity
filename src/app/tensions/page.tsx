import Link from "next/link";
import { listOpenTensions } from "@memory/repository";

export default async function TensionsPage() {
  const rows = await listOpenTensions();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Unresolved tension board
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          Open issues and competing priorities — visible so teams stop repeating
          the same debates.
        </p>
      </section>

      <ul className="space-y-5">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-ink-muted">
            No open tensions.{" "}
            <Link href="/upload" className="underline text-ink">
              Ingest a document
            </Link>
            .
          </li>
        ) : (
          rows.map(({ tension, evidence, competingPriorities }) => (
            <li
              key={tension.id}
              className="rounded-lg border border-stone-200 bg-white p-6 space-y-4 shadow-sm"
            >
              <p className="text-[15px] font-medium text-ink leading-snug">
                {tension.statement}
              </p>

              {competingPriorities.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-faint mb-2">
                    Competing priorities
                  </p>
                  <ul className="list-disc list-inside text-sm text-ink-muted space-y-1">
                    {competingPriorities.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

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
