/**
 * Convert BPM and shortest note duration into mic input timing parameters.
 *
 * Produces dynamic onFrames/offMs/changeFrames/minInterOnMs values that scale
 * with the current tempo and note granularity, rather than fixed preset values.
 *
 * @param {number} bpm - Tempo in beats per minute (expected range: 60–200)
 * @param {string} [shortestNoteDuration='q'] - VexFlow duration code:
 *   'w' (whole), 'h' (half), 'q' (quarter), '8' (eighth), '16' (sixteenth)
 * @returns {{ onFrames: number, offMs: number, changeFrames: number, minInterOnMs: number }}
 *
 * @example
 * // 120 BPM, eighth notes → beatMs=500, noteMs=250
 * calcMicTimingFromBpm(120, '8')
 * // => { onFrames: 2, offMs: 50, changeFrames: 3, minInterOnMs: 63 }
 */
export function calcMicTimingFromBpm(bpm, shortestNoteDuration = 'q') {
  const beatMs = 60000 / bpm;

  const durationMultipliers = {
    w: 4,
    h: 2,
    q: 1,
    '8': 0.5,
    '16': 0.25,
  };
  const multiplier = durationMultipliers[shortestNoteDuration] ?? 1;
  const noteMs = beatMs * multiplier;

  // ~60fps → 1 frame ≈ 16.7ms
  const FRAME_MS = 16.7;

  const onFrames = Math.max(2, Math.round(noteMs * 0.15 / FRAME_MS));
  // Scale offMs aggressively at high BPM: at 120 BPM 8th notes (250ms),
  // offMs=100 (40%) means 162ms min gap between same-pitch detections (65% of note).
  // Use 0.2 multiplier → offMs=50 → min gap ~112ms (45% of note), allowing faster re-detection.
  const offMs = Math.max(40, Math.round(noteMs * 0.2));
  const changeFrames = Math.max(3, onFrames + 1);
  const minInterOnMs = Math.max(40, Math.round(noteMs * 0.25));

  return { onFrames, offMs, changeFrames, minInterOnMs };
}

export const MIC_INPUT_PRESETS = {
  // Sight reading prioritizes precision + timing; keep tolerances tighter.
  sightReading: {
    // Laptop mics + acoustic pianos often decay under 0.015 quickly, causing missed notes.
    // 0.010 keeps detection alive for soft/decaying notes without being overly noise-sensitive.
    rmsThreshold: 0.01,
    tolerance: 0.02,
    // Lower stability requirement to reduce perceived latency in performance mode.
    onFrames: 4,
    changeFrames: 5,
    offMs: 140,
    minInterOnMs: 80,
  },

  // Notes recognition can be slightly more forgiving (especially for soft playing).
  notesRecognition: {
    rmsThreshold: 0.012,
    tolerance: 0.03,
    onFrames: 4,
    changeFrames: 5,
    offMs: 160,
    minInterOnMs: 90,
  },
};


