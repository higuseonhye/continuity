import OpenAI from "openai";
import { ChunkExtractionSchema, type ChunkExtraction } from "./schema";
import type { TextChunk } from "./chunk";

const PROMPT_VERSION = "reasoning_extract_v1";
const SCHEMA_VERSION = "chunk_extraction_v1";

export function getPromptVersion(): string {
  return PROMPT_VERSION;
}

export function getSchemaVersion(): string {
  return SCHEMA_VERSION;
}

const SYSTEM = `You are an organizational reasoning extractor. Extract ONLY what is supported by explicit text.
Rules:
- Every extracted item MUST include at least one evidence entry with exact quotes from the chunk and correct character offsets relative to the FULL DOCUMENT (global offsets), not the chunk alone.
- Offsets: startOffset and endOffset are zero-based indices into the entire document string provided separately.
- Do not invent decisions or tradeoffs not grounded in the text.
- Prefer empty arrays over guesses.
- decisionDate: ISO date string if clearly stated, else omit.
Return JSON matching the schema exactly.`;

export async function extractChunkWithOpenAI(
  fullDocument: string,
  chunk: TextChunk,
  apiKey: string
): Promise<ChunkExtraction> {
  const client = new OpenAI({ apiKey });
  const userContent = `FULL_DOCUMENT_LENGTH=${fullDocument.length}
CHUNK_START_OFFSET=${chunk.startOffset}
CHUNK_END_OFFSET=${chunk.endOffset}

FULL_DOCUMENT:
${fullDocument}

---

Extract from the slice below (offsets above map into FULL_DOCUMENT). Evidence quotes MUST use global offsets into FULL_DOCUMENT.

CHUNK_SLICE:
${chunk.text}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.1,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chunk_extraction",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            decisions: {
              type: "array",
              items: { $ref: "#/$defs/decision" },
            },
            assumptions: {
              type: "array",
              items: { $ref: "#/$defs/assumption" },
            },
            tradeoffs: {
              type: "array",
              items: { $ref: "#/$defs/tradeoff" },
            },
            tensions: {
              type: "array",
              items: { $ref: "#/$defs/tension" },
            },
            alternatives: {
              type: "array",
              items: { $ref: "#/$defs/alternative" },
            },
          },
          required: [
            "decisions",
            "assumptions",
            "tradeoffs",
            "tensions",
            "alternatives",
          ],
          $defs: {
            evidence: {
              type: "object",
              additionalProperties: false,
              properties: {
                startOffset: { type: "integer" },
                endOffset: { type: "integer" },
                quote: { type: "string" },
              },
              required: ["startOffset", "endOffset", "quote"],
            },
            decision: {
              type: "object",
              additionalProperties: false,
              properties: {
                statement: { type: "string" },
                status: {
                  type: "string",
                  enum: ["proposed", "decided", "reversed"],
                },
                decisionDate: { type: ["string", "null"] },
                owners: {
                  type: "array",
                  items: { type: "string" },
                },
                rationaleSummary: { type: ["string", "null"] },
                evidence: {
                  type: "array",
                  items: { $ref: "#/$defs/evidence" },
                },
              },
              required: [
                "statement",
                "status",
                "decisionDate",
                "owners",
                "rationaleSummary",
                "evidence",
              ],
            },
            assumption: {
              type: "object",
              additionalProperties: false,
              properties: {
                statement: { type: "string" },
                confidence: { type: ["string", "null"] },
                validityHorizon: { type: ["string", "null"] },
                evidence: {
                  type: "array",
                  items: { $ref: "#/$defs/evidence" },
                },
              },
              required: [
                "statement",
                "confidence",
                "validityHorizon",
                "evidence",
              ],
            },
            tradeoff: {
              type: "object",
              additionalProperties: false,
              properties: {
                axis: { type: "string" },
                optionA: { type: ["string", "null"] },
                optionB: { type: ["string", "null"] },
                gained: { type: ["string", "null"] },
                lost: { type: ["string", "null"] },
                beneficiaries: {
                  type: "array",
                  items: { type: "string" },
                },
                evidence: {
                  type: "array",
                  items: { $ref: "#/$defs/evidence" },
                },
              },
              required: [
                "axis",
                "optionA",
                "optionB",
                "gained",
                "lost",
                "beneficiaries",
                "evidence",
              ],
            },
            tension: {
              type: "object",
              additionalProperties: false,
              properties: {
                statement: { type: "string" },
                competingPriorities: {
                  type: "array",
                  items: { type: "string" },
                },
                evidence: {
                  type: "array",
                  items: { $ref: "#/$defs/evidence" },
                },
              },
              required: ["statement", "competingPriorities", "evidence"],
            },
            alternative: {
              type: "object",
              additionalProperties: false,
              properties: {
                statement: { type: "string" },
                rejectionReason: { type: ["string", "null"] },
                evidence: {
                  type: "array",
                  items: { $ref: "#/$defs/evidence" },
                },
              },
              required: ["statement", "rejectionReason", "evidence"],
            },
          },
        },
      },
    },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty completion");

  const parsed = JSON.parse(raw) as unknown;
  const normalized = normalizeNullables(parsed);
  return ChunkExtractionSchema.parse(normalized);
}

function normalizeNullables(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(normalizeNullables);
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (v === null && (k === "decisionDate" || k === "rationaleSummary")) {
        out[k] = undefined;
      } else if (
        v === null &&
        (k === "confidence" ||
          k === "validityHorizon" ||
          k === "optionA" ||
          k === "optionB" ||
          k === "gained" ||
          k === "lost" ||
          k === "rejectionReason")
      ) {
        out[k] = undefined;
      } else {
        out[k] = normalizeNullables(v);
      }
    }
    return out;
  }
  return data;
}
