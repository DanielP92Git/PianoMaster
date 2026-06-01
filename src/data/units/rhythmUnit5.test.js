import { describe, it, expect } from "vitest";
import rhythmUnit5Nodes from "./rhythmUnit5.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

// Phase 1 v3.5 — Unit 5: Sixteenth Notes (second subdivision per D-01, D-05).
// 6-node NON-DURATION arc per D-02: Intro → Practice → Discovery (mixed contrast)
// → Practice → Speed → Mini-Boss.
// orderInUnit=3 is a mixed-contrast DISCOVERY with empty focusDurations (no new
// concept introduced — pairs sixteenths with prior q/8 for ear training).

describe("Rhythm Unit 5 — Sixteenth Notes (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (5 content + 1 mini-boss per D-01/D-02)", () => {
    expect(rhythmUnit5Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit5Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs match the locked design", () => {
    expect(rhythmUnit5Nodes.map((n) => n.id)).toEqual([
      "rhythm_5_1",
      "rhythm_5_2",
      "rhythm_5_3",
      "rhythm_5_4",
      "rhythm_5_5",
      "boss_rhythm_5",
    ]);
  });

  it("orders are sequential from 140 to 145", () => {
    expect(rhythmUnit5Nodes.map((n) => n.order)).toEqual([
      140, 141, 142, 143, 144, 145,
    ]);
  });

  it("prerequisite chain is valid (first prereq=boss_rhythm_4, then sequential)", () => {
    expect(rhythmUnit5Nodes[0].prerequisites).toEqual(["boss_rhythm_4"]);
    for (let i = 1; i < rhythmUnit5Nodes.length; i++) {
      expect(rhythmUnit5Nodes[i].prerequisites).toEqual([
        rhythmUnit5Nodes[i - 1].id,
      ]);
    }
  });

  it("all nodes use timeSignature 4/4", () => {
    rhythmUnit5Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all nodes use pitch C4", () => {
    rhythmUnit5Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes use category 'rhythm'; boss uses 'boss'", () => {
    rhythmUnit5Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit5Nodes[5].category).toBe("boss");
  });

  it("rhythm_5_1 introduces sixteenths — focusDurations includes '16'", () => {
    const n = rhythmUnit5Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toContain("16");
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
  });

  it("rhythm_5_1 has discovery_intro as first question with focusDuration='16'", () => {
    const n = rhythmUnit5Nodes[0];
    const firstQ = n.exercises[0].config.questions[0];
    expect(firstQ.type).toBe("discovery_intro");
    expect(firstQ.focusDuration).toBe("16");
  });

  it("rhythm_5_2 is PRACTICE with empty focusDurations and durations=['q','16']", () => {
    const n = rhythmUnit5Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
    expect(n.rhythmConfig.durations).toEqual(["q", "16"]);
  });

  it("orderInUnit=3 discovery has NO new concept (empty focusDurations) — mixed contrast only", () => {
    const node3 = rhythmUnit5Nodes.find((n) => n.orderInUnit === 3);
    expect(node3.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(node3.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_5_3 has NO discovery_intro question (mixed-contrast Discovery is not introducing a concept)", () => {
    const n = rhythmUnit5Nodes[2];
    const questionTypes = n.exercises[0].config.questions.map((q) => q.type);
    expect(questionTypes).not.toContain("discovery_intro");
  });

  it("rhythm_5_4 is PRACTICE with empty focusDurations", () => {
    const n = rhythmUnit5Nodes[3];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_5_5 is SPEED_ROUND using ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit5Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_5 is MINI_BOSS with patternTagMode='any' and category='boss'", () => {
    const boss = rhythmUnit5Nodes[5];
    expect(boss.id).toBe("boss_rhythm_5");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.category).toBe("boss");
    expect(boss.isBoss).toBe(true);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
  });

  it("boss_rhythm_5 exercise is MIXED_LESSON with 10–12 questions (boss policy)", () => {
    const boss = rhythmUnit5Nodes[5];
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    const count = boss.exercises[0].config.questions.length;
    expect(count).toBeGreaterThanOrEqual(10);
    expect(count).toBeLessThanOrEqual(12);
  });

  it("U5 stays within the sixteenths concept family {16} (D-14)", () => {
    const ALLOWED = new Set(["16"]);
    rhythmUnit5Nodes.forEach((node) => {
      const focus = node.rhythmConfig.focusDurations || [];
      focus.forEach((d) => {
        expect(ALLOWED.has(d)).toBe(true);
      });
    });
  });

  it("only rhythm_5_1 has discovery_intro (non-duration arc — second discovery is contrast-only)", () => {
    let introCount = 0;
    rhythmUnit5Nodes.forEach((node) => {
      const questions = node.exercises[0]?.config?.questions || [];
      questions.forEach((q) => {
        if (q.type === "discovery_intro") introCount++;
      });
    });
    expect(introCount).toBe(1);
  });

  it("xpReward arc is monotone non-decreasing across content nodes, boss is highest", () => {
    const regularXp = rhythmUnit5Nodes.slice(0, 5).map((n) => n.xpReward);
    for (let i = 1; i < regularXp.length; i++) {
      expect(regularXp[i]).toBeGreaterThanOrEqual(regularXp[i - 1]);
    }
    expect(rhythmUnit5Nodes[5].xpReward).toBeGreaterThan(
      regularXp[regularXp.length - 1]
    );
  });

  it("XP arc matches plan spec (rhythm_5_1..5_5 = 60/65/65/70/75; boss=130)", () => {
    const xps = rhythmUnit5Nodes.map((n) => n.xpReward);
    expect(xps).toEqual([60, 65, 65, 70, 75, 130]);
  });

  it("XP for U5 is slightly higher than U4 (sixteenths technically harder per RESEARCH)", () => {
    // U4 first content xpReward is 55; U5 first content xpReward is 60.
    // Asserts the per-RESEARCH "higher than U4" rule indirectly via expected values.
    expect(rhythmUnit5Nodes[0].xpReward).toBeGreaterThanOrEqual(60);
  });

  it("exercise types match game-type policy", () => {
    const types = rhythmUnit5Nodes.map((n) => n.exercises[0].type);
    expect(types).toEqual([
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_5_1 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_5_2 (practice)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_5_3 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_5_4 (practice)
      EXERCISE_TYPES.ARCADE_RHYTHM, // rhythm_5_5 (speed_round)
      EXERCISE_TYPES.MIXED_LESSON, // boss_rhythm_5 (mini_boss)
    ]);
  });

  it("rhythm_5_1 patternTags include 'sixteenth'", () => {
    const n = rhythmUnit5Nodes[0];
    expect(n.rhythmConfig.patternTags).toContain("sixteenth");
  });
});
