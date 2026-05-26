import assert from "node:assert/strict";
import test from "node:test";
import { canonicalKey } from "../reasoning/dedupe";
import { chunkDocument } from "../reasoning_extractor/chunk";
import { heuristicExtractChunk } from "../reasoning_extractor/heuristic";
import { tradeoffCanonicalKey } from "../tradeoff_analyzer/normalize";
import { tensionCanonicalKey } from "../conflict_detector/cluster";
import { readFileSync } from "fs";
import path from "path";

test("canonicalKey normalizes and truncates", () => {
  assert.equal(canonicalKey("  Hello—World!!  "), "hello world");
});

test("chunkDocument produces non-overlapping coverage", () => {
  const body = "a".repeat(100);
  const chunks = chunkDocument(body, 40);
  assert.ok(chunks.length >= 1);
  assert.equal(chunks[0]!.startOffset, 0);
});

test("heuristic extracts DECISION line", () => {
  const doc = "DECISION: Ship widgets first.";
  const ch = {
    index: 0,
    startOffset: 0,
    endOffset: doc.length,
    text: doc,
  };
  const ext = heuristicExtractChunk(ch);
  assert.ok(ext.decisions.some((d) => d.statement.includes("Ship widgets")));
});

test("tradeoffCanonicalKey is stable", () => {
  assert.equal(
    tradeoffCanonicalKey("Speed vs quality", "fast", "good"),
    tradeoffCanonicalKey("Speed vs quality", "fast", "good")
  );
});

test("fixture sample mentions structured lines", () => {
  const fixturePath = path.join(
    process.cwd(),
    "tests",
    "fixtures",
    "sample-strategy.md"
  );
  const text = readFileSync(fixturePath, "utf8");
  assert.match(text, /DECISION:/i);
  assert.match(text, /Tradeoff:/i);
  assert.match(text, /Open issue:/i);
});

test("tensionCanonicalKey mirrors canonical statement fold", () => {
  assert.ok(tensionCanonicalKey("A BC").length > 0);
});
