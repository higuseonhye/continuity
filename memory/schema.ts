import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";

/** Source document (notes, transcript, PRD, etc.) */
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    bodyText: text("body_text").notNull(),
    sourceDate: text("source_date"),
    owner: text("owner"),
    team: text("team"),
    tagsJson: text("tags_json").notNull().default("[]"),
    checksum: text("checksum").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("documents_created_idx").on(t.createdAt)]
);

/** Versioned extraction run */
export const extractionRuns = sqliteTable(
  "extraction_runs",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    schemaVersion: text("schema_version").notNull(),
    inputChecksum: text("input_checksum").notNull(),
    status: text("status").notNull().default("completed"),
    rawResponseJson: text("raw_response_json"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("runs_doc_idx").on(t.documentId)]
);

export const decisions = sqliteTable(
  "decisions",
  {
    id: text("id").primaryKey(),
    statement: text("statement").notNull(),
    status: text("status").notNull(),
    decisionDate: text("decision_date"),
    ownersJson: text("owners_json").notNull().default("[]"),
    canonicalKey: text("canonical_key").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("decisions_status_idx").on(t.status), index("decisions_key_idx").on(t.canonicalKey)]
);

export const rationales = sqliteTable("rationales", {
  id: text("id").primaryKey(),
  decisionId: text("decision_id")
    .notNull()
    .references(() => decisions.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assumptions = sqliteTable(
  "assumptions",
  {
    id: text("id").primaryKey(),
    statement: text("statement").notNull(),
    confidence: text("confidence"),
    validityHorizon: text("validity_horizon"),
    canonicalKey: text("canonical_key").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("assumptions_key_idx").on(t.canonicalKey)]
);

export const tradeoffs = sqliteTable("tradeoffs", {
  id: text("id").primaryKey(),
  axis: text("axis").notNull(),
  optionA: text("option_a"),
  optionB: text("option_b"),
  gained: text("gained"),
  lost: text("lost"),
  beneficiariesJson: text("beneficiaries_json").notNull().default("[]"),
  canonicalKey: text("canonical_key").notNull(),
  createdAt: text("created_at").notNull(),
});

export const tensions = sqliteTable(
  "tensions",
  {
    id: text("id").primaryKey(),
    statement: text("statement").notNull(),
    competingPrioritiesJson: text("competing_priorities_json").notNull().default("[]"),
    status: text("status").notNull().default("open"),
    canonicalKey: text("canonical_key").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("tensions_status_idx").on(t.status)]
);

export const alternatives = sqliteTable("alternatives", {
  id: text("id").primaryKey(),
  statement: text("statement").notNull(),
  rejectionReason: text("rejection_reason"),
  decisionId: text("decision_id").references(() => decisions.id, {
    onDelete: "set null",
  }),
  canonicalKey: text("canonical_key").notNull(),
  createdAt: text("created_at").notNull(),
});

/** Evidence quotes anchored to document offsets */
export const evidenceSpans = sqliteTable(
  "evidence_spans",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    extractionRunId: text("extraction_run_id").references(
      () => extractionRuns.id,
      { onDelete: "set null" }
    ),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    quoteText: text("quote_text").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("evidence_entity_idx").on(t.entityType, t.entityId),
    index("evidence_doc_idx").on(t.documentId),
  ]
);

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    fromType: text("from_type").notNull(),
    fromId: text("from_id").notNull(),
    toType: text("to_type").notNull(),
    toId: text("to_id").notNull(),
    linkType: text("link_type").notNull(),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("links_from_idx").on(t.fromType, t.fromId),
    index("links_to_idx").on(t.toType, t.toId),
    index("links_type_idx").on(t.linkType),
  ]
);

/** Join: which document contributed which artifact */
export const documentArtifacts = sqliteTable(
  "document_artifacts",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    extractionRunId: text("extraction_run_id").references(
      () => extractionRuns.id,
      { onDelete: "cascade" }
    ),
    artifactType: text("artifact_type").notNull(),
    artifactId: text("artifact_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("doc_art_doc_idx").on(t.documentId),
    index("doc_art_art_idx").on(t.artifactType, t.artifactId),
  ]
);
