import { describe, it, expect } from "vitest";
import { rhythmUnit8Nodes } from "./rhythmUnit8Redesigned.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";
import { rhythmUnit1Nodes } from "./rhythmUnit1Redesigned.js";
import { rhythmUnit2Nodes } from "./rhythmUnit2Redesigned.js";
import { rhythmUnit3Nodes } from "./rhythmUnit3Redesigned.js";
import { resolveByTags } from "../patterns/RhythmPatternGenerator.js";

describe("Rhythm Unit 8 — Syncopation", () => {
  it("exports exactly 6 nodes", () => {
    expect(rhythmUnit8Nodes).toHaveLength(6);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit8Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("node IDs follow naming convention", () => {
    const expectedIds = [
      "rhythm_8_1",
      "rhythm_8_2",
      "rhythm_8_3",
      "rhythm_8_4",
      "rhythm_8_6",
      "boss_rhythm_8",
    ];
    const actualIds = rhythmUnit8Nodes.map((n) => n.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it("orders are sequential from 144 to 149", () => {
    const orders = rhythmUnit8Nodes.map((n) => n.order);
    expect(orders).toEqual([144, 145, 146, 147, 148, 149]);
  });

  it("prerequisite chain is valid", () => {
    // First node must prerequisite boss_rhythm_7
    expect(rhythmUnit8Nodes[0].prerequisites).toEqual(["boss_rhythm_7"]);

    // Each subsequent node prereqs the previous node's ID
    for (let i = 1; i < rhythmUnit8Nodes.length; i++) {
      expect(rhythmUnit8Nodes[i].prerequisites).toEqual([
        rhythmUnit8Nodes[i - 1].id,
      ]);
    }
  });

  it("regular nodes use 4/4 time signature", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 5);
    regularNodes.forEach((node) => {
      expect(node.rhythmConfig.timeSignature).toBe("4/4");
    });
  });

  it("all nodes use pitch C4", () => {
    rhythmUnit8Nodes.forEach((node) => {
      expect(node.rhythmConfig.pitch).toBe("C4");
    });
  });

  it("first node is syncopation discovery", () => {
    const firstNode = rhythmUnit8Nodes[0];
    expect(firstNode.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(firstNode.newContentDescription).toBe(
      "Syncopation: Tap between the beats!"
    );
    expect(firstNode.newContent).toBe(NEW_CONTENT_TYPES.RHYTHM);
  });

  it("third node introduces dotted quarter-eighth", () => {
    const thirdNode = rhythmUnit8Nodes[2];
    expect(thirdNode.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(thirdNode.rhythmConfig.durations).toContain("qd");
    expect(thirdNode.newContentDescription).toBe(
      "Dotted Quarter-Eighth Syncopation"
    );
  });

  it("regular nodes use rhythm category", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 5);
    regularNodes.forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
  });

  it("regular node exercise types match game-type policy (mixed_lesson for discovery/practice, arcade_rhythm for speed_round)", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 5);
    const types = regularNodes.map((n) => n.exercises[0].type);
    expect(types).toEqual([
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_1 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_2 (practice)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_3 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_4 (practice)
      EXERCISE_TYPES.ARCADE_RHYTHM, // rhythm_8_6 (speed_round)
    ]);
  });

  it("boss node exercise is MIXED_LESSON", () => {
    const bossNode = rhythmUnit8Nodes[rhythmUnit8Nodes.length - 1];
    expect(bossNode.exercises).toHaveLength(1);
    expect(bossNode.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
  });
});

describe("Rhythm Unit 8 — Boss Challenge", () => {
  const bossNode = rhythmUnit8Nodes[rhythmUnit8Nodes.length - 1];

  it("boss node has correct ID and properties", () => {
    expect(bossNode.id).toBe("boss_rhythm_8");
    expect(bossNode.nodeType).toBe(NODE_TYPES.BOSS);
    expect(bossNode.category).toBe("boss");
    expect(bossNode.isBoss).toBe(true);
  });

  it("boss has 250 XP reward", () => {
    expect(bossNode.xpReward).toBe(250);
  });

  it("boss has accessory unlock", () => {
    expect(bossNode.accessoryUnlock).toBe("advanced_rhythm_badge");
  });

  it("boss has 1 MIXED_LESSON exercise with 12 questions", () => {
    expect(bossNode.exercises).toHaveLength(1);
    expect(bossNode.exercises[0].type).toBe(EXERCISE_TYPES.MIXED_LESSON);
    expect(bossNode.exercises[0].config.questions).toHaveLength(12);
  });

  it("tempo increases across the unit", () => {
    // Compare first regular node default tempo vs last regular node (index 4) default tempo
    const firstTempo = rhythmUnit8Nodes[0].rhythmConfig.tempo.default;
    const lastRegularTempo = rhythmUnit8Nodes[4].rhythmConfig.tempo.default;
    expect(firstTempo).toBeLessThan(lastRegularTempo);
  });

  it("xpReward values are in valid range", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 5);
    regularNodes.forEach((node) => {
      expect(node.xpReward).toBeGreaterThanOrEqual(75);
      expect(node.xpReward).toBeLessThanOrEqual(90);
    });
    expect(bossNode.xpReward).toBe(250);
  });
});

describe("Combined-values node variety (DATA-04)", () => {
  /**
   * For each practice/mix-up node with 2+ duration codes, calls resolveByTags
   * 20 times and verifies that at least 2 different duration codes appear across
   * the combined vexDurations output. This is a statistical smoke test.
   */
  const SAMPLES = 20;

  function collectDurationCodes(patternTags, durations) {
    const seen = new Set();
    for (let i = 0; i < SAMPLES; i++) {
      const result = resolveByTags(patternTags, durations);
      if (result) {
        result.vexDurations
          .filter((d) => !d.endsWith("r"))
          .forEach((d) => seen.add(d));
      }
    }
    return seen;
  }

  it("rhythm_1_4 (quarter-only + quarter-half, durations q+h) produces both q and h over 20 samples", () => {
    const node = rhythmUnit1Nodes.find((n) => n.id === "rhythm_1_4");
    expect(node).toBeDefined();
    const seen = collectDurationCodes(
      node.rhythmConfig.patternTags,
      node.rhythmConfig.durations
    );
    expect(seen.has("q")).toBe(true);
    expect(seen.has("h")).toBe(true);
  });

  it("rhythm_2_4 (quarter-half + quarter-half-whole, durations q+h+w) produces q, h, and w over 20 samples", () => {
    const node = rhythmUnit2Nodes.find((n) => n.id === "rhythm_2_4");
    expect(node).toBeDefined();
    const seen = collectDurationCodes(
      node.rhythmConfig.patternTags,
      node.rhythmConfig.durations
    );
    expect(seen.has("q")).toBe(true);
    expect(seen.has("h")).toBe(true);
    expect(seen.has("w")).toBe(true);
  });

  it("rhythm_3_4 (quarter-eighth + quarter-half-whole-eighth, durations q+h+w+8) produces q and 8 over 20 samples", () => {
    const node = rhythmUnit3Nodes.find((n) => n.id === "rhythm_3_4");
    expect(node).toBeDefined();
    const seen = collectDurationCodes(
      node.rhythmConfig.patternTags,
      node.rhythmConfig.durations
    );
    expect(seen.has("q")).toBe(true);
    expect(seen.has("8")).toBe(true);
  });
});
