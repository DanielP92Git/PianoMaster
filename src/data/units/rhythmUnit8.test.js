// src/data/units/rhythmUnit8.test.js
// Phase 1 v3.5 — Unit 8 (3/4 Meter) invariants per 01-07-PLAN.md.
//
// U8 occupies the rhythm_8_* namespace freed by Plan 02 (which renamed hidden
// syncopation IDs to rhythm_synco_* / boss_rhythm_synco).
// Concept signal: timeSignature='3/4' on every node (D-14 meter-unit detection).

import { describe, it, expect } from "vitest";
import rhythmUnit8Nodes from "./rhythmUnit8.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 8 — Three-Four Time (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (non-duration / meter arc)", () => {
    expect(rhythmUnit8Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit8Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs match the locked design (rhythm_8_1..5 + boss_rhythm_8)", () => {
    expect(rhythmUnit8Nodes.map((n) => n.id)).toEqual([
      "rhythm_8_1",
      "rhythm_8_2",
      "rhythm_8_3",
      "rhythm_8_4",
      "rhythm_8_5",
      "boss_rhythm_8",
    ]);
  });

  it("orders are sequential starting at START_ORDER=170", () => {
    expect(rhythmUnit8Nodes.map((n) => n.order)).toEqual([
      170, 171, 172, 173, 174, 175,
    ]);
  });

  it("prerequisite chain: boss_rhythm_7 -> rhythm_8_1 -> ... -> boss_rhythm_8", () => {
    expect(rhythmUnit8Nodes[0].prerequisites).toEqual(["boss_rhythm_7"]);
    for (let i = 1; i < rhythmUnit8Nodes.length; i++) {
      expect(rhythmUnit8Nodes[i].prerequisites).toEqual([
        rhythmUnit8Nodes[i - 1].id,
      ]);
    }
  });

  it("ALL 6 nodes use timeSignature '3/4' (meter-unit concept signal per D-14)", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("3/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes (0..4) have category 'rhythm'; boss has category 'boss'", () => {
    rhythmUnit8Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit8Nodes[5].category).toBe("boss");
  });

  it("rhythm_8_1 is a DISCOVERY introducing the 3/4 meter concept (focusDurations=['3_4'])", () => {
    const n = rhythmUnit8Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["3_4"]);
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(n.exercises[0].config.questions[0]).toMatchObject({
      type: "discovery_intro",
      focusDuration: "3_4",
    });
  });

  it("rhythm_8_2 is a PRACTICE", () => {
    expect(rhythmUnit8Nodes[1].nodeType).toBe(NODE_TYPES.PRACTICE);
  });

  it("rhythm_8_3 is a mixed-contrast DISCOVERY (empty focusDurations — no NEW concept)", () => {
    const n = rhythmUnit8Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_8_4 is a PRACTICE", () => {
    expect(rhythmUnit8Nodes[3].nodeType).toBe(NODE_TYPES.PRACTICE);
  });

  it("rhythm_8_5 is a SPEED_ROUND using ARCADE_RHYTHM", () => {
    const n = rhythmUnit8Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_8 is a MINI_BOSS with patternTagMode 'any' and isBoss=true", () => {
    const n = rhythmUnit8Nodes[5];
    expect(n.id).toBe("boss_rhythm_8");
    expect(n.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(n.rhythmConfig.patternTagMode).toBe("any");
    expect(n.isBoss).toBe(true);
  });

  it("XP arc: 75, 80, 80, 85, 90, 160", () => {
    expect(rhythmUnit8Nodes.map((n) => n.xpReward)).toEqual([
      75, 80, 80, 85, 90, 160,
    ]);
  });

  it("no leftover hidden-unit references — namespace handover from Plan 02 confirmed", () => {
    expect(
      rhythmUnit8Nodes.find((n) => n.id.startsWith("rhythm_synco_"))
    ).toBeUndefined();
    expect(
      rhythmUnit8Nodes.find((n) => n.id === "boss_rhythm_synco")
    ).toBeUndefined();
  });

  it("default export shape (array)", () => {
    expect(Array.isArray(rhythmUnit8Nodes)).toBe(true);
  });
});
