import { useCallback } from "react";

/**
 * Shared audio prewarm hook. Composes useAudioEngine internals to guarantee
 * the audio pipeline is fully ready before scheduling playback.
 *
 * Sequence (matches PulseQuestion.startFlow lines 548-573, the proven good pattern):
 *   1. await resumeAudioContext()        — ensure ctx.state === "running"
 *   2. await loadPianoSound()            — ensure pianoSoundBufferRef populated
 *      (RESEARCH §4 fix candidate (a): blocking await prevents synth-fallback
 *      race that was causing first-play trim and dictation Listen race)
 *   3. Warmup oscillator (silent gain, 10ms) — primes WebAudio output buffer
 *   4. Return audioEngine.isReady() boolean
 *
 * Per Phase 33 CONTEXT D-13: "shared prewarm hook" used at every renderer mount
 * that reproduces an audio race. Per D-16: do NOT proactively roll this out to
 * every renderer — only those with confirmed UAT failures.
 *
 * @param {object} audioEngine - useAudioEngine() return value
 * @param {Function} [getOrCreateAudioContext] - fallback to recover from interrupted state (iOS)
 * @returns {() => Promise<boolean>} ensureReady — call before scheduling playback;
 *   resolves to true when audio pipeline ready
 */
export function useEnsureAudioReady(audioEngine, getOrCreateAudioContext) {
  return useCallback(async () => {
    try {
      await audioEngine.resumeAudioContext();
      if (typeof audioEngine.loadPianoSound === "function") {
        await audioEngine.loadPianoSound();
      }
    } catch {
      // Audio context may be interrupted (iOS) — try recovery
      if (typeof getOrCreateAudioContext === "function") {
        try {
          getOrCreateAudioContext();
        } catch {
          /* swallow — isReady check below catches failure */
        }
      }
    }

    // Warmup oscillator (silent gain, 10ms) — primes the WebAudio output buffer.
    // Copied from PulseQuestion.startFlow (PulseQuestion.jsx:560-573).
    const ctx = audioEngine.audioContextRef?.current;
    if (ctx) {
      try {
        const warmup = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0, ctx.currentTime);
        warmup.connect(silentGain);
        silentGain.connect(ctx.destination);
        warmup.start(ctx.currentTime);
        warmup.stop(ctx.currentTime + 0.01);
      } catch {
        // Non-critical — first tick may still be quiet
      }
    }

    return typeof audioEngine.isReady === "function"
      ? audioEngine.isReady()
      : !!ctx;
  }, [audioEngine, getOrCreateAudioContext]);
}
