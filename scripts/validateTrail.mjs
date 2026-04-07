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
import {
  RHYTHM_PATTERNS,
  PATTERN_TAGS,
} from '../src/data/patterns/rhythmPatterns.js';

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
 *
 * After Phase 22 migration, rhythmPatterns field is removed from all rhythm-game
 * exercise configs. validateLegacyRhythmPatterns() catches any remaining instances
 * in rhythm-type exercises. This function is retained as a safety net for non-rhythm
 * exercises (e.g. sight_reading) that still legitimately use the field for notation
 * rendering — it validates that their duration name values are recognized strings.
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
  if (invalidCount === 0) console.log('  Rhythm pattern names: OK (no legacy fields found)');
  else console.error(`  Found ${invalidCount} invalid rhythm pattern name(s)`);
}

/**
 * Validate the rhythm pattern library for structural integrity and coverage.
 * Checks: unique IDs, required fields, valid tags, measureCount==beats.length,
 * measure sums, durationSet matches beats, D-23 no-rest check, D-24 no-pure-rest-measure,
 * minimum 8 per tag, difficulty coverage (2 per level per tag),
 * measure length coverage (1/2/4 bar per tag).
 */
function validatePatternLibrary() {
  console.log('\nChecking pattern library...');

  const SIXTEENTH_UNITS = {
    q: 4,
    h: 8,
    w: 16,
    '8': 2,
    '16': 1,
    qd: 6,
    hd: 12,
    qr: 4,
    hr: 8,
    wr: 16,
  };
  const MEASURE_LENGTHS = { '4/4': 16, '3/4': 12, '6/8': 12 };
  const VALID_TAG_SET = new Set(PATTERN_TAGS);
  const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
  const VALID_MEASURE_COUNTS = new Set([1, 2, 4]);
  const VALID_TIME_SIGS = new Set(['4/4', '3/4', '6/8']);
  const NO_REST_TAGS = new Set([
    'quarter-only',
    'quarter-half',
    'quarter-half-whole',
    'quarter-eighth',
  ]);
  const REST_DURATIONS = new Set(['qr', 'hr', 'wr']);

  let errors = 0;
  const seenIds = new Set();
  const tagStats = {};

  // Initialize tagStats for all declared tags
  for (const tag of PATTERN_TAGS) {
    tagStats[tag] = { total: 0, byDifficulty: {}, byMeasureCount: {} };
  }

  for (const pattern of RHYTHM_PATTERNS) {
    // 1. Required fields
    for (const field of [
      'id',
      'description',
      'beats',
      'durationSet',
      'tags',
      'timeSignature',
      'difficulty',
      'measureCount',
    ]) {
      if (pattern[field] === undefined || pattern[field] === null) {
        console.error(
          `  ERROR: Missing field "${field}" in pattern "${pattern.id || 'UNKNOWN'}"`
        );
        errors++;
      }
    }

    // 2. Unique IDs
    if (seenIds.has(pattern.id)) {
      console.error(`  ERROR: Duplicate pattern ID "${pattern.id}"`);
      errors++;
    }
    seenIds.add(pattern.id);

    // 3. Valid difficulty
    if (!VALID_DIFFICULTIES.has(pattern.difficulty)) {
      console.error(
        `  ERROR: Invalid difficulty "${pattern.difficulty}" in "${pattern.id}"`
      );
      errors++;
    }

    // 4. Valid time signature
    if (!VALID_TIME_SIGS.has(pattern.timeSignature)) {
      console.error(
        `  ERROR: Invalid timeSignature "${pattern.timeSignature}" in "${pattern.id}"`
      );
      errors++;
    }

    // 5. Valid measureCount
    if (!VALID_MEASURE_COUNTS.has(pattern.measureCount)) {
      console.error(
        `  ERROR: Invalid measureCount ${pattern.measureCount} in "${pattern.id}" (must be 1, 2, or 4)`
      );
      errors++;
    }

    // 6. measureCount === beats.length
    if (
      Array.isArray(pattern.beats) &&
      pattern.measureCount !== pattern.beats.length
    ) {
      console.error(
        `  ERROR: measureCount ${pattern.measureCount} != beats.length ${pattern.beats.length} in "${pattern.id}"`
      );
      errors++;
    }

    // 7. beats is array of arrays
    if (!Array.isArray(pattern.beats)) {
      console.error(`  ERROR: beats is not an array in "${pattern.id}"`);
      errors++;
    } else {
      for (let i = 0; i < pattern.beats.length; i++) {
        if (!Array.isArray(pattern.beats[i])) {
          console.error(
            `  ERROR: beats[${i}] is not an array in "${pattern.id}"`
          );
          errors++;
        }
      }
    }

    // 8. tags subset of PATTERN_TAGS + accumulate stats
    if (Array.isArray(pattern.tags)) {
      if (pattern.tags.length === 0) {
        console.error(`  ERROR: Empty tags array in "${pattern.id}"`);
        errors++;
      }
      for (const tag of pattern.tags) {
        if (!VALID_TAG_SET.has(tag)) {
          console.error(
            `  ERROR: Unknown tag "${tag}" in pattern "${pattern.id}"`
          );
          errors++;
        } else {
          tagStats[tag].total++;
          tagStats[tag].byDifficulty[pattern.difficulty] =
            (tagStats[tag].byDifficulty[pattern.difficulty] || 0) + 1;
          tagStats[tag].byMeasureCount[pattern.measureCount] =
            (tagStats[tag].byMeasureCount[pattern.measureCount] || 0) + 1;
        }
      }
    }

    // 9. Each measure sums to time signature
    if (
      Array.isArray(pattern.beats) &&
      MEASURE_LENGTHS[pattern.timeSignature] !== undefined
    ) {
      const expectedLength = MEASURE_LENGTHS[pattern.timeSignature];
      for (let i = 0; i < pattern.beats.length; i++) {
        if (Array.isArray(pattern.beats[i])) {
          const sum = pattern.beats[i].reduce(
            (acc, dur) => acc + (SIXTEENTH_UNITS[dur] || 0),
            0
          );
          if (sum !== expectedLength) {
            console.error(
              `  ERROR: Measure ${i + 1} of "${pattern.id}" sums to ${sum}, expected ${expectedLength}`
            );
            errors++;
          }
          // Check for unknown duration codes
          for (const dur of pattern.beats[i]) {
            if (SIXTEENTH_UNITS[dur] === undefined) {
              console.error(
                `  ERROR: Unknown duration code "${dur}" in measure ${i + 1} of "${pattern.id}"`
              );
              errors++;
            }
          }
        }
      }
    }

    // 10. durationSet matches beats
    if (Array.isArray(pattern.beats) && Array.isArray(pattern.durationSet)) {
      const actualDurs = new Set(pattern.beats.flat());
      const claimedDurs = new Set(pattern.durationSet);
      for (const dur of actualDurs) {
        if (!claimedDurs.has(dur)) {
          console.error(
            `  ERROR: Duration "${dur}" in beats but not in durationSet for "${pattern.id}"`
          );
          errors++;
        }
      }
      for (const dur of claimedDurs) {
        if (!actualDurs.has(dur)) {
          console.error(
            `  ERROR: Duration "${dur}" in durationSet but not in beats for "${pattern.id}"`
          );
          errors++;
        }
      }
    }

    // 11. D-23: No rests in pre-Unit-4 tags
    if (Array.isArray(pattern.tags) && Array.isArray(pattern.beats)) {
      const hasNoRestTag = pattern.tags.some((t) => NO_REST_TAGS.has(t));
      if (hasNoRestTag) {
        const allDurs = pattern.beats.flat();
        for (const dur of allDurs) {
          if (REST_DURATIONS.has(dur)) {
            console.error(
              `  ERROR: Rest duration "${dur}" found in pre-Unit-4 tag pattern "${pattern.id}" (D-23 violation)`
            );
            errors++;
          }
        }
      }
    }

    // 12. D-24: No pure-rest measures
    // Exception: a single 'wr' is the canonical whole-measure rest notation and is allowed.
    if (Array.isArray(pattern.beats)) {
      for (let i = 0; i < pattern.beats.length; i++) {
        const measure = pattern.beats[i];
        if (Array.isArray(measure) && measure.length > 0) {
          // Allow ['wr'] — canonical whole-measure rest (valid music notation)
          const isWholeMeasureRest = measure.length === 1 && measure[0] === 'wr';
          if (!isWholeMeasureRest) {
            const allRests = measure.every((dur) => REST_DURATIONS.has(dur));
            if (allRests) {
              console.error(
                `  ERROR: Pure-rest measure ${i + 1} in "${pattern.id}" (D-24 violation)`
              );
              errors++;
            }
          }
        }
      }
    }
  }

  // 13. Minimum patterns per tag (>= 8)
  for (const tag of PATTERN_TAGS) {
    const stats = tagStats[tag];
    if (stats.total < 8) {
      console.error(
        `  ERROR: Tag "${tag}" has only ${stats.total} patterns (minimum 8 required)`
      );
      errors++;
    }
  }

  // 14. Difficulty coverage per tag (>= 2 per level per tag)
  for (const tag of PATTERN_TAGS) {
    const stats = tagStats[tag];
    for (const diff of ['beginner', 'intermediate', 'advanced']) {
      const count = stats.byDifficulty[diff] || 0;
      if (count < 2) {
        console.error(
          `  ERROR: Tag "${tag}" has ${count} "${diff}" patterns (minimum 2 required)`
        );
        errors++;
      }
    }
  }

  // 15. Measure length coverage per tag (1-bar, 2-bar, 4-bar all present)
  for (const tag of PATTERN_TAGS) {
    const stats = tagStats[tag];
    for (const len of [1, 2, 4]) {
      const count = stats.byMeasureCount[len] || 0;
      if (count < 1) {
        console.error(`  ERROR: Tag "${tag}" has no ${len}-bar patterns`);
        errors++;
      }
    }
  }

  if (errors === 0) {
    console.log(
      `  Pattern library: OK (${RHYTHM_PATTERNS.length} patterns, ${PATTERN_TAGS.length} tags)`
    );
  } else {
    console.error(`  Found ${errors} pattern library error(s)`);
    hasErrors = true;
  }
}

/**
 * Reject legacy rhythmPatterns field in rhythm exercise configs.
 * After Phase 22 migration, all rhythm-game exercises use patternTags instead.
 * Any remaining rhythmPatterns field in a rhythm-type exercise is an error (D-15).
 * Note: rhythmPatterns in sight_reading exercise configs is a separate field used
 * by the notation renderer — it is NOT flagged here.
 */
function validateLegacyRhythmPatterns() {
  console.log('\nChecking for legacy rhythmPatterns field...');
  const RHYTHM_EXERCISE_TYPES = new Set([
    'rhythm',
    'rhythm_tap',
    'rhythm_dictation',
    'arcade_rhythm',
    'rhythm_pulse',
  ]);
  let count = 0;
  for (const node of SKILL_NODES) {
    if (node.category !== 'rhythm' && node.category !== 'boss') continue;
    for (const exercise of (node.exercises || [])) {
      // Only flag rhythmPatterns on rhythm-type exercises, not sight_reading
      if (!RHYTHM_EXERCISE_TYPES.has(exercise.type)) continue;
      if (exercise.config?.rhythmPatterns !== undefined) {
        console.error(
          `  ERROR: Legacy "rhythmPatterns" field in "${node.id}" exercise — migrate to patternTags`
        );
        hasErrors = true;
        count++;
      }
    }
  }
  if (count === 0) console.log('  No legacy rhythmPatterns: OK');
}

/**
 * Validate that patternTags reference known PATTERN_TAGS and patternIds reference
 * known pattern IDs from the rhythm pattern library.
 */
function validatePatternTagReferences() {
  console.log('\nChecking patternTags and patternIds references...');
  const validTags = new Set(PATTERN_TAGS);
  const validIds = new Set(RHYTHM_PATTERNS.map((p) => p.id));
  let count = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      for (const tag of (exercise.config?.patternTags || [])) {
        if (!validTags.has(tag)) {
          console.error(`  ERROR: Unknown patternTag "${tag}" in "${node.id}"`);
          hasErrors = true;
          count++;
        }
      }
      for (const id of (exercise.config?.patternIds || [])) {
        if (!validIds.has(id)) {
          console.error(`  ERROR: Unknown patternId "${id}" in "${node.id}"`);
          hasErrors = true;
          count++;
        }
      }
    }
  }
  if (count === 0) console.log('  Pattern tag/ID references: OK');
}

/**
 * Enforce nodeType -> exercise type mapping for rhythm nodes.
 * Prevents wrong game launching after remediation (D-17).
 * Only checks rhythm-category and boss-with-rhythm nodes.
 * RHYTHM_PULSE is allowed only when config.pulseOnly is true.
 */
function validateNodeTypeExerciseTypeMapping() {
  console.log('\nChecking nodeType -> exercise type policy...');

  const RHYTHM_EXERCISE_TYPES = new Set([
    'rhythm',
    'rhythm_tap',
    'rhythm_dictation',
    'arcade_rhythm',
    'rhythm_pulse',
  ]);

  const NODE_TYPE_EXERCISE_POLICY = {
    discovery: new Set(['rhythm_tap', 'rhythm_dictation']),
    practice: new Set(['rhythm_tap']),
    mix_up: new Set(['rhythm_dictation']),
    review: new Set(['rhythm_tap']),
    challenge: new Set(['rhythm_tap']),
    speed_round: new Set(['arcade_rhythm']),
    mini_boss: new Set(['rhythm_tap']),
    boss: new Set(['arcade_rhythm']),
  };

  let count = 0;
  for (const node of SKILL_NODES) {
    // Only check rhythm-category nodes and boss nodes with rhythm exercises
    const isRhythmNode = node.category === 'rhythm';
    const isBossWithRhythm =
      node.category === 'boss' &&
      (node.exercises || []).some((e) => RHYTHM_EXERCISE_TYPES.has(e.type));
    if (!isRhythmNode && !isBossWithRhythm) continue;

    const nodeType = node.nodeType;
    if (!nodeType) continue; // Legacy nodes without nodeType are exempt

    const allowedTypes = NODE_TYPE_EXERCISE_POLICY[nodeType];
    if (!allowedTypes) continue; // Unknown nodeType handled by validateNodeTypes()

    for (const exercise of (node.exercises || [])) {
      // Skip non-rhythm exercise types (e.g. note_recognition on a boss node)
      if (!RHYTHM_EXERCISE_TYPES.has(exercise.type)) continue;

      // RHYTHM_PULSE is allowed when pulseOnly: true (special case for rhythm_1_1)
      if (exercise.type === 'rhythm_pulse' && exercise.config?.pulseOnly === true)
        continue;

      if (!allowedTypes.has(exercise.type)) {
        console.error(
          `  ERROR: Node "${node.id}" (${nodeType}) uses exercise type "${exercise.type}" — ` +
            `allowed: [${[...allowedTypes].join(', ')}]`
        );
        hasErrors = true;
        count++;
      }
    }
  }
  if (count === 0) console.log('  NodeType -> exercise type mapping: OK');
}

/**
 * Enforce nodeType -> measureCount policy for rhythm exercises.
 * Prevents drift in measure lengths after Phase 23 data migration (D-12).
 * Pulse exercises (pulseOnly: true) are exempt.
 */
function validateMeasureCountPolicy() {
  console.log("\nChecking measureCount policy...");

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

  const RHYTHM_EXERCISE_TYPES = new Set([
    "rhythm",
    "rhythm_tap",
    "rhythm_dictation",
    "arcade_rhythm",
    "rhythm_pulse",
  ]);

  let violations = 0;
  for (const node of SKILL_NODES) {
    // Only check rhythm-category nodes and boss nodes with rhythm exercises
    const isRhythmNode = node.category === "rhythm";
    const isBossWithRhythm =
      node.category === "boss" &&
      (node.exercises || []).some((e) => RHYTHM_EXERCISE_TYPES.has(e.type));
    if (!isRhythmNode && !isBossWithRhythm) continue;

    const nodeType = node.nodeType;
    if (!nodeType) continue;

    const expected = MEASURE_COUNT_POLICY[nodeType];
    if (expected === undefined) continue;

    for (const exercise of node.exercises || []) {
      // Skip non-rhythm exercises and pulse exercises
      if (!RHYTHM_EXERCISE_TYPES.has(exercise.type)) continue;
      if (exercise.config?.pulseOnly === true) continue;

      const mc = exercise.config?.measureCount;
      if (mc !== expected) {
        console.error(
          `  ERROR: "${node.id}" (${nodeType}) has measureCount=${mc}, expected ${expected}`
        );
        hasErrors = true;
        violations++;
      }
    }
  }
  if (violations === 0) console.log("  MeasureCount policy: OK");
  else console.error(`  Found ${violations} measureCount policy violation(s)`);
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
validatePatternLibrary();
validateLegacyRhythmPatterns();
validatePatternTagReferences();
validateNodeTypeExerciseTypeMapping();
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
