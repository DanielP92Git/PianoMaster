import { describe, it, expect } from "vitest";
import { rhythmUnit8Nodes } from "./rhythmUnit8Redesigned.js";
import { NODE_TYPES, NEW_CONTENT_TYPES } from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

describe("Rhythm Unit 8 — Syncopation", () => {
  it("exports exactly 7 nodes", () => {
    expect(rhythmUnit8Nodes).toHaveLength(7);
  });

  it("all node IDs are unique", () => {
    const ids = rhythmUnit8Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("node IDs follow naming convention", () => {
    const expectedIds = [
      "rhythm_8_1",
      "rhythm_8_2",
      "rhythm_8_3",
      "rhythm_8_4",
      "rhythm_8_5",
      "rhythm_8_6",
      "boss_rhythm_8",
    ];
    const actualIds = rhythmUnit8Nodes.map((n) => n.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it("orders are sequential from 149 to 155", () => {
    const orders = rhythmUnit8Nodes.map((n) => n.order);
    expect(orders).toEqual([149, 150, 151, 152, 153, 154, 155]);
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
    const regularNodes = rhythmUnit8Nodes.slice(0, 6);
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
    const regularNodes = rhythmUnit8Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.category).toBe("rhythm");
    });
  });

  it("regular node exercise types match game-type policy (mixed_lesson for discovery/practice/mix_up, arcade_rhythm for speed_round)", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 6);
    const types = regularNodes.map((n) => n.exercises[0].type);
    expect(types).toEqual([
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_1 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_2 (practice)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_3 (discovery)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_4 (practice)
      EXERCISE_TYPES.MIXED_LESSON, // rhythm_8_5 (mix_up)
      EXERCISE_TYPES.ARCADE_RHYTHM, // rhythm_8_6 (speed_round)
    ]);
  });

  it("boss node exercises are all ARCADE_RHYTHM", () => {
    const bossNode = rhythmUnit8Nodes[rhythmUnit8Nodes.length - 1];
    bossNode.exercises.forEach((ex) => {
      expect(ex.type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
    });
  });
});

describe("Rhythm Unit 8 — Boss Challenge (RADV-04)", () => {
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

  it("boss has 3 exercises", () => {
    expect(bossNode.exercises).toHaveLength(3);
  });

  it("boss exercises total 15 questions", () => {
    const total = bossNode.exercises.reduce(
      (sum, ex) => sum + ex.config.questionCount,
      0
    );
    expect(total).toBe(15);
  });

  it("boss exercise 1 uses 6/8 time signature", () => {
    expect(bossNode.exercises[0].config.timeSignature).toBe("6/8");
    expect(bossNode.exercises[0].config.questionCount).toBe(5);
  });

  it("boss exercises 2 and 3 use 4/4 time signature", () => {
    expect(bossNode.exercises[1].config.timeSignature).toBe("4/4");
    expect(bossNode.exercises[2].config.timeSignature).toBe("4/4");
  });

  it("boss mixes both 6/8 and 4/4 content", () => {
    const timeSignatures = bossNode.exercises.map(
      (ex) => ex.config.timeSignature
    );
    expect(timeSignatures).toContain("6/8");
    expect(timeSignatures).toContain("4/4");
  });

  it("tempo increases across the unit", () => {
    // Compare first regular node default tempo vs last regular node (index 5) default tempo
    const firstTempo = rhythmUnit8Nodes[0].rhythmConfig.tempo.default;
    const lastRegularTempo = rhythmUnit8Nodes[5].rhythmConfig.tempo.default;
    expect(firstTempo).toBeLessThan(lastRegularTempo);
  });

  it("xpReward values are in valid range", () => {
    const regularNodes = rhythmUnit8Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.xpReward).toBeGreaterThanOrEqual(75);
      expect(node.xpReward).toBeLessThanOrEqual(90);
    });
    expect(bossNode.xpReward).toBe(250);
  });
});
