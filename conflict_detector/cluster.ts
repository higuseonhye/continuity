import { canonicalKey } from "@reasoning/dedupe";

/** Simple tension clustering key from statement */
export function tensionCanonicalKey(statement: string): string {
  return canonicalKey(statement);
}
