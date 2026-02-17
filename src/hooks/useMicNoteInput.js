import { useCallback, useMemo, useRef } from "react";
import { usePitchDetection } from "./usePitchDetection";


/**
 * Mic note event model (JS shape):
 * {
 *   pitch: string,                 // e.g. "C4"
 *   source: "mic",
 *   type: "noteOn" | "noteOff",
 *   time: number,                  // ms (performance.now)
 *   frequency?: number,            // Hz (for mic events)
 *   audioLevel?: number            // 0..1
 * }
 *
 * This hook wraps `usePitchDetection` and adds stability + note-on/off semantics.
 * It emits only stable noteOn events (and noteOff when audio goes silent).
 */
export function useMicNoteInput({
  isActive = false,
  noteFrequencies,
  rmsThreshold = 0.015,
  tolerance = 0.02,
  onNoteEvent,
  /**
   * How many consecutive frames of the same mapped note are required before emitting noteOn.
   * At ~60fps: 5 frames ≈ 80ms.
   */
  onFrames = 5,
  /**
   * How many consecutive frames are required to switch from one note to another while holding.
   * Usually >= onFrames.
   */
  changeFrames = 6,
  /**
   * If no pitch is detected for this long, emit noteOff (if a note is currently held).
   */
  offMs = 140,
  /**
   * Minimal time between noteOn events to prevent rapid re-triggering (ms).
   */
  minInterOnMs = 80,
  /**
   * Shared AnalyserNode from AudioContextProvider (ARCH-03).
   * When provided, usePitchDetection skips getUserMedia and uses this analyser directly.
   * Defaults to null (usePitchDetection creates its own analyser via getUserMedia).
   */
  analyserNode = null,
  /**
   * Sample rate of the shared AudioContext. Required when analyserNode is provided.
   * Defaults to null (usePitchDetection reads sampleRate from its own AudioContext).
   */
  sampleRate = null,
  /**
   * Minimum clarity/confidence threshold for pitch detection (0–1).
   * Forwarded to usePitchDetection for McLeod Pitch Method (pitchy).
   */
  clarityThreshold,
} = {}) {
  const stateRef = useRef({
    currentNote: null,
    candidateNote: null,
    candidateFrames: 0,
    candidateStartedAt: -Infinity,
    lastPitchAt: -Infinity,
    prevPitchAt: -Infinity,
    lastEmitAt: -Infinity,
    lastFrequency: -1,
    lastAudioLevel: 0,
  });

  const resetInternalState = useCallback((reason) => {
    const s = stateRef.current;
    s.currentNote = null;
    s.candidateNote = null;
    s.candidateFrames = 0;
    s.candidateStartedAt = -Infinity;
    s.lastPitchAt = -Infinity;
    s.prevPitchAt = -Infinity;
    s.lastEmitAt = -Infinity;
    s.lastFrequency = -1;
    // keep lastAudioLevel as-is (helps debug)
  }, []);

  const emit = useCallback(
    (event) => {
      if (typeof onNoteEvent === "function") {
        onNoteEvent(event);
      }
    },
    [onNoteEvent]
  );

  const handlePitchDetected = useCallback(
    (note, frequency) => {
      const now = performance.now();
      const s = stateRef.current;
      const prevPitchAt = s.lastPitchAt;
      s.prevPitchAt = prevPitchAt;
      s.lastPitchAt = now;
      s.lastFrequency = frequency;
      // If we're already holding this note, do nothing.
      if (s.currentNote && note === s.currentNote) {
        s.candidateNote = note;
        s.candidateFrames = Math.max(s.candidateFrames, onFrames);
        return;
      }

      // Track candidate stability
      if (note === s.candidateNote) {
        s.candidateFrames += 1;
      } else {
        s.candidateNote = note;
        s.candidateFrames = 1;
        s.candidateStartedAt = now;
      }

      // Emit noteOn for initial note after stability
      if (!s.currentNote) {
        if (
          s.candidateFrames >= onFrames &&
          now - s.lastEmitAt >= minInterOnMs
        ) {
          const latencyMs = Number.isFinite(s.candidateStartedAt)
            ? Math.round(now - s.candidateStartedAt)
            : null;
          s.currentNote = note;
          s.lastEmitAt = now;
          emit({
            pitch: note,
            source: "mic",
            type: "noteOn",
            time: now,
            frequency,
            audioLevel: s.lastAudioLevel,
            latencyMs,
          });
        }
        return;
      }

      // Handle note changes while holding (legato-like)
      if (
        s.currentNote &&
        note !== s.currentNote &&
        s.candidateFrames >= changeFrames &&
        now - s.lastEmitAt >= minInterOnMs
      ) {
        const latencyMs = Number.isFinite(s.candidateStartedAt)
          ? Math.round(now - s.candidateStartedAt)
          : null;
        const prev = s.currentNote;
        s.currentNote = note;
        s.lastEmitAt = now;

        emit({
          pitch: prev,
          source: "mic",
          type: "noteOff",
          time: now,
          frequency: s.lastFrequency,
          audioLevel: s.lastAudioLevel,
        });
        emit({
          pitch: note,
          source: "mic",
          type: "noteOn",
          time: now,
          frequency,
          audioLevel: s.lastAudioLevel,
          latencyMs,
        });
      }
    },
    [changeFrames, emit, minInterOnMs, onFrames]
  );

  const handleLevelChange = useCallback(
    (level) => {
      const now = performance.now();
      const s = stateRef.current;
      s.lastAudioLevel = level;

      // If we haven't detected pitch recently, treat as silence and emit noteOff.
      if (s.currentNote && now - s.lastPitchAt >= offMs) {
        const prev = s.currentNote;
        const prevFrequency = s.lastFrequency;
        s.currentNote = null;
        s.candidateNote = null;
        s.candidateFrames = 0;
        s.candidateStartedAt = -Infinity;
        s.lastFrequency = -1;

        emit({
          pitch: prev,
          source: "mic",
          type: "noteOff",
          time: now,
          frequency: prevFrequency,
          audioLevel: level,
        });
      }
    },
    [emit, offMs]
  );

  const {
    audioLevel,
    isListening,
    startListening,
    stopListening,
    detectedNote,
    detectedFrequency,
  } = usePitchDetection({
    isActive,
    noteFrequencies,
    rmsThreshold,
    tolerance,
    onPitchDetected: handlePitchDetected,
    onLevelChange: handleLevelChange,
    // Pass through shared analyser props (ARCH-03).
    // usePitchDetection ignores these if null (falls back to getUserMedia).
    analyserNode,
    sampleRate,
    clarityThreshold,
  });

  /**
   * Wrapped startListening that resets internal stability state first, then
   * forwards any call-time overrides to usePitchDetection's startListening.
   *
   * Accepts an optional overrides object with { analyserNode, sampleRate } so
   * callers can pass a freshly-obtained analyser at call time (Plan 04 pattern):
   *   const { analyser, audioContext: ctx } = await requestMic();
   *   await startMicListening({ analyserNode: analyser, sampleRate: ctx.sampleRate });
   *
   * Existing callers that pass no arguments are unaffected.
   */
  const startListeningWrapped = useCallback(async (overrides = {}) => {
    resetInternalState("startListening");
    await startListening(overrides);
  }, [resetInternalState, startListening]);

  const stopListeningWrapped = useCallback(() => {
    stopListening();
    resetInternalState("stopListening");
  }, [resetInternalState, stopListening]);

  const debug = useMemo(() => {
    const s = stateRef.current;
    return {
      currentNote: s.currentNote,
      candidateNote: s.candidateNote,
      candidateFrames: s.candidateFrames,
      lastPitchAt: s.lastPitchAt,
      lastEmitAt: s.lastEmitAt,
      lastFrequency: s.lastFrequency,
      lastAudioLevel: s.lastAudioLevel,
      detectedNote,
      detectedFrequency,
    };
  }, [detectedFrequency, detectedNote]);

  return {
    audioLevel,
    isListening,
    startListening: startListeningWrapped,
    stopListening: stopListeningWrapped,
    debug,
  };
}
