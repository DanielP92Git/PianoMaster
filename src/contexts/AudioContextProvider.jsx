import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

/**
 * AudioContextProvider
 *
 * Provides a single shared AudioContext + AnalyserNode across all game
 * components. One context per game route mount — avoids Safari's 4-context
 * limit and ensures consistent DSP chain configuration.
 *
 * Architecture decisions (Phase 07):
 * - AUDIO-01: getUserMedia disables echoCancellation, noiseSuppression,
 *   autoGainControl so raw signal reaches the pitch detector
 * - AUDIO-02: smoothingTimeConstant = 0.0 (no frame averaging)
 * - AUDIO-03: fftSize = 4096 (2048 analysis bins, ~10.8 Hz resolution at 44.1 kHz)
 * - ARCH-05: suspend/resume instead of close/create between exercises
 * - visibilitychange: suspend when hidden, resume when visible
 *   (iOS-specific recovery built on top in Phase 09)
 */

const AudioCtx = createContext(null);

export function AudioContextProvider({ children }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null); // Store to prevent GC

  const [isReady, setIsReady] = useState(false);
  const [micPermission, setMicPermission] = useState("prompt"); // 'prompt' | 'granted' | 'denied'

  /**
   * Get or create the shared AudioContext.
   * If it already exists and isn't closed, resume it if suspended and return it.
   * Never creates a second context while one is alive.
   */
  const getOrCreateAudioContext = useCallback(() => {
    const existing = audioContextRef.current;
    if (existing && existing.state !== "closed") {
      if (existing.state === "suspended") {
        existing.resume().catch((err) =>
          console.warn("[AudioContextProvider] resume() failed:", err)
        );
      }
      return existing;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;
    return ctx;
  }, []);

  /**
   * Request microphone access and set up the audio chain:
   *   MediaStreamSource → AnalyserNode
   *
   * Safe to call multiple times — if already ready, returns existing refs.
   * Returns { audioContext, analyser } for immediate use by the caller.
   */
  const requestMic = useCallback(async () => {
    // If already set up, return existing chain
    if (isReady && analyserRef.current && audioContextRef.current) {
      return {
        audioContext: audioContextRef.current,
        analyser: analyserRef.current,
      };
    }

    try {
      // AUDIO-01: Disable all browser DSP to receive raw signal
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const ctx = getOrCreateAudioContext();

      // Build the audio chain
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();

      // AUDIO-02: No frame averaging — see each frame as-is for accurate pitch
      analyser.smoothingTimeConstant = 0.0;

      // AUDIO-03: 4096 bins = ~10.8 Hz resolution at 44.1 kHz; adequate for piano
      analyser.fftSize = 4096;

      source.connect(analyser);

      sourceRef.current = source;
      analyserRef.current = analyser;

      setMicPermission("granted");
      setIsReady(true);

      return { audioContext: ctx, analyser };
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setMicPermission("denied");
      }
      throw err;
    }
  }, [isReady, getOrCreateAudioContext]);

  /**
   * Release the microphone stream and tear down the audio chain nodes.
   * Does NOT close the AudioContext — that happens only on unmount.
   * After releaseMic(), requestMic() can be called again.
   */
  const releaseMic = useCallback(() => {
    // Stop all tracks to turn off the mic indicator light
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect nodes to free resources (analyser is still in the graph)
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      sourceRef.current = null;
    }

    analyserRef.current = null;
    setIsReady(false);
  }, []);

  /**
   * ARCH-05: Suspend the AudioContext (saves CPU/battery).
   * Used when going to background or between exercises.
   */
  const suspendAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === "running") {
      ctx.suspend().catch((err) =>
        console.warn("[AudioContextProvider] suspend() failed:", err)
      );
    }
  }, []);

  /**
   * ARCH-05: Resume the AudioContext.
   * Used when returning to foreground or starting a new exercise.
   */
  const resumeAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) =>
        console.warn("[AudioContextProvider] resume() failed:", err)
      );
    }
  }, []);

  /**
   * Suspend audio when the tab/app goes to background, resume when it returns.
   * Phase 09 will add iOS-specific interruption recovery on top of this.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        suspendAudio();
      } else {
        resumeAudio();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [suspendAudio, resumeAudio]);

  /**
   * Cleanup on unmount: release mic, then close the AudioContext.
   * This fires when navigating away from a game route.
   */
  useEffect(() => {
    return () => {
      releaseMic();

      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch((err) =>
          console.warn("[AudioContextProvider] close() failed:", err)
        );
      }
      audioContextRef.current = null;
    };
  }, [releaseMic]);

  const value = {
    audioContextRef,
    analyserRef,
    isReady,
    micPermission,
    requestMic,
    releaseMic,
    suspendAudio,
    resumeAudio,
    getOrCreateAudioContext,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

/**
 * Hook to consume the AudioContextProvider value.
 * Must be used inside an AudioContextProvider.
 */
export function useAudioContext() {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    throw new Error(
      "useAudioContext must be used inside AudioContextProvider"
    );
  }
  return ctx;
}

export default AudioContextProvider;
