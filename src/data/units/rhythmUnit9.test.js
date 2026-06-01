import { describe, it, expect } from "vitest";
import rhythmUnit9Nodes from "./rhythmUnit9.js";
import { NODE_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 9 — Six-Eight Time (Phase 1 v3.5 — D-01/D-03)", () => {
  it("exports exactly 6 nodes", () => {
    expect(rhythmUnit9Nodes).toHaveLength(6);
  });

  it("node IDs match the locked design", () => {
    const expectedIds = [
      "rhythm_9_1",
      "rhythm_9_2",
      "rhythm_9_3",
      "rhythm_9_4",
      "rhythm_9_5",
      "boss_rhythm_9",
    ];
    expect(rhythmUnit9Nodes.map((n) => n.id)).toEqual(expectedIds);
  });

  it("all 6 nodes use timeSignature 6/8 (meter unit invariant)", () => {
    rhythmUnit9Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("6/8");
    });
  });

  it("rhythm_9_1 has focusDurations ['6_8'] (meter concept ID)", () => {
    expect(rhythmUnit9Nodes[0].rhythmConfig.focusDurations).toEqual(["6_8"]);
  });

  it("rhythm_9_1's first question is discovery_intro with focusDuration '6_8'", () => {
    const firstQuestion = rhythmUnit9Nodes[0].exercises[0].config.questions[0];
    expect(firstQuestion).toEqual({
      type: "discovery_intro",
      focusDuration: "6_8",
    });
  });

  it("prerequisite chain walks boss_rhythm_8 → rhythm_9_1 → ... → boss_rhythm_9", () => {
    expect(rhythmUnit9Nodes[0].prerequisites).toEqual(["boss_rhythm_8"]);
    for (let i = 1; i < rhythmUnit9Nodes.length; i++) {
      expect(rhythmUnit9Nodes[i].prerequisites).toEqual([
        rhythmUnit9Nodes[i - 1].id,
      ]);
    }
  });

  it("boss_rhythm_9 is MINI_BOSS with patternTagMode 'any' and isBoss true", () => {
    const boss = rhythmUnit9Nodes[5];
    expect(boss.id).toBe("boss_rhythm_9");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
    expect(boss.isBoss).toBe(true);
    expect(boss.category).toBe("boss");
  });

  it("XP arc follows progressive shape (80, 85, 85, 90, 95, 170)", () => {
    expect(rhythmUnit9Nodes.map((n) => n.xpReward)).toEqual([
      80, 85, 85, 90, 95, 170,
    ]);
  });

  it("speed round (rhythm_9_5) uses ARCADE_RHYTHM exercise type", () => {
    expect(rhythmUnit9Nodes[4].nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(rhythmUnit9Nodes[4].exercises[0].type).toBe(
      EXERCISE_TYPES.ARCADE_RHYTHM
    );
  });
});
