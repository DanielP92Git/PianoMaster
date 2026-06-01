/**
 * Rhythm Unit 10: "Rhythm Review" (Phase 1 v3.5 — D-11)
 *
 * Single cumulative BOSS node — terminus of the rhythm trail.
 * Pulls patterns from all U1–U9 via patternTagMode: "any".
 * No intro/practice/speed nodes — boss-only per D-11.
 *
 * Mirrors the OLD boss_rhythm_6 cumulative shape (rhythmUnit6Redesigned.js
 * lines 327-418) with category="boss" + nodeType=BOSS + measureCount=4.
 * Exercise type is ARCADE_RHYTHM per BOSS game-type policy.
 *
 * Prerequisite: boss_rhythm_9 (6/8 Meter mini-boss).
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 10;
const UNIT_NAME = "Rhythm Review";
const START_ORDER = 200;

const rhythmUnit10Nodes = [
  {
    id: "boss_rhythm_10",
    name: "Rhythm Master",
    description: "Master every rhythm concept from quarters to 6/8!",
    unlockHint: "Complete all rhythm units to unlock this final challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_9"],

    nodeType: NODE_TYPES.BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "w", "8", "16", "qr", "hr", "wr", "hd", "qd"],
      focusDurations: [],
      contextDurations: [
        "q",
        "h",
        "w",
        "8",
        "16",
        "qr",
        "hr",
        "wr",
        "hd",
        "qd",
      ],
      // Cumulative union of patternTags used across U1–U9. After Plans 05/06/07
      // ship, this list can be re-validated by:
      //   grep -h "patternTags:" src/data/units/rhythmUnit{1..9}.js | \
      //     grep -oE '"[a-z0-9-]+(?:-[a-z0-9-]+)*"' | sort -u
      // Verified against today's tag inventory plus six-eight-basic/six-eight-qd-eighths from U9.
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "quarter-rest",
        "half-rest",
        "whole-rest",
        "dotted-half",
        "dotted-quarter",
        "sixteenth",
        "three-four-basic",
        "three-four-with-dotted-half",
        "six-eight-basic",
        "six-eight-qd-eighths",
      ],
      patternTagMode: "any",
      measureCount: 4, // BOSS uses 4-bar patterns
      tempo: { min: 80, max: 100, default: 90 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Master review across all 9 rhythm concepts.",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM, // BOSS policy per validateGameTypePolicy
        config: {
          difficulty: "advanced",
          questionCount: 12,
        },
      },
    ],

    skills: ["rhythm_mastery"],
    xpReward: 250,
    accessoryUnlock: "rhythm_master_badge",
    isBoss: true,
    isReview: true,
    reviewsUnits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
];

export default rhythmUnit10Nodes;
