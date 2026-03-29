/**
 * Expanded Trail Nodes - Fully Redesigned System
 *
 * Educational psychology-driven trail system for 8-year-old learners.
 *
 * Treble Units 1-7: Redesigned (C4 to C5, including sharps, flats, and key signatures)
 * Bass Units 1-7: Redesigned (C4 to C3, including sharps, flats, and key signatures)
 * Rhythm Units 1-8: Redesigned (quarter notes to sixteenths, 6/8 compound meter, syncopation)
 * Ear Training Units 1-2: Sound Direction (pitch comparison) and Interval Explorer (interval identification)
 *
 * All units follow consistent NODE_TYPES pattern with pedagogical scaffolding.
 */

import trebleUnit1Nodes from './units/trebleUnit1Redesigned.js';
import trebleUnit2Nodes from './units/trebleUnit2Redesigned.js';
import trebleUnit3Nodes from './units/trebleUnit3Redesigned.js';

// Treble accidentals units (sharps and flats)
import trebleUnit4Nodes from './units/trebleUnit4Redesigned.js';
import trebleUnit5Nodes from './units/trebleUnit5Redesigned.js';

// Key signature treble units
import trebleUnit6Nodes from './units/trebleUnit6Redesigned.js';
import trebleUnit7Nodes from './units/trebleUnit7Redesigned.js';

// Redesigned bass clef units
import bassUnit1Nodes from './units/bassUnit1Redesigned.js';
import bassUnit2Nodes from './units/bassUnit2Redesigned.js';
import bassUnit3Nodes from './units/bassUnit3Redesigned.js';

// Bass accidentals units (sharps and flats)
import bassUnit4Nodes from './units/bassUnit4Redesigned.js';
import bassUnit5Nodes from './units/bassUnit5Redesigned.js';

// Key signature bass units
import bassUnit6Nodes from './units/bassUnit6Redesigned.js';
import bassUnit7Nodes from './units/bassUnit7Redesigned.js';

// Redesigned rhythm units
import rhythmUnit1Nodes from './units/rhythmUnit1Redesigned.js';
import rhythmUnit2Nodes from './units/rhythmUnit2Redesigned.js';
import rhythmUnit3Nodes from './units/rhythmUnit3Redesigned.js';
import rhythmUnit4Nodes from './units/rhythmUnit4Redesigned.js';
import rhythmUnit5Nodes from './units/rhythmUnit5Redesigned.js';
import rhythmUnit6Nodes from './units/rhythmUnit6Redesigned.js';

// Advanced rhythm units
import rhythmUnit7Nodes from './units/rhythmUnit7Redesigned.js';
import rhythmUnit8Nodes from './units/rhythmUnit8Redesigned.js';

// Ear training units
import earTrainingUnit1Nodes from './units/earTrainingUnit1.js';
import earTrainingUnit2Nodes from './units/earTrainingUnit2.js';

// Combine all nodes
export const EXPANDED_NODES = [
  // Redesigned treble clef units (Units 1-5)
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes,    // Treble sharps (F#4, C#4, G#4)
  ...trebleUnit5Nodes,    // Treble flats (Bb4, Eb4, Ab4, Db4) + accidentals boss
  // Key signature units
  ...trebleUnit6Nodes,
  ...trebleUnit7Nodes,

  // Redesigned bass clef units (Units 1-5)
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes,      // Bass sharps (F#3, C#3, G#3)
  ...bassUnit5Nodes,      // Bass flats (Bb3, Eb3, Ab3, Db3) + accidentals boss
  // Bass key signature units
  ...bassUnit6Nodes,
  ...bassUnit7Nodes,

  // Redesigned rhythm units (Units 1-6)
  ...rhythmUnit1Nodes,
  ...rhythmUnit2Nodes,
  ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes,
  ...rhythmUnit5Nodes,
  ...rhythmUnit6Nodes,
  // Advanced rhythm units
  ...rhythmUnit7Nodes,
  ...rhythmUnit8Nodes,

  // Ear training units
  ...earTrainingUnit1Nodes,
  ...earTrainingUnit2Nodes,
];

// Export by category for easy integration
export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes,    // Treble sharps (F#4, C#4, G#4)
  ...trebleUnit5Nodes,    // Treble flats (Bb4, Eb4, Ab4, Db4) + accidentals boss
  ...trebleUnit6Nodes,
  ...trebleUnit7Nodes,
];
export const EXPANDED_BASS_NODES = [
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes,      // Bass sharps (F#3, C#3, G#3)
  ...bassUnit5Nodes,      // Bass flats (Bb3, Eb3, Ab3, Db3) + accidentals boss
  ...bassUnit6Nodes,
  ...bassUnit7Nodes,
];
export const EXPANDED_RHYTHM_NODES = [
  ...rhythmUnit1Nodes,
  ...rhythmUnit2Nodes,
  ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes,
  ...rhythmUnit5Nodes,
  ...rhythmUnit6Nodes,
  ...rhythmUnit7Nodes,
  ...rhythmUnit8Nodes,
];

export const EXPANDED_EAR_TRAINING_NODES = [
  ...earTrainingUnit1Nodes,
  ...earTrainingUnit2Nodes,
];

// Update prerequisites to link between units
// Note: All unit prerequisites are now set in their redesigned files
export const linkUnitPrerequisites = (nodes) => {
  // Prerequisites are now set in redesigned unit files
  // No runtime linking needed
  return [...nodes];
};

export default linkUnitPrerequisites(EXPANDED_NODES);
