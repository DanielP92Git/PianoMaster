import { useRef, useCallback } from "react";

export function useMetronome({ audioEngine, tempo, timeSignature }) {
  const intervalRef = useRef(null);
  const scheduledOscillatorsRef = useRef([]);
  const onBeatCallbackRef = useRef(null);
  const onCompleteCallbackRef = useRef(null);

  const createMetronomeSound = useCallback(
    (time, frequency, volume) => {
      if (
        !audioEngine.audioContextRef?.current ||
        !audioEngine.gainNodeRef?.current
      ) {
        return;
      }

      try {
        const context = audioEngine.audioContextRef.current;
        const masterGain = audioEngine.gainNodeRef.current;

        const oscillator = context.createOscillator();
        const clickGain = context.createGain();

        oscillator.frequency.setValueAtTime(frequency, time);
        oscillator.type = "sine";

        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(volume, time + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);

        oscillator.connect(clickGain);
        clickGain.connect(masterGain);

        oscillator.start(time);
        oscillator.stop(time + 0.02);

        scheduledOscillatorsRef.current.push(oscillator);
      } catch (error) {
        console.error("Error creating metronome sound:", error);
      }
    },
    [audioEngine]
  );

  const start = useCallback(
    (onBeat, onComplete) => {
      console.log("=== METRONOME START CALLED - NEW CODE VERSION ===");

      // Check if audio engine is ready
      if (
        !audioEngine.isInitialized ||
        !audioEngine.audioContextRef?.current ||
        !audioEngine.gainNodeRef?.current
      ) {
        console.error("❌ Audio engine not ready! State:", {
          isInitialized: audioEngine.isInitialized,
          audioSupported: audioEngine.audioSupported,
          hasContext: !!audioEngine.audioContextRef?.current,
          hasGainNode: !!audioEngine.gainNodeRef?.current,
        });
        return;
      }

      console.log("✅ Audio engine is ready");

      // Store callbacks in refs to avoid closure issues
      onBeatCallbackRef.current = onBeat;
      onCompleteCallbackRef.current = onComplete;

      // Clear any existing interval first
      if (intervalRef.current) {
        console.log("Clearing existing interval:", intervalRef.current);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const beatDuration = (60 / tempo) * 1000;
      const beatsPerMeasure = timeSignature.beats;

      console.log(
        `Metronome config: ${beatsPerMeasure} beats at ${tempo} BPM (${beatDuration}ms per beat)`
      );

      // WORKAROUND: Use shorter interval and track elapsed time instead
      // This avoids whatever is blocking longer intervals
      const startTime = Date.now();
      const shortInterval = 100; // Check every 100ms
      let lastBeatTime = 0;
      let beat = 0;

      console.log("Starting fast-polling metronome with 100ms interval");

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const expectedBeat = Math.floor(elapsed / beatDuration);

        // Fire beat if we've crossed a beat boundary
        if (expectedBeat > beat && beat < beatsPerMeasure) {
          console.log(`✓ Beat ${beat + 1} fired at ${elapsed}ms`);

          const isDownbeat = beat % beatsPerMeasure === 0;
          const frequency = isDownbeat ? 900 : 700;
          const volume = isDownbeat ? 0.15 : 0.1;

          // Create sound
          if (
            audioEngine.audioContextRef?.current &&
            audioEngine.gainNodeRef?.current
          ) {
            try {
              const context = audioEngine.audioContextRef.current;
              const masterGain = audioEngine.gainNodeRef.current;
              const currentTime = context.currentTime;

              const oscillator = context.createOscillator();
              const clickGain = context.createGain();

              oscillator.frequency.setValueAtTime(frequency, currentTime);
              oscillator.type = "sine";

              clickGain.gain.setValueAtTime(0, currentTime);
              clickGain.gain.linearRampToValueAtTime(
                volume,
                currentTime + 0.001
              );
              clickGain.gain.exponentialRampToValueAtTime(
                0.01,
                currentTime + 0.02
              );

              oscillator.connect(clickGain);
              clickGain.connect(masterGain);

              oscillator.start(currentTime);
              oscillator.stop(currentTime + 0.02);

              scheduledOscillatorsRef.current.push(oscillator);
            } catch (soundError) {
              console.error("Sound creation error:", soundError);
            }
          }

          // Call beat callback
          if (onBeatCallbackRef.current) {
            onBeatCallbackRef.current(beat + 1);
          }

          beat++;

          // Check completion
          if (beat >= beatsPerMeasure && onCompleteCallbackRef.current) {
            console.log("Count-in complete! Calling onComplete");
            clearInterval(intervalRef.current);
            intervalRef.current = null;

            setTimeout(() => {
              if (onCompleteCallbackRef.current) {
                onCompleteCallbackRef.current();
              }
            }, 100);
          }
        }
      }, shortInterval);

      console.log(`Fast-polling interval set with ID: ${intervalRef.current}`);
    },
    [tempo, timeSignature, audioEngine]
  );

  const stop = useCallback(() => {
    console.log(
      "🛑 STOP called on metronome, clearing interval:",
      intervalRef.current
    );
    console.trace("Stop was called from:");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    scheduledOscillatorsRef.current = [];
  }, []);

  return { start, stop };
}
