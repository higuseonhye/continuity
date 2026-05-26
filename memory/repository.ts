import { eq, desc, sql, and, inArray, or } from "drizzle-orm";
import { createHash } from "crypto";
import Database from "better-sqlite3";
import { getDb, getDbPath } from "./db";
import * as schema from "./schema";
import { newId } from "@core/ids";
import { isoNow } from "@core/time";
import { canonicalKey } from "@reasoning/dedupe";
import { tradeoffCanonicalKey } from "@tradeoff_analyzer/normalize";
import { tensionCanonicalKey } from "@conflict_detector/cluster";
import type { ChunkExtraction } from "@reasoning_extractor/schema";

export function checksumText(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Idempotent CREATE TABLE for local SQLite (no drizzle migrate folder required). */
export function bootstrapTablesIfNeeded() {
  const sqlite = new Database(getDbPath());
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  source_date TEXT,
  owner TEXT,
  team TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  checksum TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS extraction_runs (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  input_checksum TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  raw_response_json TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY NOT NULL,
  statement TEXT NOT NULL,
  status TEXT NOT NULL,
  decision_date TEXT,
  owners_json TEXT NOT NULL DEFAULT '[]',
  canonical_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rationales (
  id TEXT PRIMARY KEY NOT NULL,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS assumptions (
  id TEXT PRIMARY KEY NOT NULL,
  statement TEXT NOT NULL,
  confidence TEXT,
  validity_horizon TEXT,
  canonical_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tradeoffs (
  id TEXT PRIMARY KEY NOT NULL,
  axis TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  gained TEXT,
  lost TEXT,
  beneficiaries_json TEXT NOT NULL DEFAULT '[]',
  canonical_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tensions (
  id TEXT PRIMARY KEY NOT NULL,
  statement TEXT NOT NULL,
  competing_priorities_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open',
  canonical_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alternatives (
  id TEXT PRIMARY KEY NOT NULL,
  statement TEXT NOT NULL,
  rejection_reason TEXT,
  decision_id TEXT REFERENCES decisions(id) ON DELETE SET NULL,
  canonical_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evidence_spans (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extraction_run_id TEXT REFERENCES extraction_runs(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  quote_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY NOT NULL,
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  link_type TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS document_artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extraction_run_id TEXT REFERENCES extraction_runs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS documents_created_idx ON documents(created_at);
CREATE INDEX IF NOT EXISTS runs_doc_idx ON extraction_runs(document_id);
CREATE INDEX IF NOT EXISTS decisions_status_idx ON decisions(status);
CREATE INDEX IF NOT EXISTS decisions_key_idx ON decisions(canonical_key);
CREATE INDEX IF NOT EXISTS assumptions_key_idx ON assumptions(canonical_key);
CREATE INDEX IF NOT EXISTS tensions_status_idx ON tensions(status);
CREATE INDEX IF NOT EXISTS evidence_entity_idx ON evidence_spans(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS evidence_doc_idx ON evidence_spans(document_id);
CREATE INDEX IF NOT EXISTS links_from_idx ON links(from_type, from_id);
CREATE INDEX IF NOT EXISTS links_to_idx ON links(to_type, to_id);
CREATE INDEX IF NOT EXISTS links_type_idx ON links(link_type);
CREATE INDEX IF NOT EXISTS doc_art_doc_idx ON document_artifacts(document_id);
CREATE INDEX IF NOT EXISTS doc_art_art_idx ON document_artifacts(artifact_type, artifact_id);
`);
  sqlite.close();
}

export async function insertLink(input: {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  linkType: string;
  metadataJson?: string;
}) {
  bootstrapTablesIfNeeded();
  const db = getDb();
  await db.insert(schema.links).values({
    id: newId("lnk"),
    fromType: input.fromType,
    fromId: input.fromId,
    toType: input.toType,
    toId: input.toId,
    linkType: input.linkType,
    metadataJson: input.metadataJson ?? null,
    createdAt: isoNow(),
  });
}

export type IngestInput = {
  title: string;
  bodyText: string;
  sourceDate?: string;
  owner?: string;
  team?: string;
  tags?: string[];
};

export async function ingestDocument(input: IngestInput) {
  bootstrapTablesIfNeeded();
  const db = getDb();
  const id = newId("doc");
  const now = isoNow();
  const checksum = checksumText(input.bodyText);
  await db.insert(schema.documents).values({
    id,
    title: input.title,
    bodyText: input.bodyText,
    sourceDate: input.sourceDate ?? null,
    owner: input.owner ?? null,
    team: input.team ?? null,
    tagsJson: JSON.stringify(input.tags ?? []),
    checksum,
    createdAt: now,
  });
  return { documentId: id, checksum };
}

export async function saveExtractionRun(input: {
  documentId: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  inputChecksum: string;
  rawResponseJson?: string;
}) {
  const db = getDb();
  const id = newId("run");
  const now = isoNow();
  await db.insert(schema.extractionRuns).values({
    id,
    documentId: input.documentId,
    model: input.model,
    promptVersion: input.promptVersion,
    schemaVersion: input.schemaVersion,
    inputChecksum: input.inputChecksum,
    status: "completed",
    rawResponseJson: input.rawResponseJson ?? null,
    createdAt: now,
  });
  return id;
}

export async function mergeChunkExtraction(input: {
  documentId: string;
  runId: string;
  extraction: ChunkExtraction;
}) {
  const db = getDb();
  const now = isoNow();
  const { documentId, runId, extraction } = input;

  for (const d of extraction.decisions) {
    const key = canonicalKey(d.statement);
    const existing = await db
      .select()
      .from(schema.decisions)
      .where(eq(schema.decisions.canonicalKey, key))
      .limit(1);
    const row = existing[0];
    if (row) {
      await db
        .update(schema.decisions)
        .set({
          updatedAt: now,
          status: d.status,
          decisionDate: d.decisionDate ?? row.decisionDate,
        })
        .where(eq(schema.decisions.id, row.id));
      if (d.rationaleSummary) {
        await db.insert(schema.rationales).values({
          id: newId("rat"),
          decisionId: row.id,
          summary: d.rationaleSummary,
          createdAt: now,
        });
      }
      for (const ev of d.evidence) {
        await db.insert(schema.evidenceSpans).values({
          id: newId("ev"),
          documentId,
          extractionRunId: runId,
          entityType: "decision",
          entityId: row.id,
          startOffset: ev.startOffset,
          endOffset: ev.endOffset,
          quoteText: ev.quote,
          createdAt: now,
        });
      }
      await db.insert(schema.documentArtifacts).values({
        id: newId("da"),
        documentId,
        extractionRunId: runId,
        artifactType: "decision",
        artifactId: row.id,
        createdAt: now,
      });
    } else {
      const did = newId("dec");
      await db.insert(schema.decisions).values({
        id: did,
        statement: d.statement,
        status: d.status,
        decisionDate: d.decisionDate ?? null,
        ownersJson: JSON.stringify(d.owners ?? []),
        canonicalKey: key,
        createdAt: now,
        updatedAt: now,
      });
      if (d.rationaleSummary) {
        await db.insert(schema.rationales).values({
          id: newId("rat"),
          decisionId: did,
          summary: d.rationaleSummary,
          createdAt: now,
        });
      }
      for (const ev of d.evidence) {
        await db.insert(schema.evidenceSpans).values({
          id: newId("ev"),
          documentId,
          extractionRunId: runId,
          entityType: "decision",
          entityId: did,
          startOffset: ev.startOffset,
          endOffset: ev.endOffset,
          quoteText: ev.quote,
          createdAt: now,
        });
      }
      await db.insert(schema.documentArtifacts).values({
        id: newId("da"),
        documentId,
        extractionRunId: runId,
        artifactType: "decision",
        artifactId: did,
        createdAt: now,
      });
    }
  }

  for (const a of extraction.assumptions) {
    const key = canonicalKey(a.statement);
    const existing = await db
      .select()
      .from(schema.assumptions)
      .where(eq(schema.assumptions.canonicalKey, key))
      .limit(1);
    let aid = existing[0]?.id;
    if (!aid) {
      aid = newId("asm");
      await db.insert(schema.assumptions).values({
        id: aid,
        statement: a.statement,
        confidence: a.confidence ?? null,
        validityHorizon: a.validityHorizon ?? null,
        canonicalKey: key,
        createdAt: now,
      });
    }
    for (const ev of a.evidence) {
      await db.insert(schema.evidenceSpans).values({
        id: newId("ev"),
        documentId,
        extractionRunId: runId,
        entityType: "assumption",
        entityId: aid,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quoteText: ev.quote,
        createdAt: now,
      });
    }
    await db.insert(schema.documentArtifacts).values({
      id: newId("da"),
      documentId,
      extractionRunId: runId,
      artifactType: "assumption",
      artifactId: aid,
      createdAt: now,
    });
  }

  for (const t of extraction.tradeoffs) {
    const key = tradeoffCanonicalKey(t.axis, t.optionA, t.optionB);
    const existing = await db
      .select()
      .from(schema.tradeoffs)
      .where(eq(schema.tradeoffs.canonicalKey, key))
      .limit(1);
    let tid = existing[0]?.id;
    if (!tid) {
      tid = newId("to");
      await db.insert(schema.tradeoffs).values({
        id: tid,
        axis: t.axis,
        optionA: t.optionA ?? null,
        optionB: t.optionB ?? null,
        gained: t.gained ?? null,
        lost: t.lost ?? null,
        beneficiariesJson: JSON.stringify(t.beneficiaries ?? []),
        canonicalKey: key,
        createdAt: now,
      });
    }
    for (const ev of t.evidence) {
      await db.insert(schema.evidenceSpans).values({
        id: newId("ev"),
        documentId,
        extractionRunId: runId,
        entityType: "tradeoff",
        entityId: tid,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quoteText: ev.quote,
        createdAt: now,
      });
    }
    await db.insert(schema.documentArtifacts).values({
      id: newId("da"),
      documentId,
      extractionRunId: runId,
      artifactType: "tradeoff",
      artifactId: tid,
      createdAt: now,
    });
  }

  for (const tn of extraction.tensions) {
    const key = tensionCanonicalKey(tn.statement);
    const existing = await db
      .select()
      .from(schema.tensions)
      .where(eq(schema.tensions.canonicalKey, key))
      .limit(1);
    let teid = existing[0]?.id;
    if (!teid) {
      teid = newId("ten");
      await db.insert(schema.tensions).values({
        id: teid,
        statement: tn.statement,
        competingPrioritiesJson: JSON.stringify(tn.competingPriorities ?? []),
        status: "open",
        canonicalKey: key,
        createdAt: now,
      });
    }
    for (const ev of tn.evidence) {
      await db.insert(schema.evidenceSpans).values({
        id: newId("ev"),
        documentId,
        extractionRunId: runId,
        entityType: "tension",
        entityId: teid,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quoteText: ev.quote,
        createdAt: now,
      });
    }
    await db.insert(schema.documentArtifacts).values({
      id: newId("da"),
      documentId,
      extractionRunId: runId,
      artifactType: "tension",
      artifactId: teid,
      createdAt: now,
    });
  }

  for (const alt of extraction.alternatives) {
    const key = canonicalKey(alt.statement);
    const existing = await db
      .select()
      .from(schema.alternatives)
      .where(eq(schema.alternatives.canonicalKey, key))
      .limit(1);
    let altid = existing[0]?.id;
    if (!altid) {
      altid = newId("alt");
      await db.insert(schema.alternatives).values({
        id: altid,
        statement: alt.statement,
        rejectionReason: alt.rejectionReason ?? null,
        decisionId: null,
        canonicalKey: key,
        createdAt: now,
      });
    }
    for (const ev of alt.evidence) {
      await db.insert(schema.evidenceSpans).values({
        id: newId("ev"),
        documentId,
        extractionRunId: runId,
        entityType: "alternative",
        entityId: altid,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quoteText: ev.quote,
        createdAt: now,
      });
    }
    await db.insert(schema.documentArtifacts).values({
      id: newId("da"),
      documentId,
      extractionRunId: runId,
      artifactType: "alternative",
      artifactId: altid,
      createdAt: now,
    });
  }
}

export async function listTimelineDecisions() {
  const db = getDb();
  bootstrapTablesIfNeeded();
  const rows = await db
    .select()
    .from(schema.decisions)
    .orderBy(
      desc(
        sql`coalesce(${schema.decisions.decisionDate}, ${schema.decisions.createdAt})`
      )
    );
  return rows;
}

export async function getDecisionDetail(decisionId: string) {
  const db = getDb();
  bootstrapTablesIfNeeded();
  const d = await db
    .select()
    .from(schema.decisions)
    .where(eq(schema.decisions.id, decisionId))
    .limit(1);
  const decision = d[0];
  if (!decision) return null;

  const rationales = await db
    .select()
    .from(schema.rationales)
    .where(eq(schema.rationales.decisionId, decisionId));

  const outgoingLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.fromType, "decision"),
        eq(schema.links.fromId, decisionId)
      )
    );

  const incomingLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(eq(schema.links.toType, "decision"), eq(schema.links.toId, decisionId))
    );

  const evidence = await db
    .select()
    .from(schema.evidenceSpans)
    .where(
      and(
        eq(schema.evidenceSpans.entityType, "decision"),
        eq(schema.evidenceSpans.entityId, decisionId)
      )
    );

  const artifacts = await db
    .select()
    .from(schema.documentArtifacts)
    .where(
      and(
        eq(schema.documentArtifacts.artifactType, "decision"),
        eq(schema.documentArtifacts.artifactId, decisionId)
      )
    );

  const docIds = [...new Set(artifacts.map((a) => a.documentId))];
  const docs =
    docIds.length > 0
      ? await db
          .select()
          .from(schema.documents)
          .where(inArray(schema.documents.id, docIds))
      : [];

  return {
    decision,
    rationales,
    outgoingLinks,
    incomingLinks,
    evidence,
    documents: docs,
  };
}

export async function listTradeoffsWithEvidence() {
  const db = getDb();
  bootstrapTablesIfNeeded();
  const to = await db.select().from(schema.tradeoffs).orderBy(desc(schema.tradeoffs.createdAt));
  const evidenceRows = await db
    .select()
    .from(schema.evidenceSpans)
    .where(eq(schema.evidenceSpans.entityType, "tradeoff"));
  const evBy = new Map<string, typeof evidenceRows>();
  for (const e of evidenceRows) {
    const list = evBy.get(e.entityId) ?? [];
    list.push(e);
    evBy.set(e.entityId, list);
  }
  return to.map((t) => ({
    tradeoff: t,
    evidence: evBy.get(t.id) ?? [],
  }));
}

export async function listOpenTensions() {
  const db = getDb();
  bootstrapTablesIfNeeded();
  const rows = await db
    .select()
    .from(schema.tensions)
    .where(eq(schema.tensions.status, "open"))
    .orderBy(desc(schema.tensions.createdAt));
  const evidenceRows = await db
    .select()
    .from(schema.evidenceSpans)
    .where(eq(schema.evidenceSpans.entityType, "tension"));
  const evBy = new Map<string, typeof evidenceRows>();
  for (const e of evidenceRows) {
    const list = evBy.get(e.entityId) ?? [];
    list.push(e);
    evBy.set(e.entityId, list);
  }
  return rows.map((t) => ({
    tension: t,
    evidence: evBy.get(t.id) ?? [],
    competingPriorities: safeJson<string[]>(t.competingPrioritiesJson, []),
  }));
}

export async function listLinksForDecisions(decisionIds: string[]) {
  if (decisionIds.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(schema.links)
    .where(
      or(
        and(
          eq(schema.links.fromType, "decision"),
          inArray(schema.links.fromId, decisionIds)
        ),
        and(
          eq(schema.links.toType, "decision"),
          inArray(schema.links.toId, decisionIds)
        )
      )
    );
}
