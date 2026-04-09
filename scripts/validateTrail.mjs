#!/usr/bin/env node

/**
 * Trail Data Validator
 *
 * Build-time validation script that catches trail data errors before deploy.
 * Validates prerequisite chains, node types, duplicate IDs, and XP economy.
 *
 * Exit codes:
 *   0 - Validation passed (may have warnings)
 *   1 - Validation failed (has errors)
 */

import { SKILL_NODES } from '../src/data/skillTrail.js';
import { NODE_TYPES } from '../src/data/nodeTypes.js';
import { EXERCISE_TYPES } from '../src/data/constants.js';

let hasErrors = false;
let hasWarnings = false;

// Build a lookup map for O(1) node access
const nodeMap = new Map(SKILL_NODES.map((node) => [node.id, node]));

// Three-state tracking for DFS cycle detection
const UNVISITED = 0;
const VISITING = 1;
const VISITED = 2;

/**
 * Validate prerequisite chains using DFS cycle detection.
 * Also checks for references to non-existent nodes.
 */
function validatePrerequisiteChains() {
  console.log('\nChecking prerequisite chains...');

  const nodeState = new Map();
  SKILL_NODES.forEach((node) => nodeState.set(node.id, UNVISITED));

  // Check for missing prerequisites first
  let missingCount = 0;
  for (const node of SKILL_NODES) {
    for (const prereqId of node.prerequisites) {
      if (!nodeMap.has(prereqId)) {
        console.error(
          `  ERROR: Missing prerequisite "${prereqId}" referenced by "${node.id}"`
        );
        hasErrors = true;
        missingCount++;
      }
    }
  }

  if (missingCount > 0) {
    console.error(`  Found ${missingCount} missing prerequisite(s)`);
  }

  // DFS cycle detection from each node
  function dfs(nodeId, path) {
    const state = nodeState.get(nodeId);

    if (state === VISITING) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeId);
      const cycle = [...path.slice(cycleStart), nodeId];
      console.error(`  ERROR: Cycle detected: ${cycle.join(' -> ')}`);
      hasErrors = true;
      return true;
    }

    if (state === VISITED) {
      return false;
    }

    nodeState.set(nodeId, VISITING);
    path.push(nodeId);

    const node = nodeMap.get(nodeId);
    if (node) {
      for (const prereqId of node.prerequisites) {
        // Only visit if prerequisite exists (already reported missing above)
        if (nodeMap.has(prereqId)) {
          if (dfs(prereqId, path)) {
            return true;
          }
        }
      }
    }

    path.pop();
    nodeState.set(nodeId, VISITED);
    return false;
  }

  // Check all nodes as starting points
  let cyclesFound = false;
  for (const node of SKILL_NODES) {
    if (nodeState.get(node.id) === UNVISITED) {
      if (dfs(node.id, [])) {
        cyclesFound = true;
      }
    }
  }

  if (!cyclesFound && missingCount === 0) {
    console.log('  Prerequisite chains: OK');
  }
}

/**
 * Validate that all nodes with nodeType field have valid NODE_TYPES values.
 * Legacy nodes without nodeType field are allowed (no error).
 */
function validateNodeTypes() {
  console.log('\nChecking node types...');

  const validTypes = Object.values(NODE_TYPES);
  let invalidCount = 0;
  let nodesWithType = 0;
  let nodesWithoutType = 0;

  for (const node of SKILL_NODES) {
    if (node.nodeType !== undefined) {
      nodesWithType++;
      if (!validTypes.includes(node.nodeType)) {
        console.error(
          `  ERROR: Invalid nodeType in "${node.id}": "${node.nodeType}"`
        );
        hasErrors = true;
        invalidCount++;
      }
    } else {
      nodesWithoutType++;
    }
  }

  if (invalidCount === 0) {
    console.log(`  Node types: OK (${nodesWithType} typed, ${nodesWithoutType} legacy)`);
  } else {
    console.error(`  Found ${invalidCount} invalid node type(s)`);
  }
}

/**
 * Check for duplicate node IDs.
 */
function validateDuplicateIds() {
  console.log('\nChecking for duplicate IDs...');

  const seenIds = new Map();
  let duplicateCount = 0;

  for (const node of SKILL_NODES) {
    if (seenIds.has(node.id)) {
      console.error(`  ERROR: Duplicate node ID: "${node.id}"`);
      hasErrors = true;
      duplicateCount++;
    } else {
      seenIds.set(node.id, true);
    }
  }

  if (duplicateCount === 0) {
    console.log(`  Unique IDs: OK (${SKILL_NODES.length} nodes)`);
  } else {
    console.error(`  Found ${duplicateCount} duplicate ID(s)`);
  }
}

/**
 * Calculate and display XP totals per category.
 * Warns (but doesn't fail) on >10% variance between paths.
 */
function validateXPEconomy() {
  console.log('\nAnalyzing XP economy...');

  const xpByCategory = {};

  for (const node of SKILL_NODES) {
    const category = node.category || 'uncategorized';
    const xp = node.xpReward || 0;

    if (!xpByCategory[category]) {
      xpByCategory[category] = { total: 0, count: 0 };
    }
    xpByCategory[category].total += xp;
    xpByCategory[category].count++;
  }

  // Display XP totals
  const categoryNames = {
    treble_clef: 'Treble',
    bass_clef: 'Bass',
    rhythm: 'Rhythm',
    boss: 'Boss',
    uncategorized: 'Other'
  };

  const xpTotals = [];
  const mainPaths = ['treble_clef', 'bass_clef', 'rhythm'];
  const mainPathXP = [];

  for (const [category, data] of Object.entries(xpByCategory)) {
    const name = categoryNames[category] || category;
    xpTotals.push(`${name}: ${data.total} XP (${data.count} nodes)`);

    if (mainPaths.includes(category)) {
      mainPathXP.push({ category, total: data.total });
    }
  }

  console.log(`  ${xpTotals.join(' | ')}`);

  // Check variance between main paths
  if (mainPathXP.length > 1) {
    const maxXP = Math.max(...mainPathXP.map((p) => p.total));
    const minXP = Math.min(...mainPathXP.map((p) => p.total));

    if (maxXP > 0) {
      const variance = ((maxXP - minXP) / maxXP) * 100;

      if (variance > 10) {
        const maxPath = mainPathXP.find((p) => p.total === maxXP);
        const minPath = mainPathXP.find((p) => p.total === minXP);
        console.warn(
          `  WARNING: XP variance ${variance.toFixed(1)}% between paths ` +
            `(${categoryNames[maxPath.category]}: ${maxXP} vs ${categoryNames[minPath.category]}: ${minXP})`
        );
        hasWarnings = true;
      } else {
        console.log(`  XP balance: OK (${variance.toFixed(1)}% variance)`);
      }
    }
  }
}

/**
 * Validate that all exercises reference known EXERCISE_TYPES.
 * Unknown types cause a hard build failure (D-07).
 * Only checks type string, not config shape (D-08).
 */
function validateExerciseTypes() {
  console.log('\nChecking exercise types...');

  const validTypes = new Set(Object.values(EXERCISE_TYPES));
  let invalidCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      if (!validTypes.has(exercise.type)) {
        console.error(
          `  ERROR: Unknown exercise type "${exercise.type}" in node "${node.id}"`
        );
        hasErrors = true;
        invalidCount++;
      }
    }
  }

  if (invalidCount === 0) {
    console.log('  Exercise types: OK');
  } else {
    console.error(`  Found ${invalidCount} unknown exercise type(s)`);
  }
}

/**
 * Validate that all exercise difficulty values are within the known set.
 * Unknown difficulty values cause a hard build failure.
 */
function validateExerciseDifficultyValues() {
  console.log('\nChecking exercise difficulty values...');
  const VALID = new Set(['beginner', 'intermediate', 'advanced']);
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      const d = exercise.config?.difficulty;
      if (d !== undefined && !VALID.has(d)) {
        console.error(`  ERROR: Invalid difficulty "${d}" in node "${node.id}"`);
        hasErrors = true;
        invalidCount++;
      }
    }
  }
  if (invalidCount === 0) console.log('  Exercise difficulty values: OK');
  else console.error(`  Found ${invalidCount} invalid difficulty value(s)`);
}

/**
 * Validate that all rhythmPatterns entries use recognized duration names.
 * Unknown names cause a hard build failure.
 */
function validateRhythmPatternNames() {
  console.log('\nChecking rhythmPatterns duration names...');
  const VALID = new Set([
    'whole', 'half', 'quarter', 'eighth', 'sixteenth',
    'dotted-half', 'dotted-quarter', 'dotted-eighth',
    'quarter-triplet', 'eighth-triplet', 'sixteenth-triplet',
    'whole-rest', 'half-rest', 'quarter-rest', 'eighth-rest', 'sixteenth-rest'
  ]);
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      for (const pattern of (exercise.config?.rhythmPatterns || [])) {
        if (!VALID.has(pattern)) {
          console.error(`  ERROR: Unknown rhythmPattern "${pattern}" in node "${node.id}"`);
          hasErrors = true;
          invalidCount++;
        }
      }
    }
  }
  if (invalidCount === 0) console.log('  Rhythm pattern names: OK');
  else console.error(`  Found ${invalidCount} invalid rhythm pattern name(s)`);
}

/**
 * Validate multi-angle game exercises (visual_recognition, syllable_matching).
 * Rules:
 *   1. Multi-angle exercises must have rhythmConfig on the node
 *   2. config.questionCount must be > 0
 *   3. Low-variety rhythm nodes (<=2 non-rest durations) should include at least one multi-angle game (warning)
 */
function validateMultiAngleGames() {
  console.log('\nChecking multi-angle game exercises...');

  const MULTI_ANGLE_TYPES = ['visual_recognition', 'syllable_matching'];
  let errorCount = 0;
  let warningCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (MULTI_ANGLE_TYPES.includes(exercise.type)) {
        // Rule 1: multi-angle exercise must have rhythmConfig on the node
        if (!node.rhythmConfig) {
          console.error(
            `  ERROR: Node "${node.id}" has ${exercise.type} exercise but no rhythmConfig`
          );
          hasErrors = true;
          errorCount++;
        }
        // Rule 2: config.questionCount must be > 0
        if (!exercise.config?.questionCount || exercise.config.questionCount <= 0) {
          console.error(
            `  ERROR: Node "${node.id}" exercise ${exercise.type} has invalid or missing questionCount`
          );
          hasErrors = true;
          errorCount++;
        }
      }
    }

    // Rule 3: low-variety rhythm nodes should include at least one multi-angle game
    if (
      node.category === 'rhythm' &&
      node.rhythmConfig?.durations &&
      !node.isBoss
    ) {
      const nonRestDurations = node.rhythmConfig.durations.filter(
        (d) => !d.includes('r')
      );
      if (nonRestDurations.length <= 2) {
        const hasMultiAngle = (node.exercises || []).some((e) =>
          MULTI_ANGLE_TYPES.includes(e.type)
        );
        if (!hasMultiAngle) {
          console.warn(
            `  WARNING: Low-variety node "${node.id}" (${nonRestDurations.length} non-rest durations) has no multi-angle game exercise`
          );
          hasWarnings = true;
          warningCount++;
        }
      }
    }
  }

  if (errorCount === 0) {
    console.log(`  Multi-angle games: OK${warningCount > 0 ? ` (${warningCount} low-variety nodes without multi-angle games)` : ''}`);
  } else {
    console.error(`  Found ${errorCount} multi-angle game error(s)`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

console.log('='.repeat(50));
console.log('Trail Validation');
console.log('='.repeat(50));
console.log(`Validating ${SKILL_NODES.length} trail nodes...`);

validatePrerequisiteChains();
validateNodeTypes();
validateDuplicateIds();
validateXPEconomy();
validateExerciseTypes();
validateExerciseDifficultyValues();
validateRhythmPatternNames();
validateMultiAngleGames();

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('Validation FAILED. Build aborted.');
  console.log('='.repeat(50) + '\n');
  process.exit(1);
}

if (hasWarnings) {
  console.log('Validation passed with warnings.');
  console.log('='.repeat(50) + '\n');
} else {
  console.log('Trail validation passed.');
  console.log('='.repeat(50) + '\n');
}
