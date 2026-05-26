import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@memory/db";
import * as schema from "@memory/schema";
import { insertLink, bootstrapTablesIfNeeded } from "@memory/repository";

const SUPERSEDE_PATTERN =
  /\b(supersed|supersede|replaces earlier|instead of (?:the )?previous|overturn|reverse(?:s|d)? decision|no longer valid)\b/i;

function sharedPrefixLength(a: string, b: string): number {
  let n = 0;
  const max = Math.min(a.length, b.length);
  while (n < max && a.charCodeAt(n) === b.charCodeAt(n)) n++;
  return n;
}

/**
 * Deterministic lineage: explicit revision language + shared canonical prefix.
 */
export async function runLineagePass(): Promise<{ linksAdded: number }> {
  bootstrapTablesIfNeeded();
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.decisions)
    .orderBy(asc(schema.decisions.createdAt));

  let linksAdded = 0;

  for (let i = 1; i < rows.length; i++) {
    const newer = rows[i]!;
    if (!SUPERSEDE_PATTERN.test(newer.statement)) continue;

    let best: (typeof rows)[number] | null = null;
    let bestScore = 0;
    for (let j = 0; j < i; j++) {
      const older = rows[j]!;
      const score = sharedPrefixLength(older.canonicalKey, newer.canonicalKey);
      if (score > bestScore && score >= 12) {
        bestScore = score;
        best = older;
      }
    }
    if (!best) continue;

    const dup = await db
      .select()
      .from(schema.links)
      .where(
        and(
          eq(schema.links.fromType, "decision"),
          eq(schema.links.fromId, newer.id),
          eq(schema.links.toType, "decision"),
          eq(schema.links.toId, best.id),
          eq(schema.links.linkType, "decision_supersedes")
        )
      )
      .limit(1);
    if (dup.length > 0) continue;

    await insertLink({
      fromType: "decision",
      fromId: newer.id,
      toType: "decision",
      toId: best.id,
      linkType: "decision_supersedes",
      metadataJson: JSON.stringify({ reason: "prefix_lineage_v1" }),
    });

    await db
      .update(schema.decisions)
      .set({
        status: "superseded",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.decisions.id, best.id));

    linksAdded += 1;
  }

  return { linksAdded };
}
