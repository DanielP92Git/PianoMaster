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
import { RHYTHM_PATTERNS } from '../src/data/patterns/rhythmPatterns.js';
import { resolveByTags } from '../src/data/patterns/RhythmPatternGenerator.js';

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

/**
 * Validate mixed lesson exercises.
 * Rules:
 *   1. Node must have rhythmConfig (duration source for question generation)
 *   2. config.questions must be a non-empty array
 *   3. Each question entry must have a type field with a known renderer type
 *   4. Question count should be 8-10 (warning, not error)
 */
const RENDERER_TYPES = new Set(['visual_recognition', 'syllable_matching', 'rhythm_tap', 'pulse']);

function validateMixedLessons() {
  console.log('\nChecking mixed lesson exercises...');
  let errorCount = 0;
  let warningCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (exercise.type !== 'mixed_lesson') continue;

      // Rule 1: must have rhythmConfig
      if (!node.rhythmConfig) {
        console.error(`  ERROR: Node "${node.id}" has mixed_lesson exercise but no rhythmConfig`);
        hasErrors = true;
        errorCount++;
      }

      // Rule 2: must have questions array
      const questions = exercise.config?.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        console.error(`  ERROR: Node "${node.id}" mixed_lesson has no questions array`);
        hasErrors = true;
        errorCount++;
        continue;
      }

      // Rule 3: each question entry must have a valid type
      for (const [i, q] of questions.entries()) {
        if (!q.type || !RENDERER_TYPES.has(q.type)) {
          console.error(`  ERROR: Node "${node.id}" mixed_lesson question[${i}] has unknown type "${q.type}"`);
          hasErrors = true;
          errorCount++;
        }
      }

      // Rule 4: question count should be 8-10 (soft warning), 10-12 for mini_boss
      const isMini = node.nodeType === 'mini_boss';
      const minQ = isMini ? 10 : 8;
      const maxQ = isMini ? 12 : 10;
      if (questions.length < minQ || questions.length > maxQ) {
        console.warn(`  WARNING: Node "${node.id}" mixed_lesson has ${questions.length} questions (expected ${minQ}-${maxQ})`);
        hasWarnings = true;
        warningCount++;
      }
    }
  }

  if (errorCount === 0) {
    console.log(`  Mixed lessons: OK${warningCount > 0 ? ` (${warningCount} warning(s))` : ''}`);
  } else {
    console.error(`  Found ${errorCount} mixed lesson error(s)`);
  }
}

/**
 * Validate that every patternTag referenced by rhythm nodes exists in the RHYTHM_PATTERNS library.
 * Unknown tags cause a hard build failure (D-17 check 1).
 */
function validatePatternTagExistence() {
  console.log('\nChecking pattern tag existence...');
  const allTags = new Set();
  for (const pattern of RHYTHM_PATTERNS) {
    for (const tag of pattern.tags) {
      allTags.add(tag);
    }
  }

  let errorCount = 0;
  for (const node of SKILL_NODES) {
    const patternTags = node.rhythmConfig?.patternTags;
    if (!patternTags) continue;
    for (const tag of patternTags) {
      if (!allTags.has(tag)) {
        console.error(`  ERROR: Node "${node.id}" references unknown patternTag "${tag}". Valid tags: ${[...allTags].sort().join(', ')}`);
        hasErrors = true;
        errorCount++;
      }
    }
  }
  if (errorCount === 0) console.log('  Pattern tag existence: OK');
  else console.error(`  Found ${errorCount} unknown pattern tag reference(s)`);
}

/**
 * Validate that every tag in the RHYTHM_PATTERNS library is used by at least one node.
 * Orphan tags emit a warning (not an error) — unused patterns don't break functionality.
 * (D-17 check 2)
 */
function validatePatternTagCoverage() {
  console.log('\nChecking pattern tag coverage...');
  const usedTags = new Set();
  for (const node of SKILL_NODES) {
    const patternTags = node.rhythmConfig?.patternTags;
    if (!patternTags) continue;
    for (const tag of patternTags) {
      usedTags.add(tag);
    }
  }

  const libraryTags = new Set();
  for (const pattern of RHYTHM_PATTERNS) {
    for (const tag of pattern.tags) {
      libraryTags.add(tag);
    }
  }

  let warningCount = 0;
  for (const tag of libraryTags) {
    if (!usedTags.has(tag)) {
      console.warn(`  WARNING: Pattern tag "${tag}" exists in library but is not used by any node (orphan tag)`);
      hasWarnings = true;
      warningCount++;
    }
  }
  if (warningCount === 0) console.log('  Pattern tag coverage: OK');
  else console.warn(`  Found ${warningCount} orphan tag(s) in pattern library`);
}

/**
 * Validate duration safety: for each rhythm node's patternTags, confirm that at least
 * one pattern matching each tag can be rendered with the node's rhythmConfig.durations.
 * A null return from resolveByTags means the tag is unusable at that node — hard error.
 * (D-17 check 3, enforces PAT-05)
 */
function validateDurationSafety() {
  console.log('\nChecking duration safety...');
  let errorCount = 0;

  for (const node of SKILL_NODES) {
    const rc = node.rhythmConfig;
    if (!rc?.patternTags || !rc?.durations) continue;

    for (const tag of rc.patternTags) {
      const result = resolveByTags([tag], rc.durations, {
        timeSignature: rc.timeSignature || '4/4',
      });
      if (result === null) {
        console.error(`  ERROR: Node "${node.id}" tag "${tag}" has no matching patterns that can render with durations [${rc.durations.join(', ')}] in ${rc.timeSignature || '4/4'}`);
        hasErrors = true;
        errorCount++;
      }
    }
  }
  if (errorCount === 0) console.log('  Duration safety: OK');
  else console.error(`  Found ${errorCount} duration safety violation(s)`);
}

/**
 * Validate game-type policy: rhythm node exercise types must match their nodeType.
 *   DISCOVERY/PRACTICE/MIX_UP/REVIEW/MINI_BOSS -> mixed_lesson
 *   CHALLENGE/SPEED_ROUND/BOSS -> arcade_rhythm
 * (D-18)
 */
function validateGameTypePolicy() {
  console.log('\nChecking game-type policy...');
  const MIXED_LESSON_TYPES = new Set([
    NODE_TYPES.DISCOVERY, NODE_TYPES.PRACTICE, NODE_TYPES.MIX_UP,
    NODE_TYPES.REVIEW, NODE_TYPES.MINI_BOSS
  ]);
  const ARCADE_TYPES = new Set([
    NODE_TYPES.CHALLENGE, NODE_TYPES.SPEED_ROUND, NODE_TYPES.BOSS
  ]);

  let errorCount = 0;
  for (const node of SKILL_NODES) {
    if (node.category !== 'rhythm') continue;
    if (!node.exercises || node.exercises.length === 0) continue;

    const nodeType = node.nodeType;
    for (const exercise of node.exercises) {
      if (MIXED_LESSON_TYPES.has(nodeType) && exercise.type !== EXERCISE_TYPES.MIXED_LESSON) {
        console.error(`  ERROR: Node "${node.id}" (${nodeType}) uses exercise type "${exercise.type}" but policy requires "mixed_lesson"`);
        hasErrors = true;
        errorCount++;
      }
      if (ARCADE_TYPES.has(nodeType) && exercise.type !== EXERCISE_TYPES.ARCADE_RHYTHM) {
        console.error(`  ERROR: Node "${node.id}" (${nodeType}) uses exercise type "${exercise.type}" but policy requires "arcade_rhythm"`);
        hasErrors = true;
        errorCount++;
      }
    }
  }
  if (errorCount === 0) console.log('  Game-type policy: OK');
  else console.error(`  Found ${errorCount} game-type policy violation(s)`);
}

/**
 * Validate that each rhythm node's measureCount matches its nodeType policy.
 * Policy (from Phase 23 D-12):
 *   discovery=1, practice=2, mix_up=1, review=2,
 *   challenge=2, speed_round=4, mini_boss=4, boss=4
 *
 * Only validates exercise types that use measureCount (rhythm_tap, rhythm_dictation, arcade_rhythm).
 * Skips pulse, visual_recognition, syllable_matching, mixed_lesson, note_recognition, memory_game.
 */
function validateMeasureCountPolicy() {
  console.log('\nChecking measure count policy...');

  const MEASURE_COUNT_POLICY = {
    discovery: 1,
    practice: 2,
    mix_up: 1,
    review: 2,
    challenge: 2,
    speed_round: 4,
    mini_boss: 4,
    boss: 4,
  };

  const SKIP_EXERCISE_TYPES = new Set([
    'pulse', 'visual_recognition', 'syllable_matching',
    'mixed_lesson', 'note_recognition', 'memory_game',
  ]);

  const errors = [];

  for (const node of SKILL_NODES) {
    if (node.category !== 'rhythm') continue;
    if (!node.nodeType) continue;

    const expectedMeasureCount = MEASURE_COUNT_POLICY[node.nodeType];
    if (expectedMeasureCount === undefined) continue;

    if (node.exercises) {
      for (let i = 0; i < node.exercises.length; i++) {
        const ex = node.exercises[i];
        if (SKIP_EXERCISE_TYPES.has(ex.type)) continue;

        const mc = ex.config?.measureCount;
        if (mc !== undefined && mc !== expectedMeasureCount) {
          errors.push(
            `${node.id} exercise[${i}] (${ex.type}): measureCount=${mc}, expected=${expectedMeasureCount} for nodeType=${node.nodeType}`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n--- Measure Count Policy Violations ---');
    errors.forEach(e => console.error(`  ERROR: ${e}`));
    process.exitCode = 1;
  } else {
    console.log('  Measure count policy: OK');
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
validateMixedLessons();
validatePatternTagExistence();
validatePatternTagCoverage();
validateDurationSafety();
validateGameTypePolicy();
validateMeasureCountPolicy();

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
