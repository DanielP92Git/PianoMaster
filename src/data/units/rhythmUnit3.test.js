// Phase 1 v3.5 — Rhythm Unit 3 (Whole + Whole Rest) invariants test.
// Mirrors rhythmUnit1/2 with U3 substitutions (w/wr, START_ORDER=120,
// chain-in from boss_rhythm_2).

import { describe, it, expect } from "vitest";
import rhythmUnit3Nodes from "./rhythmUnit3.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 3 — Whole + Whole Rest (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (5 content + 1 mini-boss per D-01/D-02)", () => {
    expect(rhythmUnit3Nodes).toHaveLength(6);
  });

  it("node IDs match the locked design (D-09 numeric convention)", () => {
    expect(rhythmUnit3Nodes.map((n) => n.id)).toEqual([
      "rhythm_3_1",
      "rhythm_3_2",
      "rhythm_3_3",
      "rhythm_3_4",
      "rhythm_3_5",
      "boss_rhythm_3",
    ]);
  });

  it("node IDs are unique within the unit", () => {
    const ids = rhythmUnit3Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("orderInUnit values are 1..6 sequential", () => {
    expect(rhythmUnit3Nodes.map((n) => n.orderInUnit)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("order numbers are sequential starting at START_ORDER=120", () => {
    expect(rhythmUnit3Nodes.map((n) => n.order)).toEqual([
      120, 121, 122, 123, 124, 125,
    ]);
  });

  it("prerequisite chain walks boss_rhythm_2 → rhythm_3_1 → ... → boss_rhythm_3", () => {
    expect(rhythmUnit3Nodes[0].prerequisites).toEqual(["boss_rhythm_2"]);
    for (let i = 1; i < rhythmUnit3Nodes.length; i++) {
      expect(rhythmUnit3Nodes[i].prerequisites).toEqual([
        rhythmUnit3Nodes[i - 1].id,
      ]);
    }
  });

  it("all 6 nodes use timeSignature 4/4", () => {
    rhythmUnit3Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit3Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("first 5 nodes are category 'rhythm'; boss is category 'boss'", () => {
    rhythmUnit3Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit3Nodes[5].category).toBe("boss");
  });

  it("all nodes are unit=3 with unitName 'Whole + Whole Rest'", () => {
    rhythmUnit3Nodes.forEach((node) => {
      expect(node.unit).toBe(3);
      expect(node.unitName).toBe("Whole + Whole Rest");
    });
  });

  it("rhythm_3_1 is DISCOVERY introducing whole note", () => {
    const n = rhythmUnit3Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["w"]);
    expect(n.rhythmConfig.durations).toContain("w");
  });

  it("rhythm_3_2 is PRACTICE consolidating whole (no new content)", () => {
    const n = rhythmUnit3Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_3_3 is DISCOVERY introducing whole rest (REQ-02 rest adjacent)", () => {
    const n = rhythmUnit3Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["wr"]);
    expect(n.rhythmConfig.durations).toContain("wr");
    expect(n.rhythmConfig.durations).toContain("w");
  });

  it("rhythm_3_4 is PRACTICE combining wholes & rests", () => {
    const n = rhythmUnit3Nodes[3];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_3_5 is SPEED_ROUND with ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit3Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_3 is MINI_BOSS with patternTagMode 'any' and MIXED_LESSON exercise", () => {
    const boss = rhythmUnit3Nodes[5];
    expect(boss.id).toBe("boss_rhythm_3");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    expect(boss.isBoss).toBe(true);
  });

  it("REQ-04: every DISCOVERY node opens with discovery_intro keyed to focusDuration", () => {
    rhythmUnit3Nodes
      .filter((n) => n.nodeType === NODE_TYPES.DISCOVERY)
      .forEach((node) => {
        const firstQ = node.exercises[0].config.questions[0];
        expect(firstQ.type).toBe("discovery_intro");
        expect(typeof firstQ.focusDuration).toBe("string");
        expect(node.rhythmConfig.focusDurations).toContain(
          firstQ.focusDuration
        );
      });
  });

  it("REQ-03 (concept-per-unit): union of focusDurations ⊆ {w, wr}", () => {
    const all = new Set();
    for (const n of rhythmUnit3Nodes) {
      for (const f of n.rhythmConfig.focusDurations || []) all.add(f);
    }
    for (const f of all) {
      expect(["w", "wr"]).toContain(f);
    }
  });

  it("XP arc is monotone non-decreasing through content; boss XP > content", () => {
    const xps = rhythmUnit3Nodes.map((n) => n.xpReward);
    for (let i = 1; i < 5; i++) {
      expect(xps[i]).toBeGreaterThanOrEqual(xps[i - 1]);
    }
    for (let i = 0; i < 5; i++) {
      expect(xps[5]).toBeGreaterThan(xps[i]);
    }
  });

  it("locked XP arc: [55, 60, 60, 65, 70, 120]", () => {
    expect(rhythmUnit3Nodes.map((n) => n.xpReward)).toEqual([
      55, 60, 60, 65, 70, 120,
    ]);
  });

  it("DISCOVERY nodes carry newContent=RHYTHM; PRACTICE nodes carry newContent=NONE", () => {
    expect(rhythmUnit3Nodes[0].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit3Nodes[2].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit3Nodes[1].newContent).toBe(NEW_CONTENT_TYPES.NONE);
    expect(rhythmUnit3Nodes[3].newContent).toBe(NEW_CONTENT_TYPES.NONE);
  });
});
