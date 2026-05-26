import { buildTimelineModel } from "./timeline";
import { listOpenTensions, listTradeoffsWithEvidence } from "@memory/repository";
import { bootstrapTablesIfNeeded } from "@memory/repository";

export type StrategicSynthesis = {
  decisionCount: number;
  openTensionCount: number;
  tradeoffCount: number;
  /** Short narrative for operators */
  executiveBrief: string;
  openTensionThemes: { statement: string }[];
  recentTradeoffAxes: string[];
};

/**
 * Cross-document strategic synthesis: counts + a calm brief (no generative “AI answer”).
 */
export async function buildStrategicSynthesis(): Promise<StrategicSynthesis> {
  bootstrapTablesIfNeeded();
  const [timeline, tensions, tradeoffs] = await Promise.all([
    buildTimelineModel(),
    listOpenTensions(),
    listTradeoffsWithEvidence(),
  ]);

  const decisionCount = timeline.length;
  const openTensionCount = tensions.length;
  const tradeoffCount = tradeoffs.length;

  const superseded = timeline.filter(
    (e) => e.decision.status === "superseded"
  ).length;
  const withLineage = timeline.filter(
    (e) => e.supersededById || e.supersedesIds.length
  ).length;

  const executiveBrief = [
    `Memory holds ${decisionCount} decision(s), ${tradeoffCount} tradeoff record(s), and ${openTensionCount} open tension(s).`,
    withLineage > 0
      ? `${withLineage} decision(s) participate in explicit continuity links; ${superseded} marked superseded.`
      : "No supersedes links yet — ingest related memos to surface revision history.",
    openTensionCount > 0
      ? "Unresolved tensions are listed on the board; resolve or re-decide to reduce repeated coordination."
      : "No tracked open tensions in memory.",
  ].join(" ");

  return {
    decisionCount,
    openTensionCount,
    tradeoffCount,
    executiveBrief,
    openTensionThemes: tensions.slice(0, 8).map((t) => ({
      statement: t.tension.statement,
    })),
    recentTradeoffAxes: tradeoffs.slice(0, 8).map((t) => t.tradeoff.axis),
  };
}
