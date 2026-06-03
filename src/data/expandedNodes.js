/**
 * Expanded Trail Nodes - Fully Redesigned System
 *
 * Educational psychology-driven trail system for 8-year-old learners.
 *
 * Treble Units 1-7: Redesigned (C4 to C5, including sharps, flats, and key signatures)
 * Bass Units 1-7: Redesigned (C4 to C3, including sharps, flats, and key signatures)
 * Rhythm Units 1-10: Phase 1 v3.5 pedagogical restructure
 *   U1: Quarter + Quarter Rest    U6: Dotted Half
 *   U2: Half + Half Rest          U7: Dotted Quarter
 *   U3: Whole + Whole Rest        U8: 3/4 Meter
 *   U4: Eighth Notes              U9: 6/8 Meter
 *   U5: Sixteenth Notes           U10: Rhythm Review (cumulative BOSS only)
 *   NOTE: A separate Rhythm Syncopation unit ("Off-Beat Magic", IDs rhythm_synco_*)
 *   is built but HIDDEN pending re-enable in a future release. Grep `HIDDEN-V1`
 *   below to restore.
 * Ear Training Units 1-2: Sound Direction (pitch comparison) and Interval Explorer (interval identification)
 *
 * All units follow consistent NODE_TYPES pattern with pedagogical scaffolding.
 */

import trebleUnit1Nodes from "./units/trebleUnit1Redesigned.js";
import trebleUnit2Nodes from "./units/trebleUnit2Redesigned.js";
import trebleUnit3Nodes from "./units/trebleUnit3Redesigned.js";

// Treble accidentals units (sharps and flats)
import trebleUnit4Nodes from "./units/trebleUnit4Redesigned.js";
import trebleUnit5Nodes from "./units/trebleUnit5Redesigned.js";

// Key signature treble units
import trebleUnit6Nodes from "./units/trebleUnit6Redesigned.js";
import trebleUnit7Nodes from "./units/trebleUnit7Redesigned.js";

// Redesigned bass clef units
import bassUnit1Nodes from "./units/bassUnit1Redesigned.js";
import bassUnit2Nodes from "./units/bassUnit2Redesigned.js";
import bassUnit3Nodes from "./units/bassUnit3Redesigned.js";

// Bass accidentals units (sharps and flats)
import bassUnit4Nodes from "./units/bassUnit4Redesigned.js";
import bassUnit5Nodes from "./units/bassUnit5Redesigned.js";

// Key signature bass units
import bassUnit6Nodes from "./units/bassUnit6Redesigned.js";
import bassUnit7Nodes from "./units/bassUnit7Redesigned.js";

// Phase 1 v3.5: Rhythm trail pedagogical restructure (10 units, durations → subdivisions → dotted → meters).
import rhythmUnit1Nodes from "./units/rhythmUnit1.js";
import rhythmUnit2Nodes from "./units/rhythmUnit2.js";
import rhythmUnit3Nodes from "./units/rhythmUnit3.js";
import rhythmUnit4Nodes from "./units/rhythmUnit4.js";
import rhythmUnit5Nodes from "./units/rhythmUnit5.js";
import rhythmUnit6Nodes from "./units/rhythmUnit6.js";
import rhythmUnit7Nodes from "./units/rhythmUnit7.js";
import rhythmUnit8Nodes from "./units/rhythmUnit8.js";
import rhythmUnit9Nodes from "./units/rhythmUnit9.js";
import rhythmUnit10Nodes from "./units/rhythmUnit10.js";

// HIDDEN-V1: Syncopation unit ("Off-Beat Magic", renamed to rhythm_synco_*/boss_rhythm_synco per Phase 1 v3.5 D-10) — temporarily disabled — re-enable for future release.
// Binding renamed from rhythmUnit8Nodes → rhythmUnit8SyncoNodes to avoid collision with NEW U8 (3/4 Meter) which now owns the rhythmUnit8Nodes name.
// To re-enable: (1) uncomment the import below; (2) uncomment both spread lines in EXPANDED_NODES + EXPANDED_RHYTHM_NODES; (3) UNITS.RHYTHM_SYNCO entry already exists in skillTrail.js (pre-authored by Phase 1 Plan 08 Task 4); (4) update CLAUDE.md node counts.
// import rhythmUnit8SyncoNodes from './units/rhythmUnit8Redesigned.js';

// HIDDEN-V1: Ear training units (Unit 1 "Sound Direction" / pitch comparison, Unit 2 "Interval Explorer" / interval ID) — temporarily disabled — re-enable for future release.
// Presented as "Coming Soon" in the trail tab (TrailMap empty-state) and on the standalone games screen (PracticeModes card).
// To re-enable: (1) uncomment both imports below; (2) uncomment both spread lines in EXPANDED_NODES; (3) restore the EXPANDED_EAR_TRAINING_NODES array; (4) remove the comingSoon branch in PracticeModes.jsx. UNITS.EAR_1/EAR_2, the ear_training tab config, routes, and unit files are all preserved.
// import earTrainingUnit1Nodes from "./units/earTrainingUnit1.js";
// import earTrainingUnit2Nodes from "./units/earTrainingUnit2.js";

// Combine all nodes
export const EXPANDED_NODES = [
  // Redesigned treble clef units (Units 1-5)
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes, // Treble sharps (F#4, C#4, G#4)
  ...trebleUnit5Nodes, // Treble flats (Bb4, Eb4, Ab4, Db4) + accidentals boss
  // Key signature units
  ...trebleUnit6Nodes,
  ...trebleUnit7Nodes,

  // Redesigned bass clef units (Units 1-5)
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes, // Bass sharps (F#3, C#3, G#3)
  ...bassUnit5Nodes, // Bass flats (Bb3, Eb3, Ab3, Db3) + accidentals boss
  // Bass key signature units
  ...bassUnit6Nodes,
  ...bassUnit7Nodes,

  // Phase 1 v3.5: Rhythm Units 1-10 (durations → subdivisions → dotted → meters → review boss)
  ...rhythmUnit1Nodes,
  ...rhythmUnit2Nodes,
  ...rhythmUnit3Nodes,
  ...rhythmUnit4Nodes,
  ...rhythmUnit5Nodes,
  ...rhythmUnit6Nodes,
  ...rhythmUnit7Nodes,
  ...rhythmUnit8Nodes,
  ...rhythmUnit9Nodes,
  ...rhythmUnit10Nodes,
  // HIDDEN-V1: ...rhythmUnit8SyncoNodes (rhythm_synco_*),

  // HIDDEN-V1: Ear training units — temporarily disabled (see import block above).
  // ...earTrainingUnit1Nodes,
  // ...earTrainingUnit2Nodes,
];

// Export by category for easy integration
export const EXPANDED_TREBLE_NODES = [
  ...trebleUnit1Nodes,
  ...trebleUnit2Nodes,
  ...trebleUnit3Nodes,
  ...trebleUnit4Nodes, // Treble sharps (F#4, C#4, G#4)
  ...trebleUnit5Nodes, // Treble flats (Bb4, Eb4, Ab4, Db4) + accidentals boss
  ...trebleUnit6Nodes,
  ...trebleUnit7Nodes,
];
export const EXPANDED_BASS_NODES = [
  ...bassUnit1Nodes,
  ...bassUnit2Nodes,
  ...bassUnit3Nodes,
  ...bassUnit4Nodes, // Bass sharps (F#3, C#3, G#3)
  ...bassUnit5Nodes, // Bass flats (Bb3, Eb3, Ab3, Db3) + accidentals boss
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
  ...rhythmUnit9Nodes,
  ...rhythmUnit10Nodes,
  // HIDDEN-V1: ...rhythmUnit8SyncoNodes (rhythm_synco_*),
];

// HIDDEN-V1: Ear training nodes — temporarily disabled (see import block above). Empty array keeps downstream imports resolving.
// To re-enable, restore:
//   ...earTrainingUnit1Nodes,
//   ...earTrainingUnit2Nodes,
export const EXPANDED_EAR_TRAINING_NODES = [];

// Update prerequisites to link between units
// Note: All unit prerequisites are now set in their redesigned files
export const linkUnitPrerequisites = (nodes) => {
  // Prerequisites are now set in redesigned unit files
  // No runtime linking needed
  return [...nodes];
};

export default linkUnitPrerequisites(EXPANDED_NODES);
