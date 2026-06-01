// Phase 1 v3.5 — Rhythm Unit 2 (Half + Half Rest) invariants test.
// Mirrors rhythmUnit1.test.js structure with U2 substitutions (h/hr,
// START_ORDER=110, chain-in from boss_rhythm_1).

import { describe, it, expect } from "vitest";
import rhythmUnit2Nodes from "./rhythmUnit2.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 2 — Half + Half Rest (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (5 content + 1 mini-boss per D-01/D-02)", () => {
    expect(rhythmUnit2Nodes).toHaveLength(6);
  });

  it("node IDs match the locked design (D-09 numeric convention)", () => {
    expect(rhythmUnit2Nodes.map((n) => n.id)).toEqual([
      "rhythm_2_1",
      "rhythm_2_2",
      "rhythm_2_3",
      "rhythm_2_4",
      "rhythm_2_5",
      "boss_rhythm_2",
    ]);
  });

  it("node IDs are unique within the unit", () => {
    const ids = rhythmUnit2Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("orderInUnit values are 1..6 sequential", () => {
    expect(rhythmUnit2Nodes.map((n) => n.orderInUnit)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("order numbers are sequential starting at START_ORDER=110", () => {
    expect(rhythmUnit2Nodes.map((n) => n.order)).toEqual([
      110, 111, 112, 113, 114, 115,
    ]);
  });

  it("prerequisite chain walks boss_rhythm_1 → rhythm_2_1 → ... → boss_rhythm_2", () => {
    expect(rhythmUnit2Nodes[0].prerequisites).toEqual(["boss_rhythm_1"]);
    for (let i = 1; i < rhythmUnit2Nodes.length; i++) {
      expect(rhythmUnit2Nodes[i].prerequisites).toEqual([
        rhythmUnit2Nodes[i - 1].id,
      ]);
    }
  });

  it("all 6 nodes use timeSignature 4/4", () => {
    rhythmUnit2Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit2Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("first 5 nodes are category 'rhythm'; boss is category 'boss'", () => {
    rhythmUnit2Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit2Nodes[5].category).toBe("boss");
  });

  it("all nodes are unit=2 with unitName 'Half + Half Rest'", () => {
    rhythmUnit2Nodes.forEach((node) => {
      expect(node.unit).toBe(2);
      expect(node.unitName).toBe("Half + Half Rest");
    });
  });

  it("rhythm_2_1 is DISCOVERY introducing half note", () => {
    const n = rhythmUnit2Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["h"]);
    // Half is framed as a 2-quarter extension; durations include q for context.
    expect(n.rhythmConfig.durations).toContain("h");
  });

  it("rhythm_2_2 is PRACTICE consolidating half (no new content)", () => {
    const n = rhythmUnit2Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_2_3 is DISCOVERY introducing half rest (REQ-02 rest adjacent)", () => {
    const n = rhythmUnit2Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["hr"]);
    expect(n.rhythmConfig.durations).toContain("hr");
    expect(n.rhythmConfig.durations).toContain("h");
  });

  it("rhythm_2_4 is PRACTICE combining halves & rests", () => {
    const n = rhythmUnit2Nodes[3];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_2_5 is SPEED_ROUND with ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit2Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_2 is MINI_BOSS with patternTagMode 'any' and MIXED_LESSON exercise", () => {
    const boss = rhythmUnit2Nodes[5];
    expect(boss.id).toBe("boss_rhythm_2");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    expect(boss.isBoss).toBe(true);
  });

  it("REQ-04: every DISCOVERY node opens with discovery_intro keyed to focusDuration", () => {
    rhythmUnit2Nodes
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

  it("REQ-03 (concept-per-unit): union of focusDurations ⊆ {h, hr}", () => {
    const all = new Set();
    for (const n of rhythmUnit2Nodes) {
      for (const f of n.rhythmConfig.focusDurations || []) all.add(f);
    }
    for (const f of all) {
      expect(["h", "hr"]).toContain(f);
    }
  });

  it("XP arc is monotone non-decreasing through content; boss XP > content", () => {
    const xps = rhythmUnit2Nodes.map((n) => n.xpReward);
    for (let i = 1; i < 5; i++) {
      expect(xps[i]).toBeGreaterThanOrEqual(xps[i - 1]);
    }
    for (let i = 0; i < 5; i++) {
      expect(xps[5]).toBeGreaterThan(xps[i]);
    }
  });

  it("locked XP arc: [50, 55, 55, 60, 65, 110]", () => {
    expect(rhythmUnit2Nodes.map((n) => n.xpReward)).toEqual([
      50, 55, 55, 60, 65, 110,
    ]);
  });

  it("DISCOVERY nodes carry newContent=RHYTHM; PRACTICE nodes carry newContent=NONE", () => {
    expect(rhythmUnit2Nodes[0].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit2Nodes[2].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit2Nodes[1].newContent).toBe(NEW_CONTENT_TYPES.NONE);
    expect(rhythmUnit2Nodes[3].newContent).toBe(NEW_CONTENT_TYPES.NONE);
  });
});
