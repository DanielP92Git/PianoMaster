import { useState, useCallback, useEffect, useRef } from "react";
import { PitchDetector } from "pitchy";

// ---------------------------------------------------------------------------
// Performance instrumentation flag (zero overhead when marks unavailable)
// ---------------------------------------------------------------------------

/**
 * True when the Performance Marks API is available (all modern browsers).
 * Gated here so the detect loop never pays a property-lookup cost in envs
 * where `performance` is undefined (e.g. some Jest/Node setups).
 */
const __PERF_MARKS =
  typeof performance !== "undefined" &&
  typeof performance.mark === "function";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum McLeod clarity score required to emit a pitch detection (ALGO-02). */
export const PITCH_CLARITY_THRESHOLD = 0.9;

/** Chromatic note names (index 0 = C). */
export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** MIDI note number for B1 (lowest accepted note — covers full bass clef range). */
const MIN_MIDI = 35; // B1

/** MIDI note number for C6 (highest accepted note). */
const MAX_MIDI = 84; // C6

// ---------------------------------------------------------------------------
// Pure helper: frequency → note name via MIDI math (ALGO-03)
// ---------------------------------------------------------------------------

/**
 * Convert a frequency in Hz to a note name string (e.g. "C4") using MIDI math.
 *
 * Only notes in the range B1 (MIDI 35) to C6 (MIDI 84) are returned.
 * Frequencies outside this range, or invalid inputs, return null.
 *
 * @param {number} hz - Frequency in Hz
 * @returns {string|null} Note name (e.g. "C4", "F#3") or null
 */
export function frequencyToNote(hz) {
  if (!hz || hz <= 0) return null;
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  if (midi < MIN_MIDI || midi > MAX_MIDI) return null;
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook for real-time pitch detection using microphone input.
 *
 * Uses the McLeod Pitch Method via the pitchy library for accurate pitch
 * detection with clarity-based noise gating. Supports two operating modes:
 *
 * **Mode A — Shared analyser (ARCH-02):**
 * When an analyserNode is supplied (either as a hook prop or as a
 * call-time override on startListening), no new AudioContext is created.
 * The hook uses the provided node directly and does NOT close it on stop.
 *
 * **Mode B — Self-created (fallback / backward compat):**
 * When no analyserNode is available, the hook requests mic access and
 * creates its own AudioContext + AnalyserNode, mirroring the legacy
 * behaviour so existing tests continue to pass.
 *
 * @param {Object} [options]
 * @param {boolean} [options.isActive=false] - Auto-start when true
 * @param {Function} [options.onPitchDetected=null] - (note, frequency) => void
 * @param {Function} [options.onLevelChange=null] - (level) => void
 * @param {Object}  [options.noteFrequencies] - Legacy param (ignored by pitchy path)
 * @param {number}  [options.rmsThreshold=0.01] - Legacy param (kept for compat)
 * @param {number}  [options.tolerance=0.05] - Legacy param (kept for compat)
 * @param {AnalyserNode|null} [options.analyserNode=null] - Shared analyser (ARCH-02)
 * @param {number|null} [options.sampleRate=null] - Sample rate of shared analyser
 * @param {number} [options.clarityThreshold=PITCH_CLARITY_THRESHOLD] - Min clarity
 *
 * @returns {Object} Pitch detection state and controls
 */
export function usePitchDetection({
  isActive = false,
  onPitchDetected = null,
  onLevelChange = null,
  // Legacy params kept for backward compat — ignored by pitchy path
  noteFrequencies: _noteFrequencies,
  rmsThreshold = 0.01,
  tolerance: _tolerance = 0.05,
  // NEW: shared analyser from AudioContextProvider (ARCH-02)
  analyserNode = null,
  sampleRate = null,
  clarityThreshold = PITCH_CLARITY_THRESHOLD,
} = {}) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState(null);
  const [detectedFrequency, setDetectedFrequency] = useState(-1);
  const [audioLevel, setAudioLevel] = useState(0);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const animationFrameRef = useRef(null);
  const stopListeningRef = useRef(null);

  /** pitchy PitchDetector instance — created once per analyser setup. */
  const detectorRef = useRef(null);

  /** Input buffer sized to pitchy's required inputLength. */
  const inputBufferRef = useRef(null);

  /** Tracks whether we are operating in shared-analyser mode. */
  const isSharedModeRef = useRef(false);

  /** Ref to the currently-active analyser (shared or self-created). */
  const currentAnalyserRef = useRef(null);

  /** Ref to the currently-effective sample rate. */
  const currentSampleRateRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Deprecated detectPitch shim (autocorrelation)
  // Kept for backward compat with tests that call result.current.detectPitch().
  // New code should rely on pitchy (called internally in the detect loop).
  // ---------------------------------------------------------------------------
  const detectPitch = useCallback(
    (buffer, sr) => {
      const SIZE = buffer.length;
      const MAX_SAMPLES = Math.floor(SIZE / 2);
      let bestOffset = -1;
      let bestCorrelation = 0;
      let rms = 0;
      let foundGoodCorrelation = false;
      const GOOD_ENOUGH_CORRELATION = 0.9;

      for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
      }
      rms = Math.sqrt(rms / SIZE);

      if (rms < rmsThreshold) return -1;

      let lastCorrelation = 1;
      for (let offset = 1; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;
        for (let i = 0; i < MAX_SAMPLES; i++) {
          correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        correlation = 1 - correlation / MAX_SAMPLES;
        if (
          correlation > GOOD_ENOUGH_CORRELATION &&
          correlation > lastCorrelation
        ) {
          foundGoodCorrelation = true;
          if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
          }
        } else if (foundGoodCorrelation) {
          break;
        }
        lastCorrelation = correlation;
      }

      if (bestCorrelation > 0.01) {
        return sr / bestOffset;
      }
      return -1;
    },
    [rmsThreshold]
  );

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Build pitchy detector and input buffer for a given analyser.
   * Stored in refs to avoid per-frame allocation (PITFALL-1).
   */
  const initDetector = useCallback((node) => {
    detectorRef.current = PitchDetector.forFloat32Array(node.fftSize);
    inputBufferRef.current = new Float32Array(detectorRef.current.inputLength);
  }, []);

  // ---------------------------------------------------------------------------
  // startListening
  // ---------------------------------------------------------------------------

  /**
   * Start pitch detection.
   *
   * Accepts optional call-time overrides so callers can pass a freshly-created
   * analyser after mic permission is granted:
   *
   * ```js
   * const { analyser, audioContext: ctx } = await requestMic();
   * await startListening({ analyserNode: analyser, sampleRate: ctx.sampleRate });
   * ```
   *
   * Call-time args take priority over hook-level props.
   *
   * @param {Object} [overrides]
   * @param {AnalyserNode|null} [overrides.analyserNode]
   * @param {number|null} [overrides.sampleRate]
   */
  const startListening = useCallback(
    async (overrides = {}) => {
      const {
        analyserNode: callTimeAnalyser = null,
        sampleRate: callTimeSampleRate = null,
      } = overrides;

      // Resolve effective analyser: call-time arg > hook prop > null (fallback)
      const effectiveAnalyser = callTimeAnalyser || analyserNode;
      const effectiveSampleRate = callTimeSampleRate || sampleRate;

      try {
        if (effectiveAnalyser) {
          // ---------------------------------------------------------------
          // MODE A: shared analyserNode — no new AudioContext
          // ---------------------------------------------------------------
          isSharedModeRef.current = true;
          currentAnalyserRef.current = effectiveAnalyser;
          currentSampleRateRef.current =
            effectiveSampleRate || effectiveAnalyser.context?.sampleRate || 44100;

          initDetector(effectiveAnalyser);
          setAnalyser(effectiveAnalyser);
          setIsListening(true);
        } else {
          // ---------------------------------------------------------------
          // MODE B: self-created AudioContext (fallback / backward compat)
          // ---------------------------------------------------------------
          isSharedModeRef.current = false;

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });

          const context = new (window.AudioContext || window.webkitAudioContext)();
          const source = context.createMediaStreamSource(stream);
          const analyserNode_self = context.createAnalyser();

          analyserNode_self.fftSize = 4096;
          analyserNode_self.smoothingTimeConstant = 0.0;

          source.connect(analyserNode_self);

          currentAnalyserRef.current = analyserNode_self;
          currentSampleRateRef.current = context.sampleRate;

          initDetector(analyserNode_self);

          setAudioContext(context);
          setAnalyser(analyserNode_self);
          setMicrophone(stream);
          setIsListening(true);
        }

        // ---------------------------------------------------------------
        // Detection loop (shared by both modes)
        // ---------------------------------------------------------------
        const currentAnalyser = currentAnalyserRef.current;
        const currentSampleRate = currentSampleRateRef.current;

        const detectLoop = () => {
          if (!currentAnalyser || !detectorRef.current || !inputBufferRef.current)
            return;

          // Full fftSize buffer (pitchy requires this, not frequencyBinCount)
          if (__PERF_MARKS) performance.mark("getAudioData-start");
          currentAnalyser.getFloatTimeDomainData(inputBufferRef.current);
          if (__PERF_MARKS) performance.mark("getAudioData-end");
          if (__PERF_MARKS)
            performance.measure("getAudioData", "getAudioData-start", "getAudioData-end");

          // RMS audio level
          let sum = 0;
          const len = inputBufferRef.current.length;
          for (let i = 0; i < len; i++) {
            sum += inputBufferRef.current[i] * inputBufferRef.current[i];
          }
          const level = Math.sqrt(sum / len);
          setAudioLevel(level);
          if (onLevelChange) onLevelChange(level);

          // McLeod Pitch Method via pitchy (ALGO-01)
          if (__PERF_MARKS) performance.mark("findPitch-start");
          const [pitch, clarity] = detectorRef.current.findPitch(
            inputBufferRef.current,
            currentSampleRate
          );
          if (__PERF_MARKS) performance.mark("findPitch-end");
          if (__PERF_MARKS)
            performance.measure("findPitch", "findPitch-start", "findPitch-end");

          // ALGO-02: clarity gate — reject weak/ambiguous detections
          if (clarity >= clarityThreshold && pitch > 0) {
            const note = frequencyToNote(pitch);
            setDetectedFrequency(pitch);
            setDetectedNote(note);
            if (onPitchDetected && note) {
              onPitchDetected(note, pitch);
            }
          } else {
            setDetectedFrequency(-1);
            setDetectedNote(null);
          }

          animationFrameRef.current = requestAnimationFrame(detectLoop);
        };

        detectLoop();
      } catch (error) {
        console.error("Error starting pitch detection:", error);
        setIsListening(false);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyserNode, sampleRate, clarityThreshold, initDetector, onLevelChange, onPitchDetected]
  );

  // ---------------------------------------------------------------------------
  // stopListening
  // ---------------------------------------------------------------------------

  const stopListening = useCallback(() => {
    // Cancel detection loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isSharedModeRef.current) {
      // Shared mode: do NOT close audioContext or stop stream — provider owns those
      isSharedModeRef.current = false;
    } else {
      // Fallback mode: full cleanup
      if (microphone) {
        try {
          microphone.getTracks().forEach((track) => {
            if (track.readyState !== "ended") {
              track.stop();
            }
          });
        } catch (err) {
          console.warn("Error stopping microphone tracks:", err);
        }
      }

      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch((err) => {
          if (err.name !== "InvalidStateError") {
            console.warn("Error closing audio context:", err);
          }
        });
      }
    }

    // Reset all state
    currentAnalyserRef.current = null;
    currentSampleRateRef.current = null;
    detectorRef.current = null;
    inputBufferRef.current = null;

    setIsListening(false);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
    setDetectedNote(null);
    setDetectedFrequency(-1);
    setAudioLevel(0);
  }, [microphone, audioContext]);

  // Store stopListening in ref for cleanup effects
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  // Handle isActive prop changes (only for automatic mode)
  useEffect(() => {
    if (isActive && !isListening) {
      startListening().catch((err) => {
        console.error("Failed to start listening:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setTimeout(() => {
        if (stopListeningRef.current) {
          stopListeningRef.current();
        }
      }, 0);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    detectedNote,
    detectedFrequency,
    audioLevel,
    isListening,

    // Controls
    startListening, // async (overrides?: { analyserNode?, sampleRate? }) => void
    stopListening,

    // Advanced / backward compat
    audioContext,
    analyser: currentAnalyserRef.current || analyser,
    detectPitch, // Deprecated — kept for backward compat with tests
    frequencyToNote, // MIDI-math version exported for external use
  };
}
