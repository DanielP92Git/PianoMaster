import { useCallback, useRef, useEffect, useMemo } from "react";

const RHYTHM_DEBUG = import.meta.env.DEV;

/**
 * Hook for rhythm playback with proper timing and duration
 * Schedules notes to play at their correct rhythmic positions
 */
export function useRhythmPlayback({ audioEngine, tempo: _tempo }) {
  const scheduledNotesRef = useRef([]);
  const playbackTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const onBeatCallbackRef = useRef(null);
  const onCompleteCallbackRef = useRef(null);

  /**
   * Stop all currently playing/scheduled notes
   */
  const stop = useCallback(() => {
    // Clear timer
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    // Stop all scheduled oscillators
    scheduledNotesRef.current.forEach(({ oscillator, gainNode }) => {
      try {
        if (oscillator && oscillator.stop) {
          gainNode.gain.cancelScheduledValues(audioEngine.getCurrentTime());
          oscillator.stop();
        }
      } catch (error) {
        // Oscillator might already be stopped
        console.warn("Error stopping oscillator:", error);
      }
    });

    scheduledNotesRef.current = [];
    startTimeRef.current = null;
  }, [audioEngine]);

  /**
   * Play a pattern with correct rhythm timing.
   * @param {Array} pattern - Array of notation objects with timing info
   * @param {Function} onBeatChange - Visual-highlight callback (index). An index of -1 means
   *   "no note is currently sounding" — it fires during the 100ms scheduling lead-in, during
   *   rests, and in any leading gap before the first note. It is NOT an end-of-pattern signal.
   * @param {Function} [onComplete] - The ONLY end-of-pattern signal. Fires exactly once, after the
   *   last note's end + 0.5s, just before the final highlight-clear. Use this (never onBeatChange(-1))
   *   to chain a following pass.
   * @returns {boolean} true if playback started; false if it bailed (empty pattern / no audio
   *   context) — in which case onComplete never fires, so callers chaining passes must handle false.
   */
  const play = useCallback(
    (pattern, onBeatChange, onComplete) => {
      if (!pattern || pattern.length === 0) {
        console.warn("No pattern to play");
        return false;
      }

      // Stop any existing playback
      stop();

      // Store callbacks (after stop(), which does not read them)
      onBeatCallbackRef.current = onBeatChange;
      onCompleteCallbackRef.current = onComplete;

      const context = audioEngine.audioContextRef?.current;
      const masterGain = audioEngine.gainNodeRef?.current;

      if (!context || !masterGain) {
        console.error("Audio context not available");
        return false;
      }

      // Get start time (with small buffer for scheduling)
      const startTime = context.currentTime + 0.1;
      startTimeRef.current = startTime;

      // Schedule each note in the pattern
      pattern.forEach((notationObj, index) => {
        const {
          type,
          startTime: noteStartTime,
          endTime,
          frequency,
        } = notationObj;

        // Only play notes, not rests
        if (type === "note" && frequency) {
          const absoluteStartTime = startTime + noteStartTime;
          const absoluteEndTime = startTime + endTime;

          // Create oscillator for this note
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.frequency.setValueAtTime(frequency, absoluteStartTime);
          oscillator.type = "sine";

          // Envelope: quick attack, sustain, then decay
          gainNode.gain.setValueAtTime(0, absoluteStartTime);
          gainNode.gain.linearRampToValueAtTime(0.3, absoluteStartTime + 0.01); // Attack
          gainNode.gain.setValueAtTime(0.25, absoluteStartTime + 0.02); // Sustain

          // Decay based on note duration
          const decayStart = Math.max(
            absoluteStartTime + 0.02,
            absoluteEndTime - 0.1
          );
          gainNode.gain.setValueAtTime(0.25, decayStart);
          gainNode.gain.exponentialRampToValueAtTime(0.01, absoluteEndTime);

          // Connect nodes
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);

          // Schedule start and stop
          oscillator.start(absoluteStartTime);
          oscillator.stop(absoluteEndTime);

          // Store reference
          scheduledNotesRef.current.push({
            oscillator,
            gainNode,
            index,
            startTime: absoluteStartTime,
            endTime: absoluteEndTime,
          });

          // Clean up when done
          oscillator.onended = () => {
            const idx = scheduledNotesRef.current.findIndex(
              (n) => n.oscillator === oscillator
            );
            if (idx !== -1) {
              scheduledNotesRef.current.splice(idx, 1);
            }
          };
        }
      });

      // Set up timer to track current position for visual highlighting
      playbackTimerRef.current = setInterval(() => {
        if (!startTimeRef.current || !onBeatCallbackRef.current) return;

        const currentTime = context.currentTime;
        const elapsedTime = currentTime - startTimeRef.current;

        // Find which notation object should be highlighted
        let currentIndex = -1;
        for (let i = 0; i < pattern.length; i++) {
          const obj = pattern[i];
          if (elapsedTime >= obj.startTime && elapsedTime < obj.endTime) {
            currentIndex = i;
            break;
          } else if (elapsedTime >= obj.endTime && i < pattern.length - 1) {
            // Check if we're between notes
            const nextObj = pattern[i + 1];
            if (elapsedTime < nextObj.startTime) {
              currentIndex = i; // Keep highlighting previous note
              break;
            }
          }
        }

        // Update visual highlighting
        if (onBeatCallbackRef.current) {
          if (RHYTHM_DEBUG) {
            console.debug("[RhythmPlayback]", {
              currentIndex,
              elapsedTime,
              audioCurrentTime: currentTime,
            });
          }
          onBeatCallbackRef.current(currentIndex);
        }

        // Stop timer when pattern is complete. Use max endTime, not the last element's:
        // buildPlayedRendition shifts each note by its own timeDiff, so array order doesn't
        // guarantee monotonic end times (comparisonPattern.js:23-30).
        const patternEndTime = pattern.reduce(
          (max, o) => Math.max(max, o.endTime),
          0
        );
        if (elapsedTime > patternEndTime + 0.5) {
          // Capture and null the completion callback BEFORE stop()/invoke: onComplete may
          // synchronously call play() again (pass chaining), which installs a fresh
          // onCompleteCallbackRef we must not clobber or re-fire.
          const done = onCompleteCallbackRef.current;
          onCompleteCallbackRef.current = null;
          stop();
          if (onBeatCallbackRef.current) {
            onBeatCallbackRef.current(-1); // Clear highlighting — NOT an end-of-pattern signal
          }
          if (done) done();
        }
      }, 50); // Update every 50ms for smooth visual feedback

      return true;
    },
    [audioEngine, stop]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Memoized so `rhythmPlayback` keeps a stable identity across renders (play/stop
  // are useCallback-stable). Without this the fresh object literal churned every
  // render and cascaded through callbacks that depend on it, defeating downstream
  // React.memo (e.g. the keyboard re-rendered on every game render). PERF-4.
  return useMemo(() => ({ play, stop }), [play, stop]);
}
