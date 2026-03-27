/**
 * rhythmTimingUtils.js
 *
 * Shared timing and distractor utilities for RhythmReadingGame and RhythmDictationGame.
 * Ported from MetronomeTrainer.jsx calculateTimingThresholds (lines 47-64).
 */

// Base timing thresholds at 120 BPM (in milliseconds)
// Matches MetronomeTrainer.jsx BASE_TIMING_THRESHOLDS exactly.
const BASE_TIMING_THRESHOLDS = {
  PERFECT: 50,  // ±50ms at 120 BPM
  GOOD: 75,     // ±75ms at 120 BPM
  FAIR: 125,    // ±125ms at 120 BPM
};

const BASE_TEMPO = 120;

/**
 * Calculate dynamic timing thresholds based on tempo.
 *
 * Uses gentle exponential scaling (exponent 0.3) so that:
 *   - Slower tempos (60 BPM) get more generous windows (~40% wider)
 *   - Faster tempos (180 BPM) get stricter windows (~25% tighter)
 *
 * Ported from MetronomeTrainer.jsx — same algorithm, same base values.
 *
 * @param {number} tempo - Tempo in BPM
 * @returns {{ PERFECT: number, GOOD: number, FAIR: number }} Thresholds in ms
 */
export function calculateTimingThresholds(tempo) {
  // Gentle exponential scaling: slower = more generous, faster = stricter
  const scalingFactor = Math.pow(BASE_TEMPO / tempo, 0.3);

  return {
    PERFECT: Math.round(BASE_TIMING_THRESHOLDS.PERFECT * scalingFactor),
    GOOD: Math.round(BASE_TIMING_THRESHOLDS.GOOD * scalingFactor),
    FAIR: Math.round(BASE_TIMING_THRESHOLDS.FAIR * scalingFactor),
  };
}

/**
 * Duration swap maps for distractor generation (RDICT-04).
 * Swap a beat to a longer duration (longer map) or shorter (shorter map).
 */
const SWAP_LONGER = { 1: 2, 2: 4, 4: 8, 8: 16 };
const SWAP_SHORTER = { 16: 8, 8: 4, 4: 2, 2: 1 };

/**
 * Generate distractor patterns for rhythm dictation game.
 *
 * Each distractor differs from the correct pattern by exactly one duration swap:
 *   - Distractor 1: one beat swapped to a longer duration
 *   - Distractor 2: a different beat swapped to a shorter duration
 * After the swap, an adjacent rest is inserted/modified to keep the total
 * measure duration (sum of durationUnits) constant.
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} correctBeats
 * @param {number} [count=2] - Number of distractors to generate
 * @returns {Array<{ durationUnits: number, isRest: boolean }[]>}
 */
export function generateDistractors(correctBeats, count = 2) {
  const totalDuration = correctBeats.reduce((sum, b) => sum + b.durationUnits, 0);
  const distractors = [];

  // Find non-rest beats that can be swapped
  const swappable = correctBeats.reduce((acc, beat, i) => {
    if (!beat.isRest) acc.push(i);
    return acc;
  }, []);

  if (swappable.length === 0) {
    // Fallback: return copies of correct pattern if nothing to swap
    for (let d = 0; d < count; d++) {
      distractors.push(correctBeats.map((b) => ({ ...b })));
    }
    return distractors;
  }

  const swapMaps = [SWAP_LONGER, SWAP_SHORTER];
  const usedIndices = new Set();

  for (let d = 0; d < count; d++) {
    const swapMap = swapMaps[d % 2];

    // Pick a beat index not used in previous distractors when possible
    let targetIdx = swappable.find((i) => !usedIndices.has(i));
    if (targetIdx === undefined) {
      // Reuse first swappable if we've exhausted unique ones
      targetIdx = swappable[0];
    }
    usedIndices.add(targetIdx);

    const targetBeat = correctBeats[targetIdx];
    const newDuration = swapMap[targetBeat.durationUnits];

    if (!newDuration) {
      // Duration not swappable in this direction — try opposite map
      const altMap = swapMaps[(d + 1) % 2];
      const altDuration = altMap[targetBeat.durationUnits];

      if (!altDuration) {
        // Still can't swap — return copy
        distractors.push(correctBeats.map((b) => ({ ...b })));
        continue;
      }

      const distractor = applySwap(correctBeats, targetIdx, altDuration, totalDuration);
      distractors.push(distractor);
      continue;
    }

    const distractor = applySwap(correctBeats, targetIdx, newDuration, totalDuration);
    distractors.push(distractor);
  }

  return distractors;
}

/**
 * Apply a duration swap at the target index and compensate with an adjacent rest.
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} beats
 * @param {number} targetIdx - Index of beat to swap
 * @param {number} newDuration - New durationUnits for the target beat
 * @param {number} totalDuration - Total measure duration to maintain
 * @returns {{ durationUnits: number, isRest: boolean }[]}
 */
function applySwap(beats, targetIdx, newDuration, totalDuration) {
  const result = beats.map((b) => ({ ...b }));
  result[targetIdx] = { durationUnits: newDuration, isRest: false };

  const currentTotal = result.reduce((sum, b) => sum + b.durationUnits, 0);
  const compensate = totalDuration - currentTotal; // what we need to add/remove

  if (compensate === 0) return result;

  // Try to add/remove compensation from the beat immediately after the target
  const nextIdx = targetIdx + 1;
  if (nextIdx < result.length) {
    const nextBeat = result[nextIdx];
    if (nextBeat.isRest && compensate > 0) {
      // Extend existing rest
      result[nextIdx] = { durationUnits: nextBeat.durationUnits + compensate, isRest: true };
    } else if (nextBeat.isRest && compensate < 0 && nextBeat.durationUnits + compensate > 0) {
      // Shrink existing rest
      result[nextIdx] = { durationUnits: nextBeat.durationUnits + compensate, isRest: true };
    } else if (compensate > 0) {
      // Insert a rest after target
      result.splice(nextIdx, 0, { durationUnits: compensate, isRest: true });
    } else if (compensate < 0 && nextBeat.durationUnits + compensate > 0) {
      // Shrink next beat
      result[nextIdx] = { ...nextBeat, durationUnits: nextBeat.durationUnits + compensate };
    } else if (compensate < 0) {
      // Remove next beat entirely and adjust
      result.splice(nextIdx, 1);
    }
  } else if (compensate > 0) {
    // Append rest at end
    result.push({ durationUnits: compensate, isRest: true });
  } else if (compensate < 0) {
    // Try to trim from last beat
    const lastIdx = result.length - 1;
    if (result[lastIdx].durationUnits + compensate > 0) {
      result[lastIdx] = { ...result[lastIdx], durationUnits: result[lastIdx].durationUnits + compensate };
    }
  }

  // Final validation: ensure total is still correct (defensive)
  const finalTotal = result.reduce((sum, b) => sum + b.durationUnits, 0);
  if (finalTotal !== totalDuration && result.length > 0) {
    // Force-correct the last element
    const lastIdx = result.length - 1;
    const adjustment = totalDuration - finalTotal;
    result[lastIdx] = { ...result[lastIdx], durationUnits: result[lastIdx].durationUnits + adjustment };
  }

  return result;
}

/**
 * Schedule audio playback of a beat pattern via a playNote callback.
 *
 * Uses `audioContext.currentTime + 0.1` as the start time to give the audio
 * scheduler a small buffer before the first note fires.
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} beats
 * @param {number} tempo - Tempo in BPM
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {function} playNote - usePianoSampler().playNote callback
 * @returns {{ startTime: number, totalDuration: number }}
 */
export function schedulePatternPlayback(beats, tempo, audioContext, playNote) {
  const beatDuration = 60 / tempo; // seconds per quarter note
  const sixteenthDuration = beatDuration / 4; // seconds per sixteenth note
  const startTime = audioContext.currentTime + 0.1; // small scheduler buffer
  let offset = 0;

  beats.forEach((beat) => {
    if (!beat.isRest) {
      playNote('C4', {
        startTime: startTime + offset,
        duration: sixteenthDuration * beat.durationUnits * 0.8, // slight staccato
      });
    }
    offset += sixteenthDuration * beat.durationUnits;
  });

  return { startTime, totalDuration: offset };
}
