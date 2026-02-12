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
