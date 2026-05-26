export interface TextChunk {
  index: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

const DEFAULT_MAX = 3500;
const OVERLAP = 200;

/**
 * Paragraph-aware chunking with overlap for extraction continuity.
 */
export function chunkDocument(body: string, maxChars = DEFAULT_MAX): TextChunk[] {
  const trimmed = body;
  if (!trimmed.trim()) return [];

  const chunks: TextChunk[] = [];
  let chunkIndex = 0;
  let pos = 0;

  while (pos < trimmed.length) {
    let endPos = Math.min(pos + maxChars, trimmed.length);
    if (endPos < trimmed.length) {
      const slice = trimmed.slice(pos, endPos);
      const paraBreak = slice.lastIndexOf("\n\n");
      if (paraBreak > maxChars / 4) {
        endPos = pos + paraBreak + 2;
      } else {
        const lineBreak = slice.lastIndexOf("\n");
        if (lineBreak > maxChars / 4) {
          endPos = pos + lineBreak + 1;
        }
      }
    }

    const slice = trimmed.slice(pos, endPos);
    chunks.push({
      index: chunkIndex++,
      startOffset: pos,
      endOffset: pos + slice.length,
      text: slice,
    });

    if (endPos >= trimmed.length) break;
    const nextStart = endPos - OVERLAP;
    pos = nextStart > pos ? nextStart : pos + 1;
  }

  return chunks;
}
