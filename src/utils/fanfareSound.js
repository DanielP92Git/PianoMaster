/**
 * Fanfare Sound Utility
 *
 * Web Audio API-based fanfare synthesis for boss unlock celebrations.
 * Plays a triumphant C5 -> E5 -> G5 -> C6 major arpeggio over ~1.5 seconds.
 *
 * Design considerations:
 * - Child-friendly volume (max gain 0.3) — not startling for 8-year-olds
 * - Singleton AudioContext to avoid "too many AudioContexts" browser error
 * - Graceful degradation: silently fails if Web Audio API is unavailable
 * - Must be called from user gesture context (click handler) for autoplay policy
 * - Safari support via webkitAudioContext fallback
 */

// Singleton AudioContext instance
let _audioContext = null;

/**
 * Creates or returns a singleton AudioContext.
 * Must be called from a user gesture context (click/tap handler) to satisfy
 * browser autoplay policies.
 *
 * @returns {AudioContext|null} The AudioContext instance, or null if unsupported
 */
export const createFanfareContext = () => {
  try {
    if (_audioContext) {
      // Resume if suspended (happens after browser auto-suspends idle contexts)
      if (_audioContext.state === 'suspended') {
        _audioContext.resume().catch(() => {
          // Silently ignore resume failures
        });
      }
      return _audioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser');
      return null;
    }

    _audioContext = new AudioContextClass();
    return _audioContext;
  } catch (error) {
    console.warn('Failed to create AudioContext:', error);
    return null;
  }
};

/**
 * Plays a triumphant fanfare arpeggio: C5 -> E5 -> G5 -> C6.
 *
 * Uses two slightly detuned oscillators (triangle + square) for a rich,
 * brass-like tone. Each note has a sharp attack and moderate decay envelope.
 *
 * @param {AudioContext} [audioContext] - Optional AudioContext. Creates one if not provided.
 * @returns {Promise<void>} Resolves when playback completes (~1.5 seconds)
 */
export const playFanfare = (audioContext) => {
  return new Promise((resolve) => {
    try {
      const ctx = audioContext || createFanfareContext();
      if (!ctx) {
        resolve();
        return;
      }

      // Resume context if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Fanfare notes: C5 -> E5 -> G5 -> C6 (major arpeggio)
      const notes = [
        { freq: 523.25, start: 0, duration: 0.30 },      // C5
        { freq: 659.25, start: 0.25, duration: 0.30 },    // E5
        { freq: 783.99, start: 0.50, duration: 0.30 },    // G5
        { freq: 1046.50, start: 0.75, duration: 0.40 },   // C6 (held longer for resolution)
      ];

      notes.forEach(({ freq, start, duration }) => {
        // Oscillator 1: Triangle waveform (mellow brass-like tone)
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now + start);

        // Oscillator 2: Square waveform at 1.01x frequency (adds harmonics/richness)
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(freq * 1.01, now + start);

        // Gain envelope for this note pair
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now + start);

        // Attack: 0 -> 0.3 in 30ms (sharp)
        gainNode.gain.linearRampToValueAtTime(0.3, now + start + 0.03);
        // Decay: 0.3 -> 0.15 in 100ms
        gainNode.gain.linearRampToValueAtTime(0.15, now + start + 0.13);
        // Release: 0.15 -> 0 in 100ms at end of note
        gainNode.gain.setValueAtTime(0.15, now + start + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + start + duration);

        // Connect audio graph: oscillators -> gain -> destination
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Start and stop oscillators
        osc1.start(now + start);
        osc2.start(now + start);
        osc1.stop(now + start + duration);
        osc2.stop(now + start + duration);
      });

      // Resolve after all notes have finished playing
      const totalDuration = 0.75 + 0.40; // Last note start + last note duration
      setTimeout(() => {
        resolve();
      }, totalDuration * 1000 + 100); // Small buffer for audio completion

    } catch (error) {
      // Audio is enhancement, not critical — silently fail
      console.warn('Fanfare playback failed:', error);
      resolve();
    }
  });
};
