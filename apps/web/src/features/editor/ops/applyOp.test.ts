/**
 * Cross-language parity test.
 *
 * Loads the same corpus consumed by `apps/api/tests/test_corpus.py` and runs
 * it through the TypeScript reducer. If this fails, the TS and Python
 * implementations have drifted.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { EditOp, Scene } from "@/shared/types";

import { applyAll } from "./applyOp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.resolve(
  __dirname,
  "../../../../../api/tests/fixtures/scene_ops/corpus.json",
);

type Case = { name: string; initial: Scene; ops: EditOp[]; expected: Scene };
const cases: Case[] = JSON.parse(fs.readFileSync(CORPUS, "utf-8")).fixtures;

describe("scene reducer cross-language parity", () => {
  it.each(cases)("$name", ({ initial, ops, expected }) => {
    const actual = applyAll(initial, ops);
    expect(actual).toEqual(expected);
  });
});
