/**
 * Canonical keys for merging duplicate extractions across chunks/documents.
 */
export function canonicalKey(text: string): string {
  return text
    .toLowerCase()
    /** Split letters/digits from punctuation so “hello—world” → “hello world” */
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 512);
}
