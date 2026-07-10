import { useCallback, useMemo, useRef, useState } from "react";

/**
 * useReviewDrill
 *
 * Isolated Review-mistakes state machine (PRAC-04, D-16/D-19/D-22). Filters an exercise's
 * `performanceResults` down to only `missed` + `wrong_pitch` entries (D-19 — early/late are
 * timing nuances, not mistakes worth re-drilling) and steps the learner through them one at a
 * time: play the target pitch, get matched (enharmonic-aware), advance.
 *
 * D-18: this hook NEVER touches combo/on-fire and performs no scoring/persistence (T-02-01) —
 * it is a pure, injectable state machine so it stays testable without useAudioEngine/context.
 *
 * @param {Object} params
 * @param {Array} params.performanceResults - the exercise's recorded note results
 * @param {Array} params.patternNotes - currentPattern.notes (note/rest events with .pitch)
 * @param {Function} [params.playTargetPitch] - optional callback the game supplies, e.g.
 *   `(pitch) => audioEngine.playPianoSound(0.6, pitch)`. Not called internally on mount; exposed
 *   via `playCurrentTarget()` for the panel's "Play it" button and for optional auto-audition.
 */

// Verbatim copy of the enharmonic MIDI-equivalence helper from SightReadingGame.jsx (local, not
// exported there — see __tests__/enharmonicMatching.test.js for the canonical duplication note).
const SEMITONE_MAP = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function noteToMidi(note) {
  if (!note) return null;
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) return null;
  const semi = SEMITONE_MAP[m[1]];
  if (semi === undefined) return null;
  return (parseInt(m[2], 10) + 1) * 12 + semi;
}

export function useReviewDrill({
  performanceResults,
  patternNotes,
  playTargetPitch,
} = {}) {
  const [currentMistakeIndex, setCurrentMistakeIndex] = useState(0);
  const currentMistakeIndexRef = useRef(0);
  const [isComplete, setIsComplete] = useState(false);

  const mistakes = useMemo(() => {
    if (!Array.isArray(performanceResults) || performanceResults.length === 0) {
      return [];
    }
    return performanceResults
      .filter(
        (r) => r.timingStatus === "missed" || r.timingStatus === "wrong_pitch"
      )
      .map((r) => {
        const targetPitch =
          patternNotes?.[r.noteIndex]?.pitch ?? r.expected ?? null;
        return {
          noteIndex: r.noteIndex,
          targetPitch,
          timingStatus: r.timingStatus,
        };
      });
  }, [performanceResults, patternNotes]);

  // Zero mistakes -> idle/complete immediately (drives D-20 "hide the Review button").
  const isIdleEmpty = mistakes.length === 0;

  const currentTarget = useMemo(() => {
    if (isIdleEmpty || isComplete) return null;
    const mistake = mistakes[currentMistakeIndex];
    if (!mistake) return null;
    return {
      noteIndex: mistake.noteIndex,
      pitch: mistake.targetPitch,
      timingStatus: mistake.timingStatus,
    };
  }, [isIdleEmpty, isComplete, mistakes, currentMistakeIndex]);

  const advance = useCallback(() => {
    const nextIndex = currentMistakeIndexRef.current + 1;
    if (nextIndex >= mistakes.length) {
      currentMistakeIndexRef.current = nextIndex;
      setCurrentMistakeIndex(nextIndex);
      setIsComplete(true);
      return;
    }
    currentMistakeIndexRef.current = nextIndex;
    setCurrentMistakeIndex(nextIndex);
  }, [mistakes.length]);

  const handlePitch = useCallback(
    (detectedPitch) => {
      if (isIdleEmpty || isComplete) return;
      const mistake = mistakes[currentMistakeIndexRef.current];
      if (!mistake) return;
      const detectedMidi = noteToMidi(detectedPitch);
      const targetMidi = noteToMidi(mistake.targetPitch);
      if (detectedMidi == null || targetMidi == null) return;
      if (detectedMidi === targetMidi) {
        advance();
      }
    },
    [isIdleEmpty, isComplete, mistakes, advance]
  );

  const skip = useCallback(() => {
    if (isIdleEmpty || isComplete) return;
    advance();
  }, [isIdleEmpty, isComplete, advance]);

  const start = useCallback(() => {
    currentMistakeIndexRef.current = 0;
    setCurrentMistakeIndex(0);
    setIsComplete(isIdleEmpty);
  }, [isIdleEmpty]);

  const reset = useCallback(() => {
    currentMistakeIndexRef.current = 0;
    setCurrentMistakeIndex(0);
    setIsComplete(false);
  }, []);

  const playCurrentTarget = useCallback(() => {
    if (!currentTarget?.pitch || typeof playTargetPitch !== "function") return;
    playTargetPitch(currentTarget.pitch);
  }, [currentTarget, playTargetPitch]);

  return {
    mistakes,
    currentTarget,
    currentMistakeIndex,
    total: mistakes.length,
    isComplete: isIdleEmpty ? true : isComplete,
    isIdleEmpty,
    handlePitch,
    skip,
    start,
    reset,
    playCurrentTarget,
  };
}

export default useReviewDrill;
