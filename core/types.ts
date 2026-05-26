import { z } from "zod";

/** Decision lifecycle in organizational memory */
export const DecisionStatusSchema = z.enum([
  "proposed",
  "decided",
  "reversed",
  "superseded",
]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

/** Typed edges between memory entities */
export const LinkTypeSchema = z.enum([
  "decision_supersedes",
  "decision_depends_on",
  "tension_blocks",
  "assumption_supports",
  "tradeoff_influences",
]);
export type LinkType = z.infer<typeof LinkTypeSchema>;

export const EntityKindSchema = z.enum([
  "decision",
  "assumption",
  "tradeoff",
  "tension",
  "alternative",
  "rationale",
]);
export type EntityKind = z.infer<typeof EntityKindSchema>;
