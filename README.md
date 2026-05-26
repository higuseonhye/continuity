# Organizational reasoning MVP — Decision continuity

Evidence-first **decision memory**: ingest notes/transcripts/PRDs (Markdown or plain text), extract decisions / tradeoffs / tensions with anchored quotes, persist in SQLite, and browse **timeline**, **tradeoffs**, **tensions**, and **synthesis**.

Not a chatbot — structured reasoning continuity surfaces only.

## Prerequisites

- Node.js 20+
- Optional: `OPENAI_API_KEY` for LLM extraction (`gpt-4o-mini` by default via `OPENAI_MODEL`)

Without an API key, a deterministic **heuristic extractor** runs (suitable for demos and CI).

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) → redirects to **Decision timeline**.

## Usage

1. **Ingest** — `/upload`: paste a document with lines like `DECISION:`, `Tradeoff:`, `Open issue:` (heuristic), or free-form prose (with OpenAI).
2. **Timeline** — `/timeline`: chronological decisions, filters, lineage banners.
3. **Tradeoffs / Tensions** — dedicated viewers with evidence spans.
4. **Synthesis** — `/synthesis`: cross-document counts + brief.

SQLite database file: `data/memory.sqlite` (override with `DATABASE_PATH`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (fixtures + pure helpers) |
| `npm run db:generate` | Drizzle migrations from schema (optional) |

## Ecosystem integration

| Repo | Role |
|------|------|
| **[trajectory-native](https://github.com/higuseonhye/trajectory-native)** | Personal steering — consumes `/api/decisions` for institutional memory |
| **[trajectory-drift](https://github.com/higuseonhye/trajectory-drift)** | Org-scale drift detection |

**Default dev port:** `3002` (avoids collision with trajectory-native on `3000`).

Bridge endpoint: `GET /api/decisions` → `{ entries, source }`

---

## Architecture (repo layout)

- `core/` — IDs, shared types
- `memory/` — Drizzle schema, SQLite, repositories
- `reasoning_extractor/` — chunking, Zod schemas, OpenAI + heuristic extraction
- `decision_lineage/` — supersedes detection
- `workflows/decision_continuity/` — ingest pipeline
- `synthesis/` — timeline model + strategic synthesis
- `src/app/` — calm UI (App Router)

## Principles

- Every extracted artifact should carry **evidence spans** (quotes + offsets).
- Prefer **continuity** (lineage, supersede links) over raw generation volume.
