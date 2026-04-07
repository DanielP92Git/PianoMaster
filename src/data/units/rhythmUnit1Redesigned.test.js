import { describe, it, expect } from "vitest";
import { rhythmUnit1Nodes } from "./rhythmUnit1Redesigned.js";
import { NODE_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 1 — Basic Beats", () => {
  it("exports exactly 7 nodes", () => {
    expect(rhythmUnit1Nodes).toHaveLength(7);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit1Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("node IDs follow naming convention", () => {
    const ids = rhythmUnit1Nodes.map((n) => n.id);
    expect(ids).toEqual([
      "rhythm_1_1",
      "rhythm_1_2",
      "rhythm_1_3",
      "rhythm_1_4",
      "rhythm_1_5",
      "rhythm_1_6",
      "boss_rhythm_1",
    ]);
  });

  it("orders are sequential from 100 to 106", () => {
    const orders = rhythmUnit1Nodes.map((n) => n.order);
    expect(orders).toEqual([100, 101, 102, 103, 104, 105, 106]);
  });

  it("prerequisite chain is valid", () => {
    // First node has no prerequisites
    expect(rhythmUnit1Nodes[0].prerequisites).toEqual([]);
    // Each subsequent node requires the previous node's ID
    for (let i = 1; i < rhythmUnit1Nodes.length; i++) {
      expect(rhythmUnit1Nodes[i].prerequisites).toEqual([
        rhythmUnit1Nodes[i - 1].id,
      ]);
    }
  });

  it("all nodes use pitch C4", () => {
    rhythmUnit1Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("last node is mini-boss with correct properties", () => {
    const last = rhythmUnit1Nodes[rhythmUnit1Nodes.length - 1];
    expect(last.id).toBe("boss_rhythm_1");
    expect(last.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(last.category).toBe("boss");
    expect(last.isBoss).toBe(false);
  });

  it("regular nodes use rhythm category", () => {
    for (let i = 0; i < 6; i++) {
      expect(rhythmUnit1Nodes[i].category).toBe("rhythm");
    }
  });

  it("xpReward values are in valid range", () => {
    // Regular nodes: 35-60, mini-boss: 100+
    for (let i = 0; i < 6; i++) {
      const xp = rhythmUnit1Nodes[i].xpReward;
      expect(xp).toBeGreaterThanOrEqual(30);
      expect(xp).toBeLessThanOrEqual(90);
    }
    expect(rhythmUnit1Nodes[6].xpReward).toBeGreaterThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TDD RED: Pulse exercise tests — these will FAIL until Plan 02 migrates Unit 1
// ─────────────────────────────────────────────────────────────────────────────

describe("Rhythm Unit 1 — Pulse Exercise (Plan 02 TDD RED)", () => {
  it("Node 1 first exercise has type RHYTHM_PULSE", () => {
    // RED until Plan 02 migrates rhythm_1_1 to use EXERCISE_TYPES.RHYTHM_PULSE
    expect(rhythmUnit1Nodes[0].exercises[0].type).toBe(
      EXERCISE_TYPES.RHYTHM_PULSE
    );
  });

  it("Node 1 pulse exercise config has pulseOnly: true", () => {
    // RED until Plan 02
    expect(rhythmUnit1Nodes[0].exercises[0].config.pulseOnly).toBe(true);
  });

  it("Node 1 pulse exercise config has correct tempo and beats", () => {
    // RED until Plan 02
    expect(rhythmUnit1Nodes[0].exercises[0].config.tempo).toBe(65);
    expect(rhythmUnit1Nodes[0].exercises[0].config.beats).toBe(8);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TDD RED: Migration shape tests — these will FAIL until Plan 02 migrates Unit 1
// ─────────────────────────────────────────────────────────────────────────────

describe("Rhythm Unit 1 — PatternTags Migration Shape (Plan 02 TDD RED)", () => {
  it("no exercise config has old rhythmPatterns field", () => {
    // RED until Plan 02 removes old rhythmPatterns from all configs
    rhythmUnit1Nodes.forEach((node) => {
      node.exercises.forEach((exercise) => {
        expect(exercise.config).not.toHaveProperty("rhythmPatterns");
      });
    });
  });

  it("every non-pulse exercise has config.patternTags array", () => {
    // RED until Plan 02 adds patternTags to all non-pulse exercise configs
    rhythmUnit1Nodes.forEach((node) => {
      node.exercises.forEach((exercise) => {
        if (exercise.type !== EXERCISE_TYPES.RHYTHM_PULSE) {
          expect(Array.isArray(exercise.config.patternTags)).toBe(true);
        }
      });
    });
  });
});
