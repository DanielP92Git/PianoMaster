import { useCallback, useMemo, useRef } from "react";
import { usePitchDetection } from "./usePitchDetection";

// ---------------------------------------------------------------------------
// FSM state enum
// ---------------------------------------------------------------------------

/**
 * Formal state machine states for note onset/sustain/silence tracking.
 *
 * IDLE   — no pitch detected, no note held.
 * ARMED  — a candidate note is accumulating onset confidence (frames counted).
 * ACTIVE — a note is currently held (noteOn emitted, waiting for noteOff or change).
 */
const FSM = { IDLE: 'IDLE', ARMED: 'ARMED', ACTIVE: 'ACTIVE' };

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
 *
 * Internal state is managed by a formal IDLE/ARMED/ACTIVE FSM instead of
 * ad-hoc candidateFrames counting.
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
    // FSM
    fsmState: FSM.IDLE,
    // Candidate tracking (used in ARMED and during note-change in ACTIVE)
    candidateNote: null,
    candidateFrames: 0,
    candidateStartedAt: -Infinity,
    // Currently held note (set when ACTIVE)
    currentNote: null,
    // Timing bookkeeping
    lastPitchAt: -Infinity,
    prevPitchAt: -Infinity,
    lastEmitAt: -Infinity,
    lastFrequency: -1,
    lastAudioLevel: 0,
  });

  const resetInternalState = useCallback((reason) => {
    const s = stateRef.current;
    s.fsmState = FSM.IDLE;
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

  // ---------------------------------------------------------------------------
  // FSM transitions — called on every pitch detection frame
  // ---------------------------------------------------------------------------

  const handlePitchDetected = useCallback(
    (note, frequency) => {
      const now = performance.now();
      const s = stateRef.current;

      // Update timing bookkeeping
      s.prevPitchAt = s.lastPitchAt;
      s.lastPitchAt = now;
      s.lastFrequency = frequency;

      if (s.fsmState === FSM.IDLE) {
        // -----------------------------------------------------------------------
        // IDLE: no note held, no candidate — first pitch detected → arm it
        // -----------------------------------------------------------------------
        s.fsmState = FSM.ARMED;
        s.candidateNote = note;
        s.candidateFrames = 1;
        s.candidateStartedAt = now;

      } else if (s.fsmState === FSM.ARMED) {
        // -----------------------------------------------------------------------
        // ARMED: accumulating onset confidence for a candidate note
        // -----------------------------------------------------------------------
        if (note === s.candidateNote) {
          s.candidateFrames += 1;

          if (
            s.candidateFrames >= onFrames &&
            now - s.lastEmitAt >= minInterOnMs
          ) {
            // Threshold met → emit noteOn, transition to ACTIVE
            const latencyMs = Number.isFinite(s.candidateStartedAt)
              ? Math.round(now - s.candidateStartedAt)
              : null;
            s.fsmState = FSM.ACTIVE;
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
        } else {
          // Different note detected → reset candidate (stay ARMED)
          s.candidateNote = note;
          s.candidateFrames = 1;
          s.candidateStartedAt = now;
        }

      } else if (s.fsmState === FSM.ACTIVE) {
        // -----------------------------------------------------------------------
        // ACTIVE: note is currently held
        // -----------------------------------------------------------------------
        if (note === s.currentNote) {
          // Same note sustaining — do nothing
          return;
        }

        // Different note — track as candidate for note-change
        if (s.candidateNote === note) {
          s.candidateFrames += 1;

          if (
            s.candidateFrames >= changeFrames &&
            now - s.lastEmitAt >= minInterOnMs
          ) {
            const latencyMs = Number.isFinite(s.candidateStartedAt)
              ? Math.round(now - s.candidateStartedAt)
              : null;
            const prev = s.currentNote;
            s.currentNote = note;
            s.lastEmitAt = now;
            // Stay ACTIVE with new note
            s.candidateNote = null;
            s.candidateFrames = 0;
            s.candidateStartedAt = -Infinity;

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
        } else {
          // New different note — reset candidate tracking (stay ACTIVE)
          s.candidateNote = note;
          s.candidateFrames = 1;
          s.candidateStartedAt = now;
        }
      }
    },
    [changeFrames, emit, minInterOnMs, onFrames]
  );

  // ---------------------------------------------------------------------------
  // Silence detection — called every audio frame via onLevelChange
  // ---------------------------------------------------------------------------

  const handleLevelChange = useCallback(
    (level) => {
      const now = performance.now();
      const s = stateRef.current;
      s.lastAudioLevel = level;

      if (s.fsmState === FSM.ACTIVE && now - s.lastPitchAt >= offMs) {
        // Held note gone silent → emit noteOff, return to IDLE
        const prev = s.currentNote;
        const prevFrequency = s.lastFrequency;
        s.fsmState = FSM.IDLE;
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
      } else if (s.fsmState === FSM.ARMED && now - s.lastPitchAt >= offMs) {
        // Candidate never reached threshold, silence detected → back to IDLE
        s.fsmState = FSM.IDLE;
        s.candidateNote = null;
        s.candidateFrames = 0;
        s.candidateStartedAt = -Infinity;
        // No emission needed (noteOn was never sent)
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
      fsmState: s.fsmState,
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
