import { describe, it, expect } from "vitest";
import { rhythmUnit8Nodes } from "./rhythmUnit8Redesigned.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

// ─── Asserts the 7-node monomodal design from quick task 260524-l3r ─────────

describe("Rhythm Unit Syncopation (HIDDEN, renamed from rhythm_8_*)", () => {
  it("exports exactly 7 nodes", () => {
    expect(rhythmUnit8Nodes).toHaveLength(7);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit8Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("node IDs match the locked design", () => {
    const expectedIds = [
      "rhythm_synco_1",
      "rhythm_synco_2",
      "rhythm_synco_3",
      "rhythm_synco_4",
      "rhythm_synco_5",
      "rhythm_synco_6",
      "boss_rhythm_synco",
    ];
    expect(rhythmUnit8Nodes.map((n) => n.id)).toEqual(expectedIds);
  });

  it("orders are sequential 144-150", () => {
    expect(rhythmUnit8Nodes.map((n) => n.order)).toEqual([
      144, 145, 146, 147, 148, 149, 150,
    ]);
  });

  it("prerequisite chain walks boss_rhythm_7 → rhythm_synco_1 → ... → boss_rhythm_synco", () => {
    expect(rhythmUnit8Nodes[0].prerequisites).toEqual(["boss_rhythm_7"]);
    for (let i = 1; i < rhythmUnit8Nodes.length; i++) {
      expect(rhythmUnit8Nodes[i].prerequisites).toEqual([
        rhythmUnit8Nodes[i - 1].id,
      ]);
    }
  });

  it("all 7 nodes use timeSignature 4/4", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all 7 nodes use pitch C4", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes (0..5) use category 'rhythm'; boss uses 'boss'", () => {
    rhythmUnit8Nodes.slice(0, 6).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit8Nodes[6].category).toBe("boss");
  });

  it("node 1 is the Hold-Across warm-up — q-h-q, decision-A safe (NOT framed as syncopation)", () => {
    const n = rhythmUnit8Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.durations).toEqual(["q", "h"]);
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
    expect(n.newContentDescription).toMatch(/hold/i);
    // Decision A guard — q-h-q is NOT called "syncopation" in child copy.
    expect(n.newContentDescription).not.toMatch(/syncopa/i);
  });

  it("node 2 is the headline syncopation discovery — strict 8-q-8", () => {
    const n = rhythmUnit8Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.durations).toEqual(["8", "q"]);
    expect(n.rhythmConfig.patternTags).toEqual(["syncopation"]); // strict
    expect(n.newContentDescription).toMatch(/syncopa/i);
  });

  it("node 5 contains exactly one compose_rhythm question with 4-6 tiles and slotCount=2", () => {
    const n = rhythmUnit8Nodes[4];
    expect(n.id).toBe("rhythm_synco_5");
    const questions = n.exercises[0].config.questions;
    const composeEntries = questions.filter((q) => q.type === "compose_rhythm");
    expect(composeEntries).toHaveLength(1);
    const compose = composeEntries[0];
    expect(compose.slotCount).toBe(2);
    expect(compose.tiles.length).toBeGreaterThanOrEqual(4);
    expect(compose.tiles.length).toBeLessThanOrEqual(6);
    // Every tile binary must sum to 16 sixteenth-note units (one 4/4 bar)
    // when measured by binaryPatternToBeats. We assert here via the raw
    // array length — binaryPatternToBeats consumes one cell per sixteenth.
    compose.tiles.forEach((tile) => {
      expect(Array.isArray(tile.binary)).toBe(true);
      expect(tile.binary.length).toBe(16);
    });
  });

  it("node 6 is SPEED_ROUND with ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit8Nodes[5];
    expect(n.id).toBe("rhythm_synco_6");
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss has correct id, isBoss flag, XP reward and accessory unlock", () => {
    const boss = rhythmUnit8Nodes[6];
    expect(boss.id).toBe("boss_rhythm_synco");
    expect(boss.isBoss).toBe(true);
    expect(boss.nodeType).toBe(NODE_TYPES.BOSS);
    expect(boss.xpReward).toBe(250);
    expect(boss.accessoryUnlock).toBe("advanced_rhythm_badge");
  });

  it("boss exercise is MIXED_LESSON with exactly 10 questions", () => {
    const boss = rhythmUnit8Nodes[6];
    expect(boss.exercises).toHaveLength(1);
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    expect(boss.exercises[0].config.questions).toHaveLength(10);
  });

  it("boss patternTags is exactly ['syncopation-heavy'] and durations is exactly [q,h,8]", () => {
    const boss = rhythmUnit8Nodes[6];
    expect(boss.rhythmConfig.patternTags).toEqual(["syncopation-heavy"]);
    expect(boss.rhythmConfig.durations).toEqual(["q", "h", "8"]);
  });

  it("boss skills do NOT include 68_compound_meter (capstone is syncopation-only)", () => {
    const boss = rhythmUnit8Nodes[6];
    expect(boss.skills).not.toContain("68_compound_meter");
    expect(boss.skills).toContain("syncopation_long_value");
    expect(boss.skills).toContain("syncopation_eighth_quarter");
  });

  it("regular-node XP arc equals [60, 80, 85, 85, 100, 90]", () => {
    const xps = rhythmUnit8Nodes.slice(0, 6).map((n) => n.xpReward);
    expect(xps).toEqual([60, 80, 85, 85, 100, 90]);
  });

  it("tempo increases across the unit", () => {
    const firstTempo = rhythmUnit8Nodes[0].rhythmConfig.tempo.default;
    const lastRegularTempo = rhythmUnit8Nodes[5].rhythmConfig.tempo.default;
    expect(firstTempo).toBeLessThan(lastRegularTempo);
  });

  it("no Unit 8 node references the dropped long-syncopation, dotted-syncopation, or dotted-quarter tags", () => {
    rhythmUnit8Nodes.forEach((node) => {
      const tags = node.rhythmConfig.patternTags || [];
      expect(tags).not.toContain("long-syncopation");
      expect(tags).not.toContain("dotted-syncopation");
      expect(tags).not.toContain("dotted-quarter");
    });
  });

  it("no Unit 8 node carries the syncopation_dotted_quarter skill", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.skills || []).not.toContain("syncopation_dotted_quarter");
    });
  });
});

// DATA-04 "Combined-values node variety" block removed in Phase 1 v3.5 (Plan 10
// Task 2 / Option 2): the assertions read OLD-semantics rhythm_{1,2,3}_4 IDs
// from the deleted rhythmUnit{1,2,3}Redesigned.js files. The same variety
// invariant is now covered by Plan 08's rhythmUnits.difficulty.test.js against
// the v3.5 unit files.
