/**
 * Expanded Trail Nodes - Redesigned System
 *
 * Educational psychology-driven trail system for 8-year-old learners.
 * Units 1-3: Learning the Keys (NO eighth notes - quarters and halves only)
 * Unit 4+: Speed & Rhythm (eighth notes unlocked after Unit 3)
 *
 * This file imports the redesigned units and combines them.
 */

import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';

// Legacy generated units (kept for bass clef and rhythm until redesigned)
import { generateUnit, generateRhythmUnit } from '../utils/nodeGenerator.js';

// Import constants from shared file
import { NODE_CATEGORIES } from './constants.js';

// ============================================
// BASS CLEF - Unit 1: Middle C Position (C4-A3)
// (Using legacy generator - will be redesigned later)
// ============================================
const bassUnit1 = generateUnit({
  category: NODE_CATEGORIES.BASS_CLEF,
  unitNumber: 1,
  unitName: 'Middle C Position',
  theme: 'The Bass Beginning',
  baseNotePool: ['C4', 'B3', 'A3'],
  clef: 'bass',
  startOrder: 50, // Start after treble units
  rhythmTiers: [1, 2, 3, 4],
  includeIntro: true,
  includeBoss: true,
  bossConfig: {
    accessoryUnlock: 'bass_sprout_badge'
  }
});

// ============================================
// BASS CLEF - Unit 2: Five Finger Low (C4-F3)
// (Using legacy generator - will be redesigned later)
// ============================================
const bassUnit2 = generateUnit({
  category: NODE_CATEGORIES.BASS_CLEF,
  unitNumber: 2,
  unitName: 'Five Finger Low',
  theme: 'Going Lower',
  baseNotePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
  clef: 'bass',
  startOrder: bassUnit1[bassUnit1.length - 1].order + 1,
  rhythmTiers: [1, 2, 3, 4],
  includeIntro: true,
  includeBoss: true,
  bossConfig: {
    accessoryUnlock: 'bass_five_finger_badge'
  }
});

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

// Combine all new nodes
export const EXPANDED_NODES = [
  // Redesigned treble clef units (Units 1-3)
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,

  // Legacy bass clef units (to be redesigned)
  ...bassUnit1,
  ...bassUnit2,

  // Legacy rhythm units (to be redesigned)
  ...rhythmUnit1,
  ...rhythmUnit2
];

// Export by category for easy integration
export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes
];
export const EXPANDED_BASS_NODES = [...bassUnit1, ...bassUnit2];
export const EXPANDED_RHYTHM_NODES = [...rhythmUnit1, ...rhythmUnit2];

// Update prerequisites to link between units
export const linkUnitPrerequisites = (nodes) => {
  const updatedNodes = [...nodes];

  // Treble Unit 2 prerequisites are already set in trebleUnit2Redesigned.js
  // Treble Unit 3 prerequisites are already set in trebleUnit3Redesigned.js

  // Link Bass Unit 2 to Unit 1 boss
  const bassUnit2Start = updatedNodes.find(n => n.id === 'bass_2_1');
  if (bassUnit2Start) {
    bassUnit2Start.prerequisites = ['boss_bass_1'];
  }

  // Link Rhythm Unit 2 to Unit 1 boss
  const rhythmUnit2Start = updatedNodes.find(n => n.id === 'rhythm_2_1');
  if (rhythmUnit2Start) {
    rhythmUnit2Start.prerequisites = ['boss_rhythm_1'];
  }

  return updatedNodes;
};

export default linkUnitPrerequisites(EXPANDED_NODES);
