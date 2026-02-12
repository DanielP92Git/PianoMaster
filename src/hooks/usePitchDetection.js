import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Default note frequency mappings
 * Includes both Hebrew note names (for note recognition games)
 * and English note names (for sight reading game)
 */
const DEFAULT_NOTE_FREQUENCIES = {
  // Hebrew notes with multiple octaves
  דו: [261.63, 523.25, 1046.5, 2093.0], // C4, C5, C6, C7
  רה: [293.66, 587.33, 1174.66, 2349.32], // D4, D5, D6, D7
  מי: [329.63, 659.25, 1318.51, 2637.02], // E4, E5, E6, E7
  פה: [349.23, 698.46, 1396.91, 2793.83], // F4, F5, F6, F7
  סול: [392.0, 783.99, 1567.98, 3135.96], // G4, G5, G6, G7
  לה: [440.0, 880.0, 1760.0, 3520.0], // A4, A5, A6, A7
  סי: [493.88, 987.77, 1975.53, 3951.07], // B4, B5, B6, B7

  // English notes (single octave values for sight reading)
  A3: 220.0,
  B3: 246.94,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
};

/**
 * Custom hook for real-time pitch detection using microphone input
 *
 * Provides autocorrelation-based pitch detection with configurable parameters.
 * Handles microphone permissions, Web Audio API setup, and proper cleanup.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.isActive=false] - Enable/disable detection automatically
 * @param {Function} [options.onPitchDetected=null] - Callback when pitch detected: (note, frequency) => {}
 * @param {Function} [options.onLevelChange=null] - Callback when audio level changes: (level) => {}
 * @param {Object} [options.noteFrequencies=DEFAULT_NOTE_FREQUENCIES] - Custom frequency mappings
 * @param {number} [options.rmsThreshold=0.01] - Minimum signal threshold (0-1)
 * @param {number} [options.tolerance=0.05] - Note matching tolerance (0-1, where 0.05 = 5%)
 *
 * @returns {Object} Pitch detection state and controls
 * @returns {string|null} detectedNote - Current detected note name or null
 * @returns {number} detectedFrequency - Detected frequency in Hz or -1
 * @returns {number} audioLevel - Audio input level (0-1)
 * @returns {boolean} isListening - Whether microphone is active
 * @returns {Function} startListening - Async function to start microphone: async () => Promise<void>
 * @returns {Function} stopListening - Function to stop microphone and cleanup: () => void
 * @returns {AudioContext|null} audioContext - Web Audio API context (for advanced usage)
 * @returns {AnalyserNode|null} analyser - Web Audio API analyser node (for advanced usage)
 * @returns {Function} detectPitch - Manual pitch detection: (buffer, sampleRate) => frequency
 * @returns {Function} frequencyToNote - Manual frequency conversion: (frequency) => noteName
 *
 * @example
 * // Basic usage with automatic activation
 * const { detectedNote, isListening, startListening } = usePitchDetection({
 *   isActive: true,
 * });
 *
 * @example
 * // Manual control with custom frequencies
 * const { detectedNote, startListening, stopListening } = usePitchDetection({
 *   noteFrequencies: { 'C4': 261.63, 'D4': 293.66 },
 *   rmsThreshold: 0.02,
 *   tolerance: 0.03
 * });
 *
 * // Later, manually start/stop
 * await startListening();
 * // ... do something ...
 * stopListening();
 */
export function usePitchDetection({
  isActive = false,
  onPitchDetected = null,
  onLevelChange = null,
  noteFrequencies = DEFAULT_NOTE_FREQUENCIES,
  rmsThreshold = 0.01,
  tolerance = 0.05,
} = {}) {
  // State
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState(null);
  const [detectedFrequency, setDetectedFrequency] = useState(-1);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for cleanup and animation frame
  const animationFrameRef = useRef(null);
  const stopListeningRef = useRef(null);

  /**
   * Detect pitch using autocorrelation algorithm
   *
   * @param {Float32Array} buffer - Audio buffer from analyser
   * @param {number} sampleRate - Audio context sample rate
   * @returns {number} Detected frequency in Hz, or -1 if no pitch detected
   */
  const detectPitch = useCallback(
    (buffer, sampleRate) => {
      const SIZE = buffer.length;
      const MAX_SAMPLES = Math.floor(SIZE / 2);
      let bestOffset = -1;
      let bestCorrelation = 0;
      let rms = 0;
      let foundGoodCorrelation = false;
      const GOOD_ENOUGH_CORRELATION = 0.9;

      // Calculate RMS (Root Mean Square) for signal strength
      for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
      }
      rms = Math.sqrt(rms / SIZE);

      // Not enough signal - return early
      if (rms < rmsThreshold) return -1;

      // Autocorrelation loop to find pitch
      let lastCorrelation = 1;
      for (let offset = 1; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        // Calculate correlation at this offset
        for (let i = 0; i < MAX_SAMPLES; i++) {
          correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        correlation = 1 - correlation / MAX_SAMPLES;

        // Check if this is a good correlation peak
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
          // Found the peak, stop searching
          break;
        }
        lastCorrelation = correlation;
      }

      // Convert offset to frequency
      if (bestCorrelation > 0.01) {
        return sampleRate / bestOffset;
      }
      return -1;
    },
    [rmsThreshold]
  );

  /**
   * Convert frequency to note name using provided frequency mappings
   *
   * @param {number} frequency - Frequency in Hz
   * @returns {string|null} Note name or null if no match found
   */
  const frequencyToNote = useCallback(
    (frequency) => {
      if (frequency <= 0) return null;

      let closestNote = null;
      let minDifference = Infinity;

      // Search through all note frequencies
      Object.entries(noteFrequencies).forEach(([note, frequencies]) => {
        // Handle both array format (Hebrew notes) and single value format (English notes)
        const freqArray = Array.isArray(frequencies)
          ? frequencies
          : [frequencies];

        freqArray.forEach((freq) => {
          const difference = Math.abs(frequency - freq);
          const toleranceValue = freq * tolerance;

          if (difference < toleranceValue && difference < minDifference) {
            minDifference = difference;
            closestNote = note;
          }
        });
      });

      return closestNote;
    },
    [noteFrequencies, tolerance]
  );

  /**
   * Start listening to microphone input and begin pitch detection
   *
   * @throws {Error} If microphone permission denied or not available
   */
  const startListening = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create Web Audio API context
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      // Configure analyser
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;

      // Connect nodes
      source.connect(analyserNode);

      // Update state
      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(stream);
      setIsListening(true);

      // Start pitch detection loop
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      const sampleRate = context.sampleRate;

      const detectLoop = () => {
        if (!analyserNode) return;

        // Get audio data
        analyserNode.getFloatTimeDomainData(dataArray);

        // Calculate audio level (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const level = Math.sqrt(sum / bufferLength);
        setAudioLevel(level);

        // Call level change callback if provided
        if (onLevelChange) {
          onLevelChange(level);
        }

        // Detect pitch
        const pitch = detectPitch(dataArray, sampleRate);
        const note = frequencyToNote(pitch);

        setDetectedFrequency(pitch);
        setDetectedNote(note);

        // Call pitch detected callback if provided and note detected
        if (onPitchDetected && note) {
          onPitchDetected(note, pitch);
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      };

      // Start detection loop
      detectLoop();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsListening(false);
      throw error;
    }
  }, [detectPitch, frequencyToNote, onPitchDetected, onLevelChange]);

  /**
   * Stop listening to microphone and clean up all resources
   * Made idempotent to avoid errors on repeated calls
   */
  const stopListening = useCallback(() => {

    // Cancel animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop microphone tracks safely
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

    // Close audio context only if not already closed
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch((err) => {
        // Silently ignore if already closed
        if (err.name !== "InvalidStateError") {
          console.warn("Error closing audio context:", err);
        }
      });
    }

    // Reset state
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
    // Note: In manual control mode (isActive=false), this effect doesn't interfere
  }, [isActive, isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Defer cleanup to not block navigation
      setTimeout(() => {
        if (stopListeningRef.current) {
          stopListeningRef.current();
        }
      }, 0);
    };
  }, []);

  return {
    // State
    detectedNote,
    detectedFrequency,
    audioLevel,
    isListening,

    // Methods
    startListening,
    stopListening,

    // Advanced (for custom detection logic)
    audioContext,
    analyser,
    detectPitch,
    frequencyToNote,
  };
}
