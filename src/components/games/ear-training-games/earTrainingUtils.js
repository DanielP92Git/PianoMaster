/**
 * earTrainingUtils.js
 *
 * Shared utility functions for NoteComparisonGame and IntervalGame.
 * Provides note pair generation, tier-band progression, interval classification,
 * and ascending-first ordering.
 *
 * Decisions implemented:
 * - D-09: Tiered bands (wide → medium → close) across 10 questions
 * - D-10: Ascending-first split (~60% ascending, ~40% mixed)
 * - D-08: getNotesInBetween for in-between key dim highlights
 */

import { NOTE_FREQS } from '../../../hooks/usePianoSampler';

/**
 * Ordered array of all 24 chromatic notes (C3 through B4).
 * Index 0 = C3, index 23 = B4.
 */
export const NOTE_ORDER = Object.keys(NOTE_FREQS);

/**
 * Tier-band progression for NoteComparisonGame (D-09).
 * Tier 1 (Q0-2): wide intervals (6-12 semitones)
 * Tier 2 (Q3-6): medium intervals (3-5 semitones)
 * Tier 3 (Q7-9): close intervals (1-2 semitones)
 */
export const COMPARISON_TIERS = [
  { questions: [0, 1, 2], minSemitones: 6, maxSemitones: 12 },
  { questions: [3, 4, 5, 6], minSemitones: 3, maxSemitones: 5 },
  { questions: [7, 8, 9], minSemitones: 1, maxSemitones: 2 },
];

/**
 * Returns the matching tier object for the given question index.
 * Falls back to COMPARISON_TIERS[0] for out-of-range indices.
 *
 * @param {number} questionIndex - 0-based question index
 * @returns {{ questions: number[], minSemitones: number, maxSemitones: number }}
 */
export function getTierForQuestion(questionIndex) {
  const tier = COMPARISON_TIERS.find((t) => t.questions.includes(questionIndex));
  return tier ?? COMPARISON_TIERS[0];
}

/**
 * Generates a random note pair within the specified semitone range.
 * Ensures note1 !== note2 (semitones !== 0).
 * Both notes are clamped to NOTE_ORDER[0..23] (C3-B4 range).
 *
 * @param {number} minSemitones - Minimum semitone distance (inclusive, > 0)
 * @param {number} maxSemitones - Maximum semitone distance (inclusive)
 * @returns {{ note1: string, note2: string, semitones: number, direction: 'ascending' | 'descending' }}
 */
export function generateNotePair(minSemitones, maxSemitones) {
  const maxAttempts = 10;
  const maxIndex = NOTE_ORDER.length - 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Pick random semitone delta in [minSemitones, maxSemitones]
    const range = maxSemitones - minSemitones;
    const delta = minSemitones + Math.floor(Math.random() * (range + 1));

    // Randomly decide ascending or descending
    const ascending = Math.random() < 0.5;

    // Pick a random note1 index
    const note1Index = Math.floor(Math.random() * NOTE_ORDER.length);

    // Compute note2 index
    let note2Index = ascending ? note1Index + delta : note1Index - delta;

    // Clamp to valid range
    note2Index = Math.max(0, Math.min(maxIndex, note2Index));

    // Verify semitones > 0 after clamping
    const actualSemitones = note2Index - note1Index;
    if (actualSemitones === 0) continue;

    return {
      note1: NOTE_ORDER[note1Index],
      note2: NOTE_ORDER[note2Index],
      semitones: actualSemitones,
      direction: actualSemitones > 0 ? 'ascending' : 'descending',
    };
  }

  // Safe fallback: C3 to C4 (12 semitones ascending)
  return {
    note1: 'C3',
    note2: 'C4',
    semitones: 12,
    direction: 'ascending',
  };
}

/**
 * Classifies an interval by semitone distance into step/skip/leap
 * using age-appropriate vocabulary (D-06, INTV-02):
 * - step: 1-2 semitones ("next door")
 * - skip: 3-4 semitones ("jump one")
 * - leap: 5+ semitones ("far apart")
 *
 * @param {number} semitones - Semitone distance (positive or negative)
 * @returns {'step' | 'skip' | 'leap'}
 */
export function classifyInterval(semitones) {
  const abs = Math.abs(semitones);
  if (abs <= 2) return 'step';
  if (abs <= 4) return 'skip';
  return 'leap';
}

/**
 * Generates an interval question with ascending-first ordering (D-10).
 * - First ascendingRatio * totalQuestions questions are forced ascending
 * - Remaining questions allow random ascending or descending
 * - Category is evenly distributed across step/skip/leap
 *
 * @param {number} questionIndex - 0-based question index
 * @param {number} totalQuestions - Total questions in session (default 10)
 * @param {number} ascendingRatio - Fraction of questions forced ascending (default 0.6)
 * @returns {{ note1: string, note2: string, semitones: number, direction: 'ascending' | 'descending', category: 'step' | 'skip' | 'leap' }}
 */
export function generateIntervalQuestion(
  questionIndex,
  totalQuestions = 10,
  ascendingRatio = 0.6
) {
  const forceAscending = questionIndex < totalQuestions * ascendingRatio;

  // Distribute categories evenly: step, skip, leap cycling across questions
  const categories = ['step', 'skip', 'leap'];
  const targetCategory = categories[questionIndex % categories.length];

  // Map category to semitone range
  const semitoneRanges = {
    step: { min: 1, max: 2 },
    skip: { min: 3, max: 4 },
    leap: { min: 5, max: 12 },
  };

  const { min, max } = semitoneRanges[targetCategory];
  const range = max - min;
  const delta = min + Math.floor(Math.random() * (range + 1));

  // Determine direction
  const ascending = forceAscending || Math.random() < 0.5;

  // Pick note1 index, compute note2 index
  const maxIndex = NOTE_ORDER.length - 1;
  let note1Index = Math.floor(Math.random() * NOTE_ORDER.length);
  let note2Index = ascending ? note1Index + delta : note1Index - delta;

  // Clamp to valid range
  note2Index = Math.max(0, Math.min(maxIndex, note2Index));

  // If clamping caused the direction to flip or semitones = 0, adjust note1
  const actualSemitones = note2Index - note1Index;
  if (actualSemitones === 0) {
    // Fallback: force a valid pair
    note1Index = forceAscending ? 0 : maxIndex;
    note2Index = forceAscending ? delta : maxIndex - delta;
    note2Index = Math.max(0, Math.min(maxIndex, note2Index));
  }

  const finalSemitones = note2Index - note1Index;

  return {
    note1: NOTE_ORDER[note1Index],
    note2: NOTE_ORDER[note2Index],
    semitones: finalSemitones,
    direction: finalSemitones >= 0 ? 'ascending' : 'descending',
    category: classifyInterval(finalSemitones),
  };
}

/**
 * Returns the array of note names strictly between note1 and note2
 * in chromatic order (lowest to highest), exclusive of both endpoints.
 *
 * @param {string} note1 - First note name (e.g., 'C4')
 * @param {string} note2 - Second note name (e.g., 'E4')
 * @returns {string[]} Notes strictly between note1 and note2
 */
export function getNotesInBetween(note1, note2) {
  const idx1 = NOTE_ORDER.indexOf(note1);
  const idx2 = NOTE_ORDER.indexOf(note2);

  if (idx1 === -1 || idx2 === -1 || idx1 === idx2) return [];

  const low = Math.min(idx1, idx2);
  const high = Math.max(idx1, idx2);

  return NOTE_ORDER.slice(low + 1, high);
}

