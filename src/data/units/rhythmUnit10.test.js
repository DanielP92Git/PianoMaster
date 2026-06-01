import { describe, it, expect } from "vitest";
import rhythmUnit10Nodes from "./rhythmUnit10.js";
import { NODE_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 10 — Rhythm Review (Phase 1 v3.5 — D-11)", () => {
  it("contains exactly one boss node", () => {
    expect(rhythmUnit10Nodes).toHaveLength(1);
  });

  it("the single node is boss_rhythm_10 with BOSS nodeType", () => {
    const node = rhythmUnit10Nodes[0];
    expect(node.id).toBe("boss_rhythm_10");
    expect(node.nodeType).toBe(NODE_TYPES.BOSS);
    expect(node.isBoss).toBe(true);
    expect(node.isReview).toBe(true);
  });

  it("prereq is boss_rhythm_9 (chains from U9)", () => {
    expect(rhythmUnit10Nodes[0].prerequisites).toEqual(["boss_rhythm_9"]);
  });

  it("uses patternTagMode: 'any' for cumulative review", () => {
    expect(rhythmUnit10Nodes[0].rhythmConfig.patternTagMode).toBe("any");
  });

  it("reviewsUnits enumerates 1..9", () => {
    expect(rhythmUnit10Nodes[0].reviewsUnits).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it("measureCount is 4 (boss policy)", () => {
    expect(rhythmUnit10Nodes[0].rhythmConfig.measureCount).toBe(4);
  });

  it("exercise type is ARCADE_RHYTHM (BOSS policy)", () => {
    expect(rhythmUnit10Nodes[0].exercises[0].type).toBe(
      EXERCISE_TYPES.ARCADE_RHYTHM
    );
  });
});
