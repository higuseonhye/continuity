import { chunkDocument } from "@reasoning_extractor/chunk";
import { heuristicExtractChunk } from "@reasoning_extractor/heuristic";
import {
  extractChunkWithOpenAI,
  getPromptVersion,
  getSchemaVersion,
} from "@reasoning_extractor/openai_extract";
import {
  ingestDocument,
  saveExtractionRun,
  mergeChunkExtraction,
  checksumText,
  bootstrapTablesIfNeeded,
  type IngestInput,
} from "@memory/repository";
import { runLineagePass } from "@decision_lineage/detect";

export type PipelineResult = {
  documentId: string;
  runId: string;
  chunksProcessed: number;
  model: string;
  lineageLinksAdded: number;
};

/**
 * Ingest → chunk → extract (OpenAI if configured, else heuristic) → merge → lineage.
 */
export async function runDecisionContinuityPipeline(
  input: IngestInput
): Promise<PipelineResult> {
  bootstrapTablesIfNeeded();

  const { documentId } = await ingestDocument(input);
  const checksum = checksumText(input.bodyText);
  const apiKey = process.env.OPENAI_API_KEY;

  const model = apiKey
    ? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    : "heuristic_v1";

  const runId = await saveExtractionRun({
    documentId,
    model,
    promptVersion: apiKey ? getPromptVersion() : "heuristic_v1",
    schemaVersion: apiKey ? getSchemaVersion() : "chunk_extraction_v1",
    inputChecksum: checksum,
  });

  const split = chunkDocument(input.bodyText);
  const chunks =
    split.length > 0
      ? split
      : [
          {
            index: 0,
            startOffset: 0,
            endOffset: input.bodyText.length,
            text: input.bodyText,
          },
        ];

  let chunksProcessed = 0;
  for (const chunk of chunks) {
    const extraction = apiKey
      ? await extractChunkWithOpenAI(input.bodyText, chunk, apiKey)
      : heuristicExtractChunk(chunk);

    await mergeChunkExtraction({
      documentId,
      runId,
      extraction,
    });
    chunksProcessed += 1;
  }

  const { linksAdded } = await runLineagePass();

  return {
    documentId,
    runId,
    chunksProcessed,
    model,
    lineageLinksAdded: linksAdded,
  };
}
