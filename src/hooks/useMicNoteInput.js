import { useCallback, useMemo, useRef } from "react";
import { usePitchDetection } from "./usePitchDetection";

// #region agent log (debug-mode instrumentation)
// Network logging is disabled by default. Enable by setting
// VITE_DEBUG_MIC_LOGS="true" in your Vite env and running the local
// collector on 127.0.0.1:7242.
const __MIC_LOG_ENDPOINT =
  "http://127.0.0.1:7242/ingest/636d1c48-b2ea-491c-896a-7ce448793071";
const __MIC_LOG_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_DEBUG_MIC_LOGS === "true";
const __micLog = (payload) => {
  if (!__MIC_LOG_ENABLED) return;
  fetch(__MIC_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
};
// #endregion

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
    // debug-only counters / throttling
    __dbgFrames: 0,
    __dbgLastLogAt: -Infinity,
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
    s.__dbgFrames = 0;
    s.__dbgLastLogAt = -Infinity;
    // #region agent log
    __micLog({
      sessionId: "debug-session",
      runId: "mic-reset-pre",
      hypothesisId: "Hmic",
      location: "src/hooks/useMicNoteInput.js:resetInternalState",
      message: "mic.stateReset",
      data: { reason: reason ?? null },
      timestamp: Date.now(),
    });
    // #endregion
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
      // #region agent log
      // Throttle: log roughly every ~250ms while pitches are flowing.
      s.__dbgFrames += 1;
      if (now - s.__dbgLastLogAt >= 250) {
        s.__dbgLastLogAt = now;
        __micLog({
          sessionId: "debug-session",
          runId: "mic-latency-pre",
          hypothesisId: "Hmic",
          location: "src/hooks/useMicNoteInput.js:handlePitchDetected",
          message: "mic.pitchFrame",
          data: {
            mappedNote: note,
            frequency,
            frameDeltaMs:
              Number.isFinite(prevPitchAt) && prevPitchAt > 0
                ? Math.round(now - prevPitchAt)
                : null,
            audioLevel: s.lastAudioLevel,
            currentNote: s.currentNote,
            candidateNote: s.candidateNote,
            candidateFrames: s.candidateFrames,
            candidateAgeMs: Number.isFinite(s.candidateStartedAt)
              ? Math.round(now - s.candidateStartedAt)
              : null,
            onFrames,
            changeFrames,
            minInterOnMs,
          },
          timestamp: Date.now(),
        });
      }
      // #endregion

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
          // #region agent log
          __micLog({
            sessionId: "debug-session",
            runId: "mic-latency-pre",
            hypothesisId: "Hmic",
            location: "src/hooks/useMicNoteInput.js:handlePitchDetected",
            message: "mic.emit.noteOn",
            data: {
              pitch: note,
              frequency,
              audioLevel: s.lastAudioLevel,
              candidateFrames: s.candidateFrames,
              candidateAgeMs: latencyMs,
              onFrames,
              minInterOnMs,
              perfNow: now,
            },
            timestamp: Date.now(),
          });
          // #endregion
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
  });

  const startListeningWrapped = useCallback(async () => {
    resetInternalState("startListening");
    await startListening();
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
