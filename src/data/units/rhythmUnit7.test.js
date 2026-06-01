// src/data/units/rhythmUnit7.test.js
// Phase 1 v3.5 — Unit 7 (Dotted Quarter Notes) invariants per 01-07-PLAN.md.
//
// Concept-per-unit (D-04 / D-14): U7 holds the {qd} family ONLY.
// hd lives in U6. Strict separation per D-04.

import { describe, it, expect } from "vitest";
import rhythmUnit7Nodes from "./rhythmUnit7.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 7 — Dotted Quarter Notes (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (non-duration arc)", () => {
    expect(rhythmUnit7Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit7Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs match the locked design", () => {
    expect(rhythmUnit7Nodes.map((n) => n.id)).toEqual([
      "rhythm_7_1",
      "rhythm_7_2",
      "rhythm_7_3",
      "rhythm_7_4",
      "rhythm_7_5",
      "boss_rhythm_7",
    ]);
  });

  it("orders are sequential starting at START_ORDER=160", () => {
    expect(rhythmUnit7Nodes.map((n) => n.order)).toEqual([
      160, 161, 162, 163, 164, 165,
    ]);
  });

  it("prerequisite chain: boss_rhythm_6 -> rhythm_7_1 -> ... -> boss_rhythm_7", () => {
    expect(rhythmUnit7Nodes[0].prerequisites).toEqual(["boss_rhythm_6"]);
    for (let i = 1; i < rhythmUnit7Nodes.length; i++) {
      expect(rhythmUnit7Nodes[i].prerequisites).toEqual([
        rhythmUnit7Nodes[i - 1].id,
      ]);
    }
  });

  it("all 6 nodes use timeSignature '4/4'", () => {
    rhythmUnit7Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit7Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes (0..4) have category 'rhythm'; boss has category 'boss'", () => {
    rhythmUnit7Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit7Nodes[5].category).toBe("boss");
  });

  it("rhythm_7_1 is a DISCOVERY introducing 'qd' (Dotted Quarter concept anchor)", () => {
    const n = rhythmUnit7Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["qd"]);
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(n.exercises[0].config.questions[0]).toMatchObject({
      type: "discovery_intro",
      focusDuration: "qd",
    });
  });

  it("rhythm_7_2 is a PRACTICE (no new concept)", () => {
    const n = rhythmUnit7Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_7_3 is a mixed-contrast DISCOVERY (empty focusDurations)", () => {
    const n = rhythmUnit7Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_7_4 is a PRACTICE", () => {
    expect(rhythmUnit7Nodes[3].nodeType).toBe(NODE_TYPES.PRACTICE);
  });

  it("rhythm_7_5 is a SPEED_ROUND using ARCADE_RHYTHM", () => {
    const n = rhythmUnit7Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_7 is a MINI_BOSS with patternTagMode 'any' and isBoss=true", () => {
    const n = rhythmUnit7Nodes[5];
    expect(n.id).toBe("boss_rhythm_7");
    expect(n.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(n.rhythmConfig.patternTagMode).toBe("any");
    expect(n.isBoss).toBe(true);
  });

  it("XP arc: 70, 75, 75, 80, 85, 150", () => {
    expect(rhythmUnit7Nodes.map((n) => n.xpReward)).toEqual([
      70, 75, 75, 80, 85, 150,
    ]);
  });

  it("concept-per-unit (D-04): focusDurations union is strictly {qd} — hd not present anywhere", () => {
    const allFocus = new Set();
    for (const n of rhythmUnit7Nodes) {
      for (const f of n.rhythmConfig.focusDurations || []) allFocus.add(f);
    }
    expect([...allFocus].sort()).toEqual(["qd"]);
    expect(allFocus.has("hd")).toBe(false);
  });

  it("default export shape (array)", () => {
    expect(Array.isArray(rhythmUnit7Nodes)).toBe(true);
  });
});
