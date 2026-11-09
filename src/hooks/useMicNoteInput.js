import { useCallback, useRef } from "react";
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
const FSM = { IDLE: "IDLE", ARMED: "ARMED", ACTIVE: "ACTIVE" };

/** Frequency (Hz) → fractional MIDI number; 1.0 = one semitone = 100 cents. */
function frequencyToMidiFloat(hz) {
  return 12 * Math.log2(hz / 440) + 69;
}

/**
 * Drift gate: consecutive off-pitch frames tolerated before a candidate is
 * restarted. Real piano input has isolated bad frames (hammer attack, an
 * octave error from a strong 2nd harmonic); a glide produces a run of them.
 */
const DRIFT_OUTLIER_LIMIT = 2;

/** Pitch samples kept per candidate (~0.5s at 60Hz) for the drift range. */
const MAX_CANDIDATE_SAMPLES = 32;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Start a fresh candidate at the current frame (mutates FSM state `s`). */
function startCandidate(s, note, midi, now) {
  s.candidateNote = note;
  s.candidateFrames = 1;
  s.candidateStartedAt = now;
  s.candidateMidis = [midi];
  s.candidateOutliers = [];
}

/** Drop the candidate entirely (no candidate in progress). */
function clearCandidate(s) {
  s.candidateNote = null;
  s.candidateFrames = 0;
  s.candidateStartedAt = -Infinity;
  s.candidateMidis = [];
  s.candidateOutliers = [];
  s.heldRun = 0;
}

/**
 * Restart the candidate after a run of outliers. If the run is a steady pitch
 * that is either a different note name (a genuine note change) or at least
 * as much evidence as the candidate it replaces (the candidate began on a
 * bad attack frame), keep it as the new candidate's first frames so the note
 * isn't delayed. Otherwise (a glide, or a vibrato swing on a well-established
 * candidate) start over from the last frame.
 */
function restartFromOutliers(s, maxCentsDrift) {
  const run = s.candidateOutliers;
  const last = run[run.length - 1];
  const center = median(run.map((o) => o.midi));
  const keepRun =
    (last.note !== s.candidateNote || run.length >= s.candidateMidis.length) &&
    run.every(
      (o) =>
        o.note === last.note && Math.abs(o.midi - center) * 100 <= maxCentsDrift
    );
  if (!keepRun) {
    startCandidate(s, last.note, last.midi, last.at);
    return;
  }
  s.candidateNote = last.note;
  s.candidateFrames = run.length;
  s.candidateStartedAt = run[0].at;
  s.candidateMidis = run.map((o) => o.midi);
  s.candidateOutliers = [];
}

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
  rmsThreshold = 0.01,
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
  /**
   * Max pitch range (cents) across a candidate's frames. A piano string holds
   * a fixed pitch; speech/humming glides, so it keeps leaving this window and
   * the candidate restarts after a run of more than DRIFT_OUTLIER_LIMIT
   * off-pitch frames (isolated bad frames are skipped, not fatal). Gated by
   * pitch rather than note name, so an out-of-tune piano (~50 cents off,
   * flickering between two names) still confirms. null = disabled (legacy).
   */
  maxCentsDrift = null,
  /**
   * Optional (note) => ms. When set, a candidate must also stay stable for at
   * least this long before noteOn is emitted. Time-based, so it behaves the
   * same at 60Hz and 120Hz. Lets callers demand more evidence for some notes
   * (e.g. wrong answers that cost a life). null = disabled.
   */
  getMinStableMs = null,
} = {}) {
  const stateRef = useRef({
    // FSM
    fsmState: FSM.IDLE,
    // Candidate tracking (used in ARMED and during note-change in ACTIVE)
    candidateNote: null,
    candidateFrames: 0,
    candidateStartedAt: -Infinity,
    // Drift gate: in-window fractional-MIDI samples + pending off-pitch run
    candidateMidis: [],
    candidateOutliers: [],
    // ACTIVE: consecutive held-note frames since the change candidate's last frame
    heldRun: 0,
    driftRestarts: 0,
    // Currently held note (set when ACTIVE) and its median pitch
    currentNote: null,
    currentMidi: null,
    // Timing bookkeeping
    lastPitchAt: -Infinity,
    prevPitchAt: -Infinity,
    lastEmitAt: -Infinity,
    lastFrequency: -1,
    lastAudioLevel: 0,
  });

  const resetInternalState = useCallback((_reason) => {
    const s = stateRef.current;
    s.fsmState = FSM.IDLE;
    s.currentNote = null;
    s.currentMidi = null;
    clearCandidate(s);
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
  // Candidate helpers (drift gate + per-note stable time)
  // ---------------------------------------------------------------------------

  /**
   * Feed one detected frame into the candidate. Returns true when the frame
   * extended a candidate (so the caller should check readiness), false when
   * it started a new one or was held back as a possible outlier.
   *
   * Legacy (maxCentsDrift null): same note name extends, a different one
   * restarts. Drift-gated: a frame that keeps the candidate's pitch range
   * within maxCentsDrift extends it whatever its note name; an off-pitch
   * frame is held back, and only a run longer than DRIFT_OUTLIER_LIMIT
   * restarts.
   */
  const feedCandidate = useCallback(
    (s, note, midi, now) => {
      if (s.candidateNote == null) {
        startCandidate(s, note, midi, now);
        return false;
      }

      if (maxCentsDrift == null) {
        if (note !== s.candidateNote) {
          startCandidate(s, note, midi, now);
          return false;
        }
        s.candidateFrames += 1;
        return true;
      }

      const lo = Math.min(midi, ...s.candidateMidis);
      const hi = Math.max(midi, ...s.candidateMidis);
      if ((hi - lo) * 100 <= maxCentsDrift) {
        s.candidateOutliers = [];
        s.candidateMidis.push(midi);
        if (s.candidateMidis.length > MAX_CANDIDATE_SAMPLES) {
          s.candidateMidis.shift();
        }
        s.candidateFrames += 1;
        return true;
      }

      s.candidateOutliers.push({ note, midi, at: now });
      if (s.candidateOutliers.length <= DRIFT_OUTLIER_LIMIT) return false;
      restartFromOutliers(s, maxCentsDrift);
      s.driftRestarts += 1;
      return true;
    },
    [maxCentsDrift]
  );

  /** True when a frame belongs to the note already held in ACTIVE. */
  const isHeldNote = useCallback(
    (s, note, midi) => {
      if (note === s.currentNote) return true;
      return (
        maxCentsDrift != null &&
        s.currentMidi != null &&
        Math.abs(midi - s.currentMidi) * 100 <= maxCentsDrift
      );
    },
    [maxCentsDrift]
  );

  /** True when the candidate has met every gate required to emit noteOn. */
  const isCandidateReady = useCallback(
    (s, note, now, requiredFrames) => {
      if (s.candidateFrames < requiredFrames) return false;
      if (now - s.lastEmitAt < minInterOnMs) return false;
      if (typeof getMinStableMs === "function") {
        const minMs = getMinStableMs(note) || 0;
        if (now - s.candidateStartedAt < minMs) return false;
      }
      return true;
    },
    [getMinStableMs, minInterOnMs]
  );

  // ---------------------------------------------------------------------------
  // FSM transitions — called on every pitch detection frame
  // ---------------------------------------------------------------------------

  const handlePitchDetected = useCallback(
    (note, frequency) => {
      const now = performance.now();
      const s = stateRef.current;
      const midi = frequencyToMidiFloat(frequency);

      // Update timing bookkeeping
      s.prevPitchAt = s.lastPitchAt;
      s.lastPitchAt = now;
      s.lastFrequency = frequency;

      if (s.fsmState === FSM.IDLE) {
        // -----------------------------------------------------------------------
        // IDLE: no note held, no candidate — first pitch detected → arm it
        // -----------------------------------------------------------------------
        s.fsmState = FSM.ARMED;
        startCandidate(s, note, midi, now);
      } else if (s.fsmState === FSM.ARMED) {
        // -----------------------------------------------------------------------
        // ARMED: accumulating onset confidence for a candidate note
        // -----------------------------------------------------------------------
        if (!feedCandidate(s, note, midi, now)) return;

        // Emit the candidate's name, not this frame's: with the drift gate an
        // in-tune frame may round to the neighbouring name.
        const candidate = s.candidateNote;
        if (isCandidateReady(s, candidate, now, onFrames)) {
          // Threshold met → emit noteOn, transition to ACTIVE
          const latencyMs = Number.isFinite(s.candidateStartedAt)
            ? Math.round(now - s.candidateStartedAt)
            : null;
          s.fsmState = FSM.ACTIVE;
          s.currentNote = candidate;
          s.currentMidi = median(s.candidateMidis);
          s.lastEmitAt = now;
          emit({
            pitch: candidate,
            source: "mic",
            type: "noteOn",
            time: now,
            frequency,
            audioLevel: s.lastAudioLevel,
            latencyMs,
          });
        }
      } else if (s.fsmState === FSM.ACTIVE) {
        // -----------------------------------------------------------------------
        // ACTIVE: note is currently held
        // -----------------------------------------------------------------------
        if (isHeldNote(s, note, midi)) {
          // Same note sustaining. With the drift gate, a run of these drops
          // any pending change candidate, so sporadic octave-error frames
          // can't add up into a phantom noteOn over a long sustain.
          if (maxCentsDrift != null && s.candidateNote != null) {
            s.heldRun += 1;
            if (s.heldRun > DRIFT_OUTLIER_LIMIT) clearCandidate(s);
          }
          return;
        }
        s.heldRun = 0;

        // Different note — track as candidate for note-change
        if (!feedCandidate(s, note, midi, now)) return;

        const candidate = s.candidateNote;
        if (isCandidateReady(s, candidate, now, changeFrames)) {
          const latencyMs = Number.isFinite(s.candidateStartedAt)
            ? Math.round(now - s.candidateStartedAt)
            : null;
          const prev = s.currentNote;
          s.currentNote = candidate;
          s.currentMidi = median(s.candidateMidis);
          s.lastEmitAt = now;
          // Stay ACTIVE with new note
          clearCandidate(s);

          emit({
            pitch: prev,
            source: "mic",
            type: "noteOff",
            time: now,
            frequency: s.lastFrequency,
            audioLevel: s.lastAudioLevel,
          });
          emit({
            pitch: candidate,
            source: "mic",
            type: "noteOn",
            time: now,
            frequency,
            audioLevel: s.lastAudioLevel,
            latencyMs,
          });
        }
      }
    },
    [
      changeFrames,
      emit,
      feedCandidate,
      isCandidateReady,
      isHeldNote,
      maxCentsDrift,
      onFrames,
    ]
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
        s.currentMidi = null;
        clearCandidate(s);
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
        clearCandidate(s);
        // No emission needed (noteOn was never sent)
      }
    },
    [emit, offMs]
  );

  const { isListening, startListening, stopListening, subscribe } =
    usePitchDetection({
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
  const startListeningWrapped = useCallback(
    async (overrides = {}) => {
      resetInternalState("startListening");
      await startListening(overrides);
    },
    [resetInternalState, startListening]
  );

  const stopListeningWrapped = useCallback(() => {
    stopListening();
    resetInternalState("stopListening");
  }, [resetInternalState, stopListening]);

  // Live FSM debug snapshot. Stable callback (reads the internal stateRef on
  // demand) so the dev mic-debug panel can poll it from its own subscription
  // without the hook re-rendering the whole game. Detected note/frequency/level
  // come from the pitch `subscribe` stream (PERF-1).
  const getDebug = useCallback(() => {
    const s = stateRef.current;
    const center = s.candidateMidis.length ? median(s.candidateMidis) : null;
    return {
      fsmState: s.fsmState,
      currentNote: s.currentNote,
      candidateNote: s.candidateNote,
      candidateFrames: s.candidateFrames,
      // Widest in-window sample distance from the candidate's median pitch
      candidateDriftCents:
        center == null
          ? null
          : Math.round(
              Math.max(...s.candidateMidis.map((m) => Math.abs(m - center))) *
                100
            ),
      candidateOutliers: s.candidateOutliers.length,
      driftRestarts: s.driftRestarts,
      candidateStableMs: Number.isFinite(s.candidateStartedAt)
        ? Math.round(performance.now() - s.candidateStartedAt)
        : null,
      lastPitchAt: s.lastPitchAt,
      lastEmitAt: s.lastEmitAt,
      lastFrequency: s.lastFrequency,
      lastAudioLevel: s.lastAudioLevel,
    };
  }, []);

  return {
    isListening,
    startListening: startListeningWrapped,
    stopListening: stopListeningWrapped,
    // Real-time subscription (PERF-1): cb => ({ level, note, frequency })
    subscribe,
    getDebug,
  };
}
