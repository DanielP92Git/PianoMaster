/**
 * Expanded Trail Nodes - Redesigned System
 *
 * Educational psychology-driven trail system for 8-year-old learners.
 *
 * Treble Units 1-3: Redesigned (C4 to C5, quarters + halves only)
 * Bass Units 1-3: Redesigned (C4 to C3, quarters + halves only)
 * Rhythm Units 1-2: Legacy generator (to be redesigned in Phase 10)
 *
 * This file imports the redesigned units and combines them.
 */

import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';

// Redesigned bass clef units
import bassUnit1Nodes from './units/bassUnit1Redesigned.js';
import bassUnit2Nodes from './units/bassUnit2Redesigned.js';
import bassUnit3Nodes from './units/bassUnit3Redesigned.js';

// Legacy rhythm generator (rhythm will be redesigned in Phase 10)
import { generateRhythmUnit } from '../utils/nodeGenerator.js';

// ============================================
// RHYTHM - Unit 1: Steady Beat
// (Using legacy generator - will be redesigned later)
// ============================================
const rhythmUnit1 = generateRhythmUnit({
  unitNumber: 1,
  unitName: 'Steady Beat',
  rhythmTiers: [1, 2],
  startOrder: 100, // Start after clef units
  includeBoss: true
});

// ============================================
// RHYTHM - Unit 2: Eighth Notes
// (Using legacy generator - will be redesigned later)
// ============================================
const rhythmUnit2 = generateRhythmUnit({
  unitNumber: 2,
  unitName: 'Eighth Notes',
  rhythmTiers: [3, 4],
  startOrder: rhythmUnit1[rhythmUnit1.length - 1].order + 1,
  includeBoss: true
});

// Combine all nodes
export const EXPANDED_NODES = [
  // Redesigned treble clef units (Units 1-3)
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,

  // Redesigned bass clef units (Units 1-3)
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,

  // Legacy rhythm units (to be redesigned in Phase 10)
  ...rhythmUnit1,
  ...rhythmUnit2
];

// Export by category for easy integration
export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes
];
export const EXPANDED_BASS_NODES = [
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes
];
export const EXPANDED_RHYTHM_NODES = [...rhythmUnit1, ...rhythmUnit2];

// Update prerequisites to link between units
// Note: Treble and Bass unit prerequisites are already set in their redesigned files
// Only rhythm units still need runtime linking
export const linkUnitPrerequisites = (nodes) => {
  const updatedNodes = [...nodes];

  // Link Rhythm Unit 2 to Unit 1 boss (legacy rhythm units still need this)
  const rhythmUnit2Start = updatedNodes.find(n => n.id === 'rhythm_2_1');
  if (rhythmUnit2Start) {
    rhythmUnit2Start.prerequisites = ['boss_rhythm_1'];
  }

  return updatedNodes;
};

export default linkUnitPrerequisites(EXPANDED_NODES);
