import { eq } from "drizzle-orm";
import { getDb } from "@memory/db";
import * as schema from "@memory/schema";
import { bootstrapTablesIfNeeded } from "@memory/repository";

export type ReasoningGraphModel = {
  nodes: { id: string; label: string; status: string }[];
  edges: {
    fromId: string;
    toId: string;
    linkType: string;
  }[];
};

/** Lightweight graph for continuity visibility (not a generic graph DB). */
export async function buildReasoningGraph(): Promise<ReasoningGraphModel> {
  bootstrapTablesIfNeeded();
  const db = getDb();
  const decisions = await db.select().from(schema.decisions);
  const links = await db
    .select()
    .from(schema.links)
    .where(eq(schema.links.linkType, "decision_supersedes"));

  return {
    nodes: decisions.map((d) => ({
      id: d.id,
      label: d.statement.length > 120 ? d.statement.slice(0, 117) + "…" : d.statement,
      status: d.status,
    })),
    edges: links
      .filter(
        (l) => l.fromType === "decision" && l.toType === "decision"
      )
      .map((l) => ({
        fromId: l.fromId,
        toId: l.toId,
        linkType: l.linkType,
      })),
  };
}
