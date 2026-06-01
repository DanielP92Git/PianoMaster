import { describe, it, expect } from "vitest";
// Phase 1 v3.5: 10 rhythm units (new pedagogical order). OLD rhythmUnit{1..7}Redesigned.js
// imports replaced by new rhythmUnit{1..10}.js files. The HIDDEN syncopation unit
// previously at rhythmUnit8Redesigned.js is preserved under the renamed binding
// `rhythmUnit8SyncoNodes` to avoid collision with new U8 (3/4 Meter).
import rhythmUnit1Nodes from "./rhythmUnit1.js";
import rhythmUnit2Nodes from "./rhythmUnit2.js";
import rhythmUnit3Nodes from "./rhythmUnit3.js";
import rhythmUnit4Nodes from "./rhythmUnit4.js";
import rhythmUnit5Nodes from "./rhythmUnit5.js";
import rhythmUnit6Nodes from "./rhythmUnit6.js";
import rhythmUnit7Nodes from "./rhythmUnit7.js";
import rhythmUnit8Nodes from "./rhythmUnit8.js";
import rhythmUnit9Nodes from "./rhythmUnit9.js";
import rhythmUnit10Nodes from "./rhythmUnit10.js";
import { rhythmUnit8Nodes as rhythmUnit8SyncoNodes } from "./rhythmUnit8Redesigned.js";

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const allUnits = [
  { name: "Unit 1", nodes: rhythmUnit1Nodes },
  { name: "Unit 2", nodes: rhythmUnit2Nodes },
  { name: "Unit 3", nodes: rhythmUnit3Nodes },
  { name: "Unit 4", nodes: rhythmUnit4Nodes },
  { name: "Unit 5", nodes: rhythmUnit5Nodes },
  { name: "Unit 6", nodes: rhythmUnit6Nodes },
  { name: "Unit 7", nodes: rhythmUnit7Nodes },
  { name: "Unit 8 (3/4 Meter)", nodes: rhythmUnit8Nodes },
  { name: "Unit 9 (6/8 Meter)", nodes: rhythmUnit9Nodes },
  { name: "Unit 10 (Review Boss)", nodes: rhythmUnit10Nodes },
  { name: "Unit Synco (HIDDEN)", nodes: rhythmUnit8SyncoNodes },
];

describe("Rhythm unit difficulty values (D-06 regression guard)", () => {
  it.each(allUnits)(
    "$name: all exercise configs use valid difficulty values",
    ({ nodes }) => {
      nodes.forEach((node) => {
        (node.exercises || []).forEach((ex) => {
          if (ex.config?.difficulty !== undefined) {
            expect(
              VALID_DIFFICULTIES,
              `Node "${node.id}" exercise has difficulty "${ex.config.difficulty}" — expected one of ${VALID_DIFFICULTIES.join(", ")}`
            ).toContain(ex.config.difficulty);
          }
        });
      });
    }
  );

  it('no exercise config uses legacy "easy" or "medium" or "hard" difficulty', () => {
    const INVALID = ["easy", "medium", "hard"];
    const violations = [];
    allUnits.forEach(({ name, nodes }) => {
      nodes.forEach((node) => {
        (node.exercises || []).forEach((ex) => {
          if (INVALID.includes(ex.config?.difficulty)) {
            violations.push(
              `${name} node "${node.id}": "${ex.config.difficulty}"`
            );
          }
        });
      });
    });
    expect(violations).toEqual([]);
  });
});
