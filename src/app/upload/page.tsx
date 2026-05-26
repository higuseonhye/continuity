"use client";

import { useState } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-10 max-w-xl">
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-ink tracking-tight">
          Ingest reasoning artifacts
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          Paste meeting notes, transcripts, PRDs, or memos. Extraction runs with
          evidence spans; without{" "}
          <code className="font-mono text-xs bg-surface-muted px-1 rounded">
            OPENAI_API_KEY
          </code>
          , a deterministic heuristic is used.
        </p>
      </section>

      <form
        className="space-y-5 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setStatus(null);
          try {
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/ingest", {
              method: "POST",
              body: fd,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Request failed");
            setStatus(
              `Ingested document ${json.documentId} · ${json.chunksProcessed} chunks · model ${json.model} · lineage links +${json.lineageLinksAdded}`
            );
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-ink-faint">
            Title
          </label>
          <input
            name="title"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm bg-white"
            placeholder="Q2 Planning — shipping tradeoffs"
            defaultValue="Untitled document"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-ink-faint">
              Source date (optional)
            </label>
            <input
              name="sourceDate"
              type="date"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-ink-faint">
              Owner (optional)
            </label>
            <input
              name="owner"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
              placeholder="COO"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-ink-faint">
            Team (optional)
          </label>
          <input
            name="team"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            placeholder="Product / Strategy"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-ink-faint">
            Tags (comma-separated)
          </label>
          <input
            name="tags"
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            placeholder="pricing, enterprise, launch"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-ink-faint">
            Body (markdown or plain text)
          </label>
          <textarea
            name="body"
            required
            rows={14}
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm font-mono leading-relaxed"
            placeholder={`DECISION: We will ship enterprise tier first.\n\nTradeoff: speed vs polish — we accept launch debt in onboarding.\n\nOpen issue: Sales wants annual discounts; Finance wants list price.`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-stone-900 text-white text-sm px-4 py-2.5 hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? "Ingesting…" : "Run extraction"}
        </button>

        {status ? (
          <p className="text-sm text-ink-muted border-t border-stone-100 pt-4">
            {status}
          </p>
        ) : null}
      </form>
    </div>
  );
}
