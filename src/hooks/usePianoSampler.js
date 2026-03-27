import { useCallback } from 'react';
import { useAudioContext } from '../contexts/AudioContextProvider';

/**
 * Piano note frequency map — 24 chromatic notes, C3 through B4 (D-10).
 * Tuned to A4 = 440 Hz standard.
 */
export const NOTE_FREQS = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
};

/**
 * Convert a note name like "C4" to Hz.
 * Returns 261.63 (C4) for unknown notes as a safe fallback.
 */
export function noteNameToHz(noteId) {
  return NOTE_FREQS[noteId] ?? NOTE_FREQS['C4'];
}

/**
 * usePianoSampler
 *
 * Synthesizes piano-like tones via Web Audio API oscillators (D-11, D-12).
 * Uses the shared AudioContext from AudioContextProvider — never creates its own.
 *
 * @returns {{ playNote: function }} Hook API
 */
export function usePianoSampler() {
  const { audioContextRef } = useAudioContext();

  /**
   * Play a synthesized piano note.
   *
   * @param {string} noteId - Note name, e.g. 'C4', 'A4' (must be in NOTE_FREQS)
   * @param {Object} [options]
   * @param {number} [options.duration=0.5] - Note duration in seconds
   * @param {number} [options.velocity=0.7] - Note velocity/volume (0–1)
   * @param {number|null} [options.startTime=null] - AudioContext time to start (null = now)
   */
  const playNote = useCallback(
    (noteId = 'C4', { duration = 0.5, velocity = 0.7, startTime = null } = {}) => {
      const ctx = audioContextRef.current;

      // Guard: closed or missing context — no crash
      if (!ctx || ctx.state === 'closed') return;

      // iOS safety (IOS-02): resume must be called synchronously from user gesture path
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const freq = noteNameToHz(noteId);
      const when = startTime ?? ctx.currentTime;

      // --- Oscillators ---
      // osc1: fundamental (sine wave at note frequency)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, when);

      // osc2: second harmonic at 2x frequency (40% gain for piano-like timbre)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, when);

      // --- Gain envelope (ADSR) ---
      const gainEnv = ctx.createGain();
      const attackEnd = when + 0.005; // 5ms attack
      const decayEnd = attackEnd + 0.08; // 80ms decay

      gainEnv.gain.setValueAtTime(0, when);
      gainEnv.gain.linearRampToValueAtTime(velocity, attackEnd);
      gainEnv.gain.exponentialRampToValueAtTime(velocity * 0.4, decayEnd);
      // Release: ramp to near-zero at note end
      gainEnv.gain.exponentialRampToValueAtTime(0.001, when + duration);

      // Harmonic gain: second oscillator at 40%
      const harmGain = ctx.createGain();
      harmGain.gain.value = 0.4;

      // --- Routing ---
      // osc1 -> gainEnv -> destination
      // osc2 -> harmGain -> gainEnv
      osc2.connect(harmGain);
      harmGain.connect(gainEnv);
      osc1.connect(gainEnv);
      gainEnv.connect(ctx.destination);

      // --- Schedule ---
      const stopTime = when + duration + 0.01;
      osc1.start(when);
      osc1.stop(stopTime);
      osc2.start(when);
      osc2.stop(stopTime);
    },
    [audioContextRef]
  );

  return { playNote };
}
