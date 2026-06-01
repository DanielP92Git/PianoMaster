import { describe, it, expect } from "vitest";
import rhythmUnit4Nodes from "./rhythmUnit4.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

// Phase 1 v3.5 — Unit 4: Eighth Notes (first subdivision per D-01, D-05).
// 6-node NON-DURATION arc per D-02: Intro → Practice → Discovery (mixed contrast)
// → Practice → Speed → Mini-Boss.
// orderInUnit=3 is a mixed-contrast DISCOVERY with empty focusDurations (no new
// concept introduced — pairs eighths with prior q/h for ear training).

describe("Rhythm Unit 4 — Eighth Notes (Phase 1 v3.5)", () => {
  it("exports exactly 6 nodes (5 content + 1 mini-boss per D-01/D-02)", () => {
    expect(rhythmUnit4Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit4Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs match the locked design", () => {
    expect(rhythmUnit4Nodes.map((n) => n.id)).toEqual([
      "rhythm_4_1",
      "rhythm_4_2",
      "rhythm_4_3",
      "rhythm_4_4",
      "rhythm_4_5",
      "boss_rhythm_4",
    ]);
  });

  it("orders are sequential from 130 to 135", () => {
    expect(rhythmUnit4Nodes.map((n) => n.order)).toEqual([
      130, 131, 132, 133, 134, 135,
    ]);
  });

  it("prerequisite chain is valid (first prereq=boss_rhythm_3, then sequential)", () => {
    expect(rhythmUnit4Nodes[0].prerequisites).toEqual(["boss_rhythm_3"]);
    for (let i = 1; i < rhythmUnit4Nodes.length; i++) {
      expect(rhythmUnit4Nodes[i].prerequisites).toEqual([
        rhythmUnit4Nodes[i - 1].id,
      ]);
    }
  });

  it("all nodes use timeSignature 4/4", () => {
    rhythmUnit4Nodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all nodes use pitch C4", () => {
    rhythmUnit4Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("regular nodes use category 'rhythm'; boss uses 'boss'", () => {
    rhythmUnit4Nodes.slice(0, 5).forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
    expect(rhythmUnit4Nodes[5].category).toBe("boss");
  });

  it("rhythm_4_1 introduces eighths — focusDurations includes '8_pair' (subdivision concept anchor)", () => {
    const n = rhythmUnit4Nodes[0];
    expect(n.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(n.rhythmConfig.focusDurations).toContain("8_pair");
    expect(n.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
  });

  it("rhythm_4_1 has discovery_intro as first question with focusDuration='8_pair'", () => {
    const n = rhythmUnit4Nodes[0];
    const firstQ = n.exercises[0].config.questions[0];
    expect(firstQ.type).toBe("discovery_intro");
    expect(firstQ.focusDuration).toBe("8_pair");
  });

  it("rhythm_4_2 is PRACTICE with empty focusDurations and durations=['q','8']", () => {
    const n = rhythmUnit4Nodes[1];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
    expect(n.rhythmConfig.durations).toEqual(["q", "8"]);
  });

  it("orderInUnit=3 discovery has NO new concept (empty focusDurations) — mixed contrast only", () => {
    const node3 = rhythmUnit4Nodes.find((n) => n.orderInUnit === 3);
    expect(node3.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(node3.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_4_3 has NO discovery_intro question (mixed-contrast Discovery is not introducing a concept)", () => {
    const n = rhythmUnit4Nodes[2];
    const questionTypes = n.exercises[0].config.questions.map((q) => q.type);
    expect(questionTypes).not.toContain("discovery_intro");
  });

  it("rhythm_4_4 is PRACTICE with empty focusDurations", () => {
    const n = rhythmUnit4Nodes[3];
    expect(n.nodeType).toBe(NODE_TYPES.PRACTICE);
    expect(n.rhythmConfig.focusDurations).toEqual([]);
  });

  it("rhythm_4_5 is SPEED_ROUND using ARCADE_RHYTHM exercise type", () => {
    const n = rhythmUnit4Nodes[4];
    expect(n.nodeType).toBe(NODE_TYPES.SPEED_ROUND);
    expect(n.exercises[0].type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });

  it("boss_rhythm_4 is MINI_BOSS with patternTagMode='any' and category='boss'", () => {
    const boss = rhythmUnit4Nodes[5];
    expect(boss.id).toBe("boss_rhythm_4");
    expect(boss.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(boss.category).toBe("boss");
    expect(boss.isBoss).toBe(true);
    expect(boss.rhythmConfig.patternTagMode).toBe("any");
  });

  it("boss_rhythm_4 exercise is MIXED_LESSON with 10–12 questions (boss policy)", () => {
    const boss = rhythmUnit4Nodes[5];
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    const count = boss.exercises[0].config.questions.length;
    expect(count).toBeGreaterThanOrEqual(10);
    expect(count).toBeLessThanOrEqual(12);
  });

  it("U4 stays within the eighths concept family {8, 8_pair} (D-14)", () => {
    const ALLOWED = new Set(["8", "8_pair"]);
    rhythmUnit4Nodes.forEach((node) => {
      const focus = node.rhythmConfig.focusDurations || [];
      focus.forEach((d) => {
        expect(ALLOWED.has(d)).toBe(true);
      });
    });
  });

  it("only rhythm_4_1 has discovery_intro (non-duration arc — second discovery is contrast-only)", () => {
    let introCount = 0;
    rhythmUnit4Nodes.forEach((node) => {
      const questions = node.exercises[0]?.config?.questions || [];
      questions.forEach((q) => {
        if (q.type === "discovery_intro") introCount++;
      });
    });
    expect(introCount).toBe(1);
  });

  it("xpReward arc is monotone non-decreasing across content nodes, boss is highest", () => {
    const regularXp = rhythmUnit4Nodes.slice(0, 5).map((n) => n.xpReward);
    for (let i = 1; i < regularXp.length; i++) {
      expect(regularXp[i]).toBeGreaterThanOrEqual(regularXp[i - 1]);
    }
    expect(rhythmUnit4Nodes[5].xpReward).toBeGreaterThan(
      regularXp[regularXp.length - 1]
    );
  });

  it("exercise types match game-type policy (mixed_lesson for discovery/practice/mini_boss, arcade_rhythm for speed_round)", () => {
    const types = rhythmUnit4Nodes.map((n) => n.exercises[0].type);
    expect(types).toEqual([
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_4_1 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_4_2 (practice)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_4_3 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_4_4 (practice)
      EXERCISE_TYPES.ARCADE_RHYTHM, // rhythm_4_5 (speed_round)
      EXERCISE_TYPES.MIXED_LESSON, // boss_rhythm_4 (mini_boss)
    ]);
  });
});
