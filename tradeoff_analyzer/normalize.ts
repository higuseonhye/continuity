import { canonicalKey } from "@reasoning/dedupe";

/** Lightweight axis label normalization */
export function normalizeAxis(axis: string): string {
  return axis.trim().replace(/\s+/g, " ").slice(0, 256);
}

export function tradeoffCanonicalKey(axis: string, optionA?: string, optionB?: string): string {
  const parts = [
    normalizeAxis(axis),
    (optionA ?? "").slice(0, 120),
    (optionB ?? "").slice(0, 120),
  ];
  return canonicalKey(parts.join("|"));
}
