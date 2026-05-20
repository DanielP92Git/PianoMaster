/**
 * meterUtils.js
 *
 * Shared compound-meter timing helpers for the MixedLessonGame rhythm
 * renderers (RhythmTapQuestion, RhythmReadingQuestion, PulseQuestion).
 *
 * Renderer convention (differs from MetronomeTrainer):
 *   - `beatDur` = 60 / tempo = the duration of ONE QUARTER NOTE in seconds.
 *   - Rhythm pattern binary arrays are indexed in SIXTEENTH-note slots, so an
 *     onset at array index `i` plays at `startTime + i * beatDur / 4`.
 *
 * For 6/8 (compound duple) the metronome must pulse on EIGHTH notes — 6 per
 * measure, two groups of three — with strong accents on positions 1 and 4.
 * For simple meters every value below collapses to the previous behaviour, so
 * these helpers are exact no-ops for 4/4, 3/4 and 2/4.
 *
 * Time signature objects come from RhythmPatternGenerator.js TIME_SIGNATURES.
 */

/**
 * Derive metronome/measure timing for a time signature.
 *
 * @param {object} timeSignature - A TIME_SIGNATURES entry.
 * @param {number} beatDur - Duration of one quarter note in seconds (60/tempo).
 * @returns {{ displayCount: number, isCompound: boolean,
 *   subdivisionDur: number, measureDur: number, strongBeats: number[] }}
 */
export function getMeterTiming(timeSignature, beatDur) {
  const isCompound = !!timeSignature.isCompound;
  // 6/8 displays 6 eighth-note circles; simple meters display one per beat.
  const displayCount = timeSignature.subdivisions ?? timeSignature.beats;
  // 6/8 pulses on eighth notes (beatDur/2); simple meters pulse on the beat.
  const subdivisionDur = isCompound ? beatDur / 2 : beatDur;
  // measureLength is in sixteenth-note units; /4 converts to quarter notes.
  const measureDur = (timeSignature.measureLength / 4) * beatDur;
  const strongBeats = timeSignature.strongBeats ?? [0];

  return { displayCount, isCompound, subdivisionDur, measureDur, strongBeats };
}

/**
 * Is the given subdivision index an accented (strong) metronome position?
 * Used for metronome click scheduling and visual accent.
 *
 * For 6/8: strongBeats [0, 3] → subdivisions 1 and 4 (1-indexed) are accented.
 * For simple meters: strongBeats [0] → only the downbeat.
 *
 * @param {number} subdivisionIndex - 0-indexed running subdivision counter.
 * @param {object} timeSignature - A TIME_SIGNATURES entry.
 * @returns {boolean}
 */
export function isStrongSubdivision(subdivisionIndex, timeSignature) {
  const displayCount = timeSignature.subdivisions ?? timeSignature.beats;
  const strongBeats = timeSignature.strongBeats ?? [0];
  const pos = ((subdivisionIndex % displayCount) + displayCount) % displayCount;
  return strongBeats.includes(pos);
}

/**
 * Is a rhythm-pattern onset at sixteenth-slot `index` on a strong beat?
 * Used to accent played-back pattern notes.
 *
 * strongBeats are expressed in subdivision positions: for 6/8 they are eighth
 * positions (2 sixteenth slots each), for simple meters they are quarter-note
 * positions (4 sixteenth slots each).
 *
 * @param {number} index - Sixteenth-slot index into a pattern binary array.
 * @param {object} timeSignature - A TIME_SIGNATURES entry.
 * @returns {boolean}
 */
export function isStrongOnset(index, timeSignature) {
  const isCompound = !!timeSignature.isCompound;
  const len = timeSignature.measureLength;
  const slot = ((index % len) + len) % len;
  const strongBeats = timeSignature.strongBeats ?? [0];
  const slotsPerUnit = isCompound ? 2 : 4; // eighth = 2 sixteenths, quarter = 4
  return strongBeats.some((sb) => sb * slotsPerUnit === slot);
}
