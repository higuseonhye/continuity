import type { ChunkExtraction } from "./schema";
import type { TextChunk } from "./chunk";

const chunkEvidence = (chunk: TextChunk) => [
  {
    startOffset: chunk.startOffset,
    endOffset: chunk.endOffset,
    quote: chunk.text.slice(0, 500).trim() || chunk.text.trim(),
  },
];

/**
 * Deterministic fallback when no LLM key: lightweight signals from text.
 * Evidence spans use the chunk’s global bounds for stable offsets.
 */
export function heuristicExtractChunk(chunk: TextChunk): ChunkExtraction {
  const text = chunk.text;
  const ev = chunkEvidence(chunk);

  const decisions: ChunkExtraction["decisions"] = [];
  const tensions: ChunkExtraction["tensions"] = [];
  const tradeoffs: ChunkExtraction["tradeoffs"] = [];

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (
      /^decision\s*[:\-]/i.test(trimmed) ||
      /^we decided\b/i.test(trimmed) ||
      /^we will\b/i.test(trimmed) ||
      /^resolved\s*[:\-]/i.test(trimmed)
    ) {
      const stmt = trimmed.replace(/^[^:]+:\s*/, "").trim();
      if (stmt.length > 8) {
        decisions.push({
          statement: stmt.slice(0, 500),
          status: "decided",
          rationaleSummary: undefined,
          owners: [],
          evidence: ev,
        });
      }
    }
    if (
      /^open issue\b/i.test(trimmed) ||
      /^tension\s*[:\-]/i.test(trimmed) ||
      /^unresolved\b/i.test(trimmed) ||
      /^risk\s*[:\-]/i.test(trimmed)
    ) {
      const stmt = trimmed.replace(/^[^:]+:\s*/, "").trim();
      if (stmt.length > 6) {
        tensions.push({
          statement: stmt.slice(0, 500),
          competingPriorities: [],
          evidence: ev,
        });
      }
    }
    if (/^tradeoff\s*[:\-]/i.test(trimmed)) {
      const axis = trimmed.replace(/^[^:]+:\s*/, "").trim().slice(0, 200);
      if (axis.length > 4) {
        tradeoffs.push({
          axis,
          gained: undefined,
          lost: undefined,
          beneficiaries: [],
          evidence: ev,
        });
      }
    }
  }

  if (
    decisions.length === 0 &&
    tensions.length === 0 &&
    tradeoffs.length === 0
  ) {
    decisions.push({
      statement:
        "No explicit decision markers in this chunk — stored as proposed trace (use OPENAI_API_KEY for structured extraction).",
      status: "proposed",
      rationaleSummary:
        "Heuristic mode: no DECISION / Tradeoff / Open issue lines detected.",
      owners: [],
      evidence: ev,
    });
  }

  return {
    decisions,
    assumptions: [],
    tradeoffs,
    tensions,
    alternatives: [],
  };
}
