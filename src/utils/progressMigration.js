/**
 * Progress Migration Utility
 *
 * Migrates existing users from the legacy 18-node trail to the new 90-node unit-based system.
 * This is a one-time migration that preserves user progress while updating to the new structure.
 */

import { getStudentProgress, updateNodeProgress } from '../services/skillProgressService';
import { awardXP } from './xpSystem';

/**
 * Mapping from legacy node IDs to new node IDs
 * This preserves user progress during the migration
 */
const LEGACY_TO_NEW_NODE_MAPPING = {
  // Treble Clef mappings
  'treble_c_d': 'treble_1_1',              // C & D → First Position - Introduction
  'treble_c_e': 'treble_1_2',              // C, D, E → First Position - Quarters Only
  'treble_five_finger': 'treble_2_1',      // Five Finger → Five Finger Position - Introduction
  'treble_c_a': 'treble_2_2',              // C to A → Five Finger Position - Quarters Only
  'treble_almost_there': 'treble_3_1',     // Almost There → Full Octave - Introduction (future)
  'treble_full_octave': 'treble_3_2',      // Full Octave → Full Octave - Quarters Only (future)

  // Bass Clef mappings
  'bass_c_b': 'bass_1_1',                  // C & B → Middle C Position - Introduction
  'bass_c_a': 'bass_1_2',                  // C, B, A → Middle C Position - Quarters Only
  'bass_c_g': 'bass_2_1',                  // C to G → Five Finger Low - Introduction
  'bass_c_f': 'bass_2_2',                  // C to F → Five Finger Low - Quarters Only
  'bass_almost_there': 'bass_3_1',         // Almost There → Full Octave Down (future)
  'bass_master': 'bass_3_2',               // Master → Full Octave Down (future)

  // Rhythm mappings
  'rhythm_intro': 'rhythm_1_1',            // Rhythm Basics → Steady Beat - Quarters Only
  'rhythm_quarter_notes': 'rhythm_1_2',    // Quarter Notes → Steady Beat - Quarters + Halves
  'rhythm_half_notes': 'rhythm_1_2',       // Half Notes → Steady Beat - Quarters + Halves (merge)
  'rhythm_eighth_notes': 'rhythm_2_1',     // Eighth Notes → Eighth Notes - Quarters + Eighths
  'rhythm_mixed': 'rhythm_2_2',            // Mixed Rhythms → Eighth Notes - All Rhythms

  // Boss battles (map to unit bosses)
  'boss_treble_warrior': 'boss_treble_2',  // Treble Warrior → Unit 2 Boss (most advanced completed)
  'boss_bass_master': 'boss_bass_2',       // Bass Master → Unit 2 Boss
  'boss_rhythm_master': 'boss_rhythm_2'    // Rhythm Master → Unit 2 Boss
};

/**
 * Check if user has already been migrated
 * Uses localStorage to track migration status
 * @param {string} studentId - Student UUID
 * @returns {boolean} True if already migrated
 */
export const isMigrated = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  return localStorage.getItem(migrationKey) === 'complete';
};

/**
 * Mark user as migrated
 * @param {string} studentId - Student UUID
 */
const markMigrated = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  localStorage.setItem(migrationKey, 'complete');
  localStorage.setItem(`${migrationKey}_date`, new Date().toISOString());
};

/**
 * Migrate a single student's progress
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Migration result with stats
 */
export const migrateStudentProgress = async (studentId) => {
  try {
    // Check if already migrated
    if (isMigrated(studentId)) {
      console.log('User already migrated, skipping...');
      return {
        success: true,
        alreadyMigrated: true,
        nodesMigrated: 0,
        xpAwarded: 0
      };
    }

    // Get existing progress
    const existingProgress = await getStudentProgress(studentId);

    // Track migration results
    const migrationStats = {
      nodesMigrated: 0,
      nodesSkipped: 0,
      xpAwarded: 0,
      mappings: []
    };

    // Migrate each node
    for (const progress of existingProgress) {
      const oldNodeId = progress.node_id;
      const newNodeId = LEGACY_TO_NEW_NODE_MAPPING[oldNodeId];

      if (!newNodeId) {
        console.warn(`No mapping found for legacy node: ${oldNodeId}`);
        migrationStats.nodesSkipped++;
        continue;
      }

      // Check if new node already has progress (avoid duplicates)
      const existingNewProgress = existingProgress.find(p => p.node_id === newNodeId);
      if (existingNewProgress) {
        console.log(`New node ${newNodeId} already has progress, skipping...`);
        migrationStats.nodesSkipped++;
        continue;
      }

      // Migrate progress to new node
      await updateNodeProgress(
        studentId,
        newNodeId,
        progress.stars,
        progress.best_score
      );

      migrationStats.nodesMigrated++;
      migrationStats.mappings.push({
        from: oldNodeId,
        to: newNodeId,
        stars: progress.stars,
        score: progress.best_score
      });

      console.log(`Migrated: ${oldNodeId} → ${newNodeId} (${progress.stars} stars)`);
    }

    // Award bonus XP for migration
    // Give students a small XP bonus to acknowledge their existing progress
    if (migrationStats.nodesMigrated > 0) {
      const bonusXP = migrationStats.nodesMigrated * 25; // 25 XP per migrated node
      await awardXP(studentId, bonusXP);
      migrationStats.xpAwarded = bonusXP;
    }

    // Mark as migrated
    markMigrated(studentId);

    console.log('Migration complete:', migrationStats);

    return {
      success: true,
      alreadyMigrated: false,
      ...migrationStats
    };
  } catch (error) {
    console.error('Error migrating student progress:', error);
    throw error;
  }
};

/**
 * Reset migration status (for testing/debugging)
 * @param {string} studentId - Student UUID
 */
export const resetMigration = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  localStorage.removeItem(migrationKey);
  localStorage.removeItem(`${migrationKey}_date`);
  console.log('Migration status reset for student:', studentId);
};

/**
 * Get migration info for a student
 * @param {string} studentId - Student UUID
 * @returns {Object} Migration status and date
 */
export const getMigrationInfo = (studentId) => {
  const migrationKey = `trail_migration_v2_${studentId}`;
  const migrated = localStorage.getItem(migrationKey) === 'complete';
  const migrationDate = localStorage.getItem(`${migrationKey}_date`);

  return {
    migrated,
    migrationDate: migrationDate ? new Date(migrationDate) : null
  };
};

/**
 * Run migration if needed (convenience wrapper for Dashboard)
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Migration result
 */
export const runMigrationIfNeeded = async (studentId) => {
  try {
    // Check if already migrated
    if (isMigrated(studentId)) {
      return {
        skipped: true,
        reason: 'Already migrated',
        nodesCreated: 0,
        totalXPAwarded: 0
      };
    }

    // Run migration
    const result = await migrateStudentProgress(studentId);

    if (result.alreadyMigrated) {
      return {
        skipped: true,
        reason: 'Already migrated',
        nodesCreated: 0,
        totalXPAwarded: 0
      };
    }

    // Return dashboard-compatible format
    return {
      skipped: false,
      nodesCreated: result.nodesMigrated,
      totalXPAwarded: result.xpAwarded,
      mappings: result.mappings
    };
  } catch (error) {
    console.error('Migration check failed:', error);
    // Return skipped on error to avoid breaking the app
    return {
      skipped: true,
      reason: 'Error occurred',
      error: error.message,
      nodesCreated: 0,
      totalXPAwarded: 0
    };
  }
};

export default {
  migrateStudentProgress,
  isMigrated,
  resetMigration,
  getMigrationInfo,
  runMigrationIfNeeded,
  LEGACY_TO_NEW_NODE_MAPPING
};
