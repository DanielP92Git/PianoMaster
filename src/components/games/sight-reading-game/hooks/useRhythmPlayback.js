import { useCallback, useRef, useEffect } from "react";

const RHYTHM_DEBUG = true;

/**
 * Hook for rhythm playback with proper timing and duration
 * Schedules notes to play at their correct rhythmic positions
 */
export function useRhythmPlayback({ audioEngine, tempo }) {
  const scheduledNotesRef = useRef([]);
  const playbackTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const onBeatCallbackRef = useRef(null);

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
   * Play a pattern with correct rhythm timing
   * @param {Array} pattern - Array of notation objects with timing info
   * @param {Function} onBeatChange - Callback for visual highlighting (index)
   */
  const play = useCallback(
    (pattern, onBeatChange) => {
      if (!pattern || pattern.length === 0) {
        console.warn("No pattern to play");
        return;
      }

      // Stop any existing playback
      stop();

      // Store callback
      onBeatCallbackRef.current = onBeatChange;

      const context = audioEngine.audioContextRef?.current;
      const masterGain = audioEngine.gainNodeRef?.current;

      if (!context || !masterGain) {
        console.error("Audio context not available");
        return;
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
          duration,
        } = notationObj;

        // Only play notes, not rests
        if (type === "note" && frequency) {
          const absoluteStartTime = startTime + noteStartTime;
          const absoluteEndTime = startTime + endTime;
          const noteDuration = absoluteEndTime - absoluteStartTime;

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

        // Stop timer when pattern is complete
        const lastNote = pattern[pattern.length - 1];
        if (elapsedTime > lastNote.endTime + 0.5) {
          stop();
          if (onBeatCallbackRef.current) {
            onBeatCallbackRef.current(-1); // Clear highlighting
          }
        }
      }, 50); // Update every 50ms for smooth visual feedback
    },
    [audioEngine, stop]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { play, stop };
}
