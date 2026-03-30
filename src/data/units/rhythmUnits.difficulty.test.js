import { describe, it, expect } from 'vitest';
import { rhythmUnit1Nodes } from './rhythmUnit1Redesigned.js';
import { rhythmUnit2Nodes } from './rhythmUnit2Redesigned.js';
import { rhythmUnit3Nodes } from './rhythmUnit3Redesigned.js';
import { rhythmUnit4Nodes } from './rhythmUnit4Redesigned.js';
import { rhythmUnit5Nodes } from './rhythmUnit5Redesigned.js';
import { rhythmUnit6Nodes } from './rhythmUnit6Redesigned.js';
import { rhythmUnit7Nodes } from './rhythmUnit7Redesigned.js';
import { rhythmUnit8Nodes } from './rhythmUnit8Redesigned.js';

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const allUnits = [
  { name: 'Unit 1', nodes: rhythmUnit1Nodes },
  { name: 'Unit 2', nodes: rhythmUnit2Nodes },
  { name: 'Unit 3', nodes: rhythmUnit3Nodes },
  { name: 'Unit 4', nodes: rhythmUnit4Nodes },
  { name: 'Unit 5', nodes: rhythmUnit5Nodes },
  { name: 'Unit 6', nodes: rhythmUnit6Nodes },
  { name: 'Unit 7', nodes: rhythmUnit7Nodes },
  { name: 'Unit 8', nodes: rhythmUnit8Nodes },
];

describe('Rhythm unit difficulty values (D-06 regression guard)', () => {
  it.each(allUnits)('$name: all exercise configs use valid difficulty values', ({ nodes }) => {
    nodes.forEach(node => {
      (node.exercises || []).forEach(ex => {
        if (ex.config?.difficulty !== undefined) {
          expect(
            VALID_DIFFICULTIES,
            `Node "${node.id}" exercise has difficulty "${ex.config.difficulty}" — expected one of ${VALID_DIFFICULTIES.join(', ')}`
          ).toContain(ex.config.difficulty);
        }
      });
    });
  });

  it('no exercise config uses legacy "easy" or "medium" or "hard" difficulty', () => {
    const INVALID = ['easy', 'medium', 'hard'];
    const violations = [];
    allUnits.forEach(({ name, nodes }) => {
      nodes.forEach(node => {
        (node.exercises || []).forEach(ex => {
          if (INVALID.includes(ex.config?.difficulty)) {
            violations.push(`${name} node "${node.id}": "${ex.config.difficulty}"`);
          }
        });
      });
    });
    expect(violations).toEqual([]);
  });
});
