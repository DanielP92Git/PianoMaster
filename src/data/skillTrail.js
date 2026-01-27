/**
 * Skill Trail Node Definitions
 *
 * Each node represents a learnable skill unit in the piano learning journey.
 * Nodes are organized into parallel paths: Treble Clef, Bass Clef, and Rhythm.
 */

// Node categories for organization
export const NODE_CATEGORIES = {
  TREBLE_CLEF: 'treble_clef',
  BASS_CLEF: 'bass_clef',
  RHYTHM: 'rhythm',
  BOSS: 'boss'
};

// Exercise types that can be used in nodes
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  BOSS_CHALLENGE: 'boss_challenge'
};

/**
 * Skill Trail Nodes
 * Each node contains:
 * - id: Unique identifier
 * - name: Display name
 * - description: What the student will learn
 * - category: Which path this belongs to
 * - order: Position in the path
 * - prerequisites: Array of node IDs that must be completed (empty for start nodes)
 * - skills: Array of note names or rhythm patterns covered
 * - exercises: Array of exercise configurations
 * - xpReward: Base XP reward (multiplied by stars earned)
 * - accessoryUnlock: Optional accessory to unlock on completion (null if none)
 * - isBoss: Whether this is a boss battle node
 */
export const SKILL_NODES = [
  // ============================================
  // TREBLE CLEF PATH
  // Progressive note introduction: C4 → D4 → E4 → F4,G4 → A4 → B4 → C5
  // ============================================
  {
    id: 'treble_c_d',
    name: 'C & D',
    description: 'Learn your first two treble clef notes',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 1,
    prerequisites: [],
    skills: ['C4', 'D4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4'],
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'treble_c_e',
    name: 'C, D, E',
    description: 'Expand your range to three notes',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 2,
    prerequisites: ['treble_c_d'],
    skills: ['C4', 'D4', 'E4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'treble_five_finger',
    name: 'C, D, E, F, G',
    description: 'Master the five-finger position',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 3,
    prerequisites: ['treble_c_e'],
    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'treble_c_a',
    name: 'C, D, E, F, G, A',
    description: 'Continue expanding your keyboard range',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 4,
    prerequisites: ['treble_five_finger'],
    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
          questionCount: 12,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'treble_almost_there',
    name: 'C, D, E, F, G, A, B',
    description: 'Nearly complete the full octave',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 5,
    prerequisites: ['treble_c_a'],
    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
          questionCount: 12,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 60,
    accessoryUnlock: 'blue_star_badge',
    isBoss: false
  },
  {
    id: 'treble_full_octave',
    name: 'C, D, E, F, G, A, B, C',
    description: 'Master the complete octave from C to C',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    order: 6,
    prerequisites: ['treble_almost_there'],
    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 75,
    accessoryUnlock: 'golden_treble_clef',
    isBoss: false
  },

  // ============================================
  // BASS CLEF PATH
  // Progressive note introduction: C4,B3 → A3 → G3 → F3 → E3,D3 → C3 (+ lower range)
  // ============================================
  {
    id: 'bass_c_b',
    name: 'C & B',
    description: 'Learn your first two bass clef notes',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 1,
    prerequisites: [],
    skills: ['C4', 'B3'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3'],
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'bass_c_a',
    name: 'C, B, A',
    description: 'Expand your bass range downward',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 2,
    prerequisites: ['bass_c_b'],
    skills: ['C4', 'B3', 'A3'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3'],
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'bass_c_g',
    name: 'C, B, A, G',
    description: 'Continue building your bass territory',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 3,
    prerequisites: ['bass_c_a'],
    skills: ['C4', 'B3', 'A3', 'G3'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3'],
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'bass_c_f',
    name: 'C, B, A, G, F',
    description: 'Add F to your bass range',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 4,
    prerequisites: ['bass_c_g'],
    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'bass_almost_there',
    name: 'C, B, A, G, F, E, D',
    description: 'Nearly complete the upper bass range',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 5,
    prerequisites: ['bass_c_f'],
    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
          questionCount: 12,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 60,
    accessoryUnlock: 'green_music_note',
    isBoss: false
  },
  {
    id: 'bass_master',
    name: 'C, B, A, G, F, E, D, C',
    description: 'Master the complete bass clef range',
    category: NODE_CATEGORIES.BASS_CLEF,
    order: 6,
    prerequisites: ['bass_almost_there'],
    skills: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
          questionCount: 15,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 75,
    accessoryUnlock: 'golden_bass_clef',
    isBoss: false
  },

  // ============================================
  // RHYTHM PATH
  // ============================================
  {
    id: 'rhythm_intro',
    name: 'Rhythm Basics',
    description: 'Learn to keep time with a metronome',
    category: NODE_CATEGORIES.RHYTHM,
    order: 1,
    prerequisites: [],
    skills: ['quarter_note', 'steady_beat'],
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter'],
          tempo: 60,
          measuresPerPattern: 1,
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'rhythm_quarter_notes',
    name: 'Quarter Notes',
    description: 'Master playing steady quarter notes',
    category: NODE_CATEGORIES.RHYTHM,
    order: 2,
    prerequisites: ['rhythm_intro'],
    skills: ['quarter_note'],
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'rhythm_half_notes',
    name: 'Half Notes',
    description: 'Learn to hold notes for two beats',
    category: NODE_CATEGORIES.RHYTHM,
    order: 3,
    prerequisites: ['rhythm_quarter_notes'],
    skills: ['half_note'],
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['half', 'quarter'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false
  },
  {
    id: 'rhythm_eighth_notes',
    name: 'Eighth Notes',
    description: 'Practice faster rhythms with eighth notes',
    category: NODE_CATEGORIES.RHYTHM,
    order: 4,
    prerequisites: ['rhythm_half_notes'],
    skills: ['eighth_note'],
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['eighth', 'quarter'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 60,
    accessoryUnlock: 'metronome_icon',
    isBoss: false
  },
  {
    id: 'rhythm_mixed',
    name: 'Mixed Rhythms',
    description: 'Combine all rhythm patterns you\'ve learned',
    category: NODE_CATEGORIES.RHYTHM,
    order: 5,
    prerequisites: ['rhythm_eighth_notes'],
    skills: ['quarter_note', 'half_note', 'eighth_note'],
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4'
        }
      }
    ],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false
  },

  // ============================================
  // BOSS BATTLES
  // ============================================
  {
    id: 'boss_treble_warrior',
    name: 'Treble Warrior Challenge',
    description: 'Test your treble clef mastery!',
    category: NODE_CATEGORIES.BOSS,
    order: 100,
    prerequisites: ['treble_full_octave'],
    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    exercises: [
      {
        type: EXERCISE_TYPES.BOSS_CHALLENGE,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          questionCount: 20,
          clef: 'treble',
          timeLimit: 180000, // 3 minutes
          difficulty: 'hard'
        }
      }
    ],
    xpReward: 200,
    accessoryUnlock: 'ninja_headband',
    isBoss: true
  },
  {
    id: 'boss_bass_master',
    name: 'Bass Clef Master Challenge',
    description: 'Prove your bass clef expertise!',
    category: NODE_CATEGORIES.BOSS,
    order: 101,
    prerequisites: ['bass_master'],
    skills: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
    exercises: [
      {
        type: EXERCISE_TYPES.BOSS_CHALLENGE,
        config: {
          notePool: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
          questionCount: 20,
          clef: 'bass',
          timeLimit: 180000, // 3 minutes
          difficulty: 'hard'
        }
      }
    ],
    xpReward: 200,
    accessoryUnlock: 'wizard_hat',
    isBoss: true
  },
  {
    id: 'boss_rhythm_master',
    name: 'Rhythm Master Challenge',
    description: 'Show off your rhythm skills!',
    category: NODE_CATEGORIES.BOSS,
    order: 102,
    prerequisites: ['rhythm_mixed'],
    skills: ['quarter_note', 'half_note', 'eighth_note', 'whole_note'],
    exercises: [
      {
        type: EXERCISE_TYPES.BOSS_CHALLENGE,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth', 'whole'],
          tempo: 100,
          measuresPerPattern: 4,
          timeSignature: '4/4',
          difficulty: 'hard'
        }
      }
    ],
    xpReward: 200,
    accessoryUnlock: 'golden_metronome',
    isBoss: true
  }
];

/**
 * Get nodes by category
 */
export const getNodesByCategory = (category) => {
  return SKILL_NODES.filter(node => node.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get node by ID
 */
export const getNodeById = (nodeId) => {
  return SKILL_NODES.find(node => node.id === nodeId);
};

/**
 * Get all boss nodes
 */
export const getBossNodes = () => {
  return SKILL_NODES.filter(node => node.isBoss)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get starting nodes (no prerequisites)
 */
export const getStartingNodes = () => {
  return SKILL_NODES.filter(node => node.prerequisites.length === 0);
};

/**
 * Check if a node is unlocked for a student based on completed nodes
 */
export const isNodeUnlocked = (nodeId, completedNodeIds) => {
  const node = getNodeById(nodeId);
  if (!node) return false;

  // Check if all prerequisites are completed
  return node.prerequisites.every(prereqId => completedNodeIds.includes(prereqId));
};

/**
 * Get all unlocked nodes for a student
 */
export const getUnlockedNodes = (completedNodeIds) => {
  return SKILL_NODES.filter(node => isNodeUnlocked(node.id, completedNodeIds));
};

/**
 * Get all skill nodes
 */
export const getAllNodes = () => {
  return SKILL_NODES;
};

export default SKILL_NODES;
