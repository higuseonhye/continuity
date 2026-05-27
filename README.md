# Continuity

*Part of [Drift & Return](https://github.com/higuseonhye/trajectory-native/blob/main/docs/human-rhythm.md)*

---

Organizations forget. Not dramatically — **quietly**. Decisions dissolve. Rationale fades. The same tensions return because nothing was held with care.

**Continuity** is decision memory: ingest notes, transcripts, strategy documents — extract what was chosen, with evidence — and keep it across time.

Not a chatbot. Not another AI summary layer.

A **quiet archive** for:

- what was decided, and why
- tradeoffs and tensions, with quotes anchored
- lineage — what superseded what
- timeline, synthesis, continuity across documents

Return reads from `GET /api/decisions` for institutional memory when Continuity is running.

---

## Open the room

```bash
npm install && npm run dev
# → http://localhost:3002
```

Port **3002** — Return runs on 3000, Drift on 3001.

Set `ORG_REASONING_URL=http://localhost:3002` in Return for live memory.

---

## Ecosystem

| Name | Repository | Role |
|------|------------|------|
| **Return** | [trajectory-native](https://github.com/higuseonhye/trajectory-native) | Personal rhythm |
| **Drift** | [trajectory-drift](https://github.com/higuseonhye/trajectory-drift) | Collective rhythm |
| **Continuity** | this repo | Decision memory |

---

## Architecture

`memory/` · `reasoning_extractor/` · `workflows/decision_continuity/` · calm App Router UI

Every extracted artifact carries **evidence spans** — continuity over generation volume.

---

## Status

**Continuity** is the human name; `org-reasoning-mvp` remains the GitHub slug for now.

Private MVP · evolving
