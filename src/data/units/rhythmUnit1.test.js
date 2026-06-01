// Phase 1 v3.5 — Rhythm Unit 1 (Quarter + Quarter Rest) invariants test.
// Asserts the 6-node duration-unit arc per D-02 (Duration Intro → Practice
// → Rest Intro → Combined Practice → Speed → Mini-Boss) and the principle
// gates that the validator (Plan 01-01) will enforce statically once Plan
// 01-08 wires the file into expandedNodes.js.

import { describe, it, expect } from "vitest";
import rhythmUnit1Nodes from "./rhythmUnit1.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 1 — Quarter + Quarter Rest (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (5 content + 1 mini-boss per D-01/D-02)", () => {
    expect(rhythmUnit1Nodes).toHaveLength(6);
  });

  it("node IDs match the locked design (D-09 numeric convention)", () => {
    expect(rhythmUnit1Nodes.map((n) => n.id)).toEqual([
      "rhythm_1_1",
      "rhythm_1_2",
      "rhythm_1_3",
      "rhythm_1_4",
      "rhythm_1_5",
      "boss_rhythm_1",
    ]);
  });

  it("node IDs are unique within the unit", () => {
    const ids = rhythmUnit1Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("orderInUnit values are 1..5 for content + 6 for boss", () => {
    expect(rhythmUnit1Nodes.map((n) => n.orderInUnit)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("order numbers are sequential starting at START_ORDER=100", () => {
    expect(rhythmUnit1Nodes.map((n) => n.order)).toEqual([
      100, 101, 102, 103, 104, 105,
    ]);
  });

  it("prerequisite chain walks [] → rhythm_1_1 → ... → boss_rhythm_1", () => {
    expect(rhythmUnit1Nodes[0].prerequisites).toEqual([]);
    for (let i = 1; i < rhythmUnit1Nodes.length; i++) {
      expect(rhythmUnit1Nodes[i].prerequisites).toEqual([
        rhythmUnit1Nodes[i - 1].id,
      ]);
    }
  });

  it("all 6 nodes use timeSignature 4/4", () => {
    rhythmUnit1Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit1Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("first 5 nodes are category 'rhythm'; boss is category 'boss' (D-01)", () => {
    rhythmUnit1Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit1Nodes[5].category).toBe("boss");
  });

  it("all nodes are unit=1 with unitName 'Quarter + Quarter Rest'", () => {
    rhythmUnit1Nodes.forEach((node) => {
      expect(node.unit).toBe(1);
      expect(node.unitName).toBe("Quarter + Quarter Rest");
    });
  });

  it("rhythm_1_1 is DISCOVERY introducing quarter (REQ-01 anchor)", () => {
    const n = rhythmUnit1Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["q"]);
    expect(n.rhythmConfig.durations).toEqual(["q"]);
  });

  it("rhythm_1_2 is PRACTICE consolidating quarter (no new content)", () => {
    const n = rhythmUnit1Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
    expect(n.rhythmConfig.durations).toEqual(["q"]);
  });

  it("rhythm_1_3 is DISCOVERY introducing quarter rest (REQ-02 rest adjacent)", () => {
    const n = rhythmUnit1Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["qr"]);
    expect(n.rhythmConfig.durations).toEqual(["q", "qr"]);
  });

  it("rhythm_1_4 is PRACTICE combining q + qr", () => {
    const n = rhythmUnit1Nodes[3];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
    expect(n.rhythmConfig.durations).toEqual(["q", "qr"]);
  });

  it("rhythm_1_5 is SPEED_ROUND with ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit1Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
    expect(n.rhythmConfig.durations).toEqual(["q", "qr"]);
  });

  it("boss_rhythm_1 is MINI_BOSS with patternTagMode 'any' and MIXED_LESSON exercise", () => {
    const boss = rhythmUnit1Nodes[5];
    expect(boss.id).toBe("boss_rhythm_1");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    expect(boss.isBoss).toBe(true);
  });

  it("REQ-04: every DISCOVERY node starts with discovery_intro as its first question", () => {
    rhythmUnit1Nodes
      .filter((n) => n.nodeType === NODE_TYPES.DISCOVERY)
      .forEach((node) => {
        const firstQ = node.exercises[0].config.questions[0];
        expect(firstQ.type).toBe("discovery_intro");
        // focusDuration carries the concept being introduced.
        expect(typeof firstQ.focusDuration).toBe("string");
        expect(node.rhythmConfig.focusDurations).toContain(
          firstQ.focusDuration
        );
      });
  });

  it("REQ-03 (concept-per-unit): union of focusDurations ⊆ {q, qr}", () => {
    const all = new Set();
    for (const n of rhythmUnit1Nodes) {
      for (const f of n.rhythmConfig.focusDurations || []) all.add(f);
    }
    for (const f of all) {
      expect(["q", "qr"]).toContain(f);
    }
  });

  it("XP arc is monotone non-decreasing through content nodes and boss XP > content", () => {
    const xps = rhythmUnit1Nodes.map((n) => n.xpReward);
    // 5 content node XP arc monotone non-decreasing.
    for (let i = 1; i < 5; i++) {
      expect(xps[i]).toBeGreaterThanOrEqual(xps[i - 1]);
    }
    // Boss XP strictly greater than every content XP (mini-boss policy 100-150).
    for (let i = 0; i < 5; i++) {
      expect(xps[5]).toBeGreaterThan(xps[i]);
    }
  });

  it("locked XP arc: [45, 50, 50, 55, 60, 100]", () => {
    expect(rhythmUnit1Nodes.map((n) => n.xpReward)).toEqual([
      45, 50, 50, 55, 60, 100,
    ]);
  });

  it("MIXED_LESSON nodes have newContent=RHYTHM on discovery nodes; PRACTICE nodes have newContent=NONE", () => {
    expect(rhythmUnit1Nodes[0].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit1Nodes[2].newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(rhythmUnit1Nodes[1].newContent).toBe(NEW_CONTENT_TYPES.NONE);
    expect(rhythmUnit1Nodes[3].newContent).toBe(NEW_CONTENT_TYPES.NONE);
  });
});
