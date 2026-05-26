import { z } from "zod";

/** Structured extraction output per chunk (evidence-first) */
export const EvidenceRefSchema = z.object({
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  quote: z.string().min(1),
});

export const ExtractedDecisionSchema = z.object({
  statement: z.string().min(1),
  status: z.enum(["proposed", "decided", "reversed"]),
  decisionDate: z.string().optional(),
  owners: z.array(z.string()).default([]),
  rationaleSummary: z.string().optional(),
  evidence: z.array(EvidenceRefSchema).min(1),
});

export const ExtractedAssumptionSchema = z.object({
  statement: z.string().min(1),
  confidence: z.string().optional(),
  validityHorizon: z.string().optional(),
  evidence: z.array(EvidenceRefSchema).min(1),
});

export const ExtractedTradeoffSchema = z.object({
  axis: z.string().min(1),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  gained: z.string().optional(),
  lost: z.string().optional(),
  beneficiaries: z.array(z.string()).default([]),
  evidence: z.array(EvidenceRefSchema).min(1),
});

export const ExtractedTensionSchema = z.object({
  statement: z.string().min(1),
  competingPriorities: z.array(z.string()).default([]),
  evidence: z.array(EvidenceRefSchema).min(1),
});

export const ExtractedAlternativeSchema = z.object({
  statement: z.string().min(1),
  rejectionReason: z.string().optional(),
  evidence: z.array(EvidenceRefSchema).min(1),
});

export const ChunkExtractionSchema = z.object({
  decisions: z.array(ExtractedDecisionSchema).default([]),
  assumptions: z.array(ExtractedAssumptionSchema).default([]),
  tradeoffs: z.array(ExtractedTradeoffSchema).default([]),
  tensions: z.array(ExtractedTensionSchema).default([]),
  alternatives: z.array(ExtractedAlternativeSchema).default([]),
});

export type ChunkExtraction = z.infer<typeof ChunkExtractionSchema>;
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
