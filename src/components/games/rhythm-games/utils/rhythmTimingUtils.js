/**
 * rhythmTimingUtils.js
 *
 * Shared timing and distractor utilities for RhythmReadingGame and RhythmDictationGame.
 * Ported from MetronomeTrainer.jsx calculateTimingThresholds (lines 47-64).
 */

// Node types that get more forgiving (easy-tier) timing thresholds.
// These are learning/practice nodes where children should feel successful.
const EASY_NODE_TYPES = new Set(["discovery", "practice", "mix_up", "review"]);

// Easy-tier: 2x more forgiving — for learning/discovery/review nodes
const BASE_TIMING_THRESHOLDS_EASY = { PERFECT: 100, GOOD: 150, FAIR: 250 };

// Hard-tier: original thresholds — for challenge/speed_round/boss/mini_boss nodes
const BASE_TIMING_THRESHOLDS_HARD = { PERFECT: 50, GOOD: 75, FAIR: 125 };

const BASE_TEMPO = 120;

/**
 * Calculate dynamic timing thresholds based on tempo and node type.
 *
 * Two-tier system (D-01):
 *   - Easy tier (discovery/practice/mix_up/review): PERFECT=100ms at 120 BPM
 *   - Hard tier (challenge/speed_round/mini_boss/boss/null): PERFECT=50ms at 120 BPM
 *
 * Uses gentle exponential scaling (exponent 0.3) so that:
 *   - Slower tempos (60 BPM) get more generous windows (~40% wider)
 *   - Faster tempos (180 BPM) get stricter windows (~25% tighter)
 *
 * @param {number} tempo - Tempo in BPM
 * @param {string|null} [nodeType=null] - Node type from NODE_TYPES (null = hard tier)
 * @returns {{ PERFECT: number, GOOD: number, FAIR: number }} Thresholds in ms
 */
export function calculateTimingThresholds(tempo, nodeType = null) {
  const base = EASY_NODE_TYPES.has(nodeType)
    ? BASE_TIMING_THRESHOLDS_EASY
    : BASE_TIMING_THRESHOLDS_HARD;

  // Gentle exponential scaling: slower = more generous, faster = stricter
  const scalingFactor = Math.pow(BASE_TEMPO / tempo, 0.3);

  return {
    PERFECT: Math.round(base.PERFECT * scalingFactor),
    GOOD: Math.round(base.GOOD * scalingFactor),
    FAIR: Math.round(base.FAIR * scalingFactor),
  };
}

/**
 * Serialize beats to a fingerprint string for deduplication.
 */
function beatsFingerprint(beats) {
  return beats
    .map((b) => `${b.durationUnits}${b.isRest ? "r" : "n"}`)
    .join(",");
}

/**
 * Pre-built distractor templates per measure length (in sixteenth-note units).
 * Each template is an array of { durationUnits, isRest } beats that sums to
 * the measure length. Templates are designed to be visually distinct from each
 * other so an 8-year-old can clearly see the difference (different note counts,
 * different rhythmic feel).
 */
const DISTRACTOR_TEMPLATES = {
  // 4/4 = 16 sixteenth-note units
  16: [
    // 4 quarter notes
    [
      { d: 4, r: false },
      { d: 4, r: false },
      { d: 4, r: false },
      { d: 4, r: false },
    ],
    // whole note
    [{ d: 16, r: false }],
    // 2 half notes
    [
      { d: 8, r: false },
      { d: 8, r: false },
    ],
    // half + 2 quarters
    [
      { d: 8, r: false },
      { d: 4, r: false },
      { d: 4, r: false },
    ],
    // dotted half + quarter
    [
      { d: 12, r: false },
      { d: 4, r: false },
    ],
    // quarter + half + quarter
    [
      { d: 4, r: false },
      { d: 8, r: false },
      { d: 4, r: false },
    ],
    // 2 quarters + half
    [
      { d: 4, r: false },
      { d: 4, r: false },
      { d: 8, r: false },
    ],
    // quarter + dotted half
    [
      { d: 4, r: false },
      { d: 12, r: false },
    ],
    // half + quarter + quarter rest
    [
      { d: 8, r: false },
      { d: 4, r: false },
      { d: 4, r: true },
    ],
    // quarter rest + quarter + half
    [
      { d: 4, r: true },
      { d: 4, r: false },
      { d: 8, r: false },
    ],
    // quarter + quarter rest + half
    [
      { d: 4, r: false },
      { d: 4, r: true },
      { d: 8, r: false },
    ],
    // 2 quarters + quarter rest + quarter
    [
      { d: 4, r: false },
      { d: 4, r: false },
      { d: 4, r: true },
      { d: 4, r: false },
    ],
  ],
  // 3/4 = 12 sixteenth-note units
  12: [
    // 3 quarter notes
    [
      { d: 4, r: false },
      { d: 4, r: false },
      { d: 4, r: false },
    ],
    // dotted half
    [{ d: 12, r: false }],
    // half + quarter
    [
      { d: 8, r: false },
      { d: 4, r: false },
    ],
    // quarter + half
    [
      { d: 4, r: false },
      { d: 8, r: false },
    ],
    // quarter + quarter rest + quarter
    [
      { d: 4, r: false },
      { d: 4, r: true },
      { d: 4, r: false },
    ],
    // half + quarter rest
    [
      { d: 8, r: false },
      { d: 4, r: true },
    ],
    // quarter rest + half
    [
      { d: 4, r: true },
      { d: 8, r: false },
    ],
  ],
  // 2/4 = 8 sixteenth-note units
  8: [
    // 2 quarter notes
    [
      { d: 4, r: false },
      { d: 4, r: false },
    ],
    // half note
    [{ d: 8, r: false }],
    // quarter + quarter rest
    [
      { d: 4, r: false },
      { d: 4, r: true },
    ],
    // quarter rest + quarter
    [
      { d: 4, r: true },
      { d: 4, r: false },
    ],
    // dotted quarter + eighth
    [
      { d: 6, r: false },
      { d: 2, r: false },
    ],
    // 4 eighths
    [
      { d: 2, r: false },
      { d: 2, r: false },
      { d: 2, r: false },
      { d: 2, r: false },
    ],
  ],
};

/**
 * Expand compact template format to full beat objects.
 */
function expandTemplate(template) {
  return template.map((t) => ({ durationUnits: t.d, isRest: t.r }));
}

/**
 * Count the number of visible notes (non-rest) in a beat array.
 */
function noteCount(beats) {
  return beats.filter((b) => !b.isRest).length;
}

/**
 * Generate distractor patterns for rhythm dictation game.
 *
 * Strategy: pick from pre-built templates that are visually distinct from the
 * correct answer. "Visually distinct" = different number of notes OR very
 * different rhythmic structure (different durations on most beats).
 * This avoids confusing an 8-year-old with near-identical patterns.
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} correctBeats
 * @param {number} [count=2] - Number of distractors to generate
 * @returns {Array<{ durationUnits: number, isRest: boolean }[]>}
 */
export function generateDistractors(correctBeats, count = 2) {
  const totalDuration = correctBeats.reduce(
    (sum, b) => sum + b.durationUnits,
    0
  );
  const correctFp = beatsFingerprint(correctBeats);
  const correctNotes = noteCount(correctBeats);

  const templates = DISTRACTOR_TEMPLATES[totalDuration];
  if (!templates) {
    // Unknown measure length — fall back to simple alternatives
    return fallbackDistractors(correctBeats, totalDuration, count);
  }

  // Expand all templates and filter out those identical to the correct answer
  const candidates = templates
    .map(expandTemplate)
    .filter((t) => beatsFingerprint(t) !== correctFp);

  // Score candidates: prefer those with a different note count from the correct
  // answer, then prefer those different from each other
  const scored = candidates.map((c) => ({
    beats: c,
    fp: beatsFingerprint(c),
    noteDiff: Math.abs(noteCount(c) - correctNotes),
  }));

  // Sort: biggest note-count difference first (most visually distinct)
  scored.sort((a, b) => b.noteDiff - a.noteDiff);

  const distractors = [];
  const usedFps = new Set([correctFp]);

  for (const candidate of scored) {
    if (distractors.length >= count) break;
    if (usedFps.has(candidate.fp)) continue;
    usedFps.add(candidate.fp);
    distractors.push(candidate.beats);
  }

  // If we still need more (unlikely), fill with remaining candidates
  for (const candidate of scored) {
    if (distractors.length >= count) break;
    if (usedFps.has(candidate.fp)) continue;
    usedFps.add(candidate.fp);
    distractors.push(candidate.beats);
  }

  // Last resort: generate simple patterns
  while (distractors.length < count) {
    const fb = fallbackDistractors(correctBeats, totalDuration, 1);
    distractors.push(fb[0]);
  }

  return distractors;
}

/**
 * Fallback distractor generation for unsupported measure lengths.
 * Creates simple even-subdivision patterns.
 */
function fallbackDistractors(correctBeats, totalDuration, count) {
  const results = [];
  // Pattern 1: all quarter notes
  const quarterCount = Math.floor(totalDuration / 4);
  const remainder = totalDuration - quarterCount * 4;
  const allQuarters = Array.from({ length: quarterCount }, () => ({
    durationUnits: 4,
    isRest: false,
  }));
  if (remainder > 0) {
    allQuarters.push({ durationUnits: remainder, isRest: false });
  }
  results.push(allQuarters);

  if (count > 1) {
    // Pattern 2: one long note
    results.push([{ durationUnits: totalDuration, isRest: false }]);
  }

  return results.slice(0, count);
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
export function schedulePatternPlayback(
  beats,
  tempo,
  audioContext,
  playNote,
  explicitStartTime
) {
  const beatDuration = 60 / tempo; // seconds per quarter note
  const sixteenthDuration = beatDuration / 4; // seconds per sixteenth note
  const startTime = explicitStartTime ?? audioContext.currentTime + 0.1;
  let offset = 0;

  beats.forEach((beat) => {
    if (!beat.isRest) {
      playNote("C4", {
        startTime: startTime + offset,
        duration: sixteenthDuration * beat.durationUnits * 0.95, // tiny gap between notes
      });
    }
    offset += sixteenthDuration * beat.durationUnits;
  });

  return { startTime, totalDuration: offset };
}
