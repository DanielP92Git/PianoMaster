// src/data/units/rhythmUnit6.test.js
// Phase 1 v3.5 — Unit 6 (Dotted Half Notes) invariants per 01-07-PLAN.md.
//
// Concept-per-unit (D-04 / D-14): U6 holds the {hd} family ONLY.
// qd lives in U7. Strict separation per D-04.

import { describe, it, expect } from "vitest";
import rhythmUnit6Nodes from "./rhythmUnit6.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 6 — Dotted Half Notes (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (non-duration arc: Intro/Practice/Discovery-contrast/Practice/Speed/Mini-Boss)", () => {
    expect(rhythmUnit6Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit6Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs match the locked design", () => {
    expect(rhythmUnit6Nodes.map((n) => n.id)).toEqual([
      "rhythm_6_1",
      "rhythm_6_2",
      "rhythm_6_3",
      "rhythm_6_4",
      "rhythm_6_5",
      "boss_rhythm_6",
    ]);
  });

  it("orders are sequential starting at START_ORDER=150", () => {
    expect(rhythmUnit6Nodes.map((n) => n.order)).toEqual([
      150, 151, 152, 153, 154, 155,
    ]);
  });

  it("prerequisite chain: boss_rhythm_5 -> rhythm_6_1 -> ... -> boss_rhythm_6", () => {
    expect(rhythmUnit6Nodes[0].prerequisites).toEqual(["boss_rhythm_5"]);
    for (let i = 1; i < rhythmUnit6Nodes.length; i++) {
      expect(rhythmUnit6Nodes[i].prerequisites).toEqual([
        rhythmUnit6Nodes[i - 1].id,
      ]);
    }
  });

  it("all 6 nodes use timeSignature '4/4' (dotted-half lives in 4/4; meter introduction is U8)", () => {
    rhythmUnit6Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 6 nodes use pitch C4", () => {
    rhythmUnit6Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes (0..4) have category 'rhythm'; boss has category 'boss'", () => {
    rhythmUnit6Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit6Nodes[5].category).toBe("boss");
  });

  it("rhythm_6_1 is a DISCOVERY introducing 'hd' (Dotted Half concept anchor)", () => {
    const n = rhythmUnit6Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual(["hd"]);
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(n.exercises[0].config.questions[0]).toMatchObject({
      type: "discovery_intro",
      focusDuration: "hd",
    });
  });

  it("rhythm_6_2 is a PRACTICE (no new concept)", () => {
    const n = rhythmUnit6Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_6_3 is a mixed-contrast DISCOVERY (empty focusDurations — no NEW concept)", () => {
    const n = rhythmUnit6Nodes[2];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_6_4 is a PRACTICE", () => {
    expect(rhythmUnit6Nodes[3].nodeType).toBe(NODE_TYPES.PRACTICE);
  });

  it("rhythm_6_5 is a SPEED_ROUND using ARCADE_RHYTHM", () => {
    const n = rhythmUnit6Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_6 is a MINI_BOSS with patternTagMode 'any' and isBoss=true", () => {
    const n = rhythmUnit6Nodes[5];
    expect(n.id).toBe("boss_rhythm_6");
    expect(n.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(n.rhythmConfig.patternTagMode).toBe("any");
    expect(n.isBoss).toBe(true);
  });

  it("XP arc: 65, 70, 70, 75, 80, 140", () => {
    expect(rhythmUnit6Nodes.map((n) => n.xpReward)).toEqual([
      65, 70, 70, 75, 80, 140,
    ]);
  });

  it("concept-per-unit (D-04): focusDurations union is strictly {hd} — qd not present anywhere", () => {
    const allFocus = new Set();
    for (const n of rhythmUnit6Nodes) {
      for (const f of n.rhythmConfig.focusDurations || []) allFocus.add(f);
    }
    // Only 'hd' should appear as a focus duration in this unit
    expect([...allFocus].sort()).toEqual(["hd"]);
    expect(allFocus.has("qd")).toBe(false);
  });

  it("default export shape (array)", () => {
    expect(Array.isArray(rhythmUnit6Nodes)).toBe(true);
  });
});
