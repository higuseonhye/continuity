import type { InferSelectModel } from "drizzle-orm";
import type { decisions } from "@memory/schema";
import {
  listTimelineDecisions,
  listLinksForDecisions,
  bootstrapTablesIfNeeded,
} from "@memory/repository";

export type DecisionRow = InferSelectModel<typeof decisions>;

export type TimelineEntry = {
  decision: DecisionRow;
  supersededById: string | null;
  supersedesIds: string[];
};

export async function buildTimelineModel(): Promise<TimelineEntry[]> {
  bootstrapTablesIfNeeded();
  const rows = await listTimelineDecisions();
  const ids = rows.map((r) => r.id);
  const links = await listLinksForDecisions(ids);

  const supersedesMap = new Map<string, string>();
  const supersedesChildren = new Map<string, string[]>();

  for (const l of links) {
    if (l.linkType !== "decision_supersedes") continue;
    if (l.fromType === "decision" && l.toType === "decision") {
      supersedesMap.set(l.toId, l.fromId);
      const arr = supersedesChildren.get(l.fromId) ?? [];
      arr.push(l.toId);
      supersedesChildren.set(l.fromId, arr);
    }
  }

  return rows.map((decision) => ({
    decision,
    supersededById: supersedesMap.get(decision.id) ?? null,
    supersedesIds: supersedesChildren.get(decision.id) ?? [],
  }));
}
