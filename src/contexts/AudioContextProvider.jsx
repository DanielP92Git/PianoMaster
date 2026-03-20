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
 *
 * Phase 09 additions:
 * - IOS-01: onstatechange on AudioContext detects 'interrupted' state
 * - IOS-02: handleTapToResume calls ctx.resume() synchronously (no await before)
 * - IOS-03: visibilitychange checks MediaStreamTrack.readyState for dead tracks
 * - isInterrupted state exposed via context for overlay rendering
 * - streamRef exposed via context so game components can check track state
 */

const AudioCtx = createContext(null);

export function AudioContextProvider({ children }) {
  // Eagerly create the AudioContext so useAudioEngine consumers always see a
  // non-null ref on their first render.  Without this, useAudioEngine creates
  // its own context, then switches to the shared one when requestMic() triggers
  // a re-render — closing the owned context mid-playback and stalling timers.
  const audioContextRef = useRef(null);
  if (!audioContextRef.current) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) {
      audioContextRef.current = new Ctor();
    }
  }

  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null); // Store to prevent GC

  const [isReady, setIsReady] = useState(false);
  const [micPermission, setMicPermission] = useState("prompt"); // 'prompt' | 'granted' | 'denied'

  // Phase 09 (IOS-01): Tracks whether AudioContext is in 'interrupted' state.
  // True when iOS Safari interrupts audio (phone call, lock screen, app switch).
  const [isInterrupted, setIsInterrupted] = useState(false);

  /**
   * Wire onstatechange on the eagerly-created AudioContext.
   * Must run in a useEffect (not the ref initializer block) so that
   * setIsInterrupted is in scope as a stable state setter.
   *
   * Phase 09 (IOS-01): 'interrupted' is an iOS Safari-specific AudioContext
   * state triggered by phone calls, Siri, lock screen, etc.
   */
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (ctx) {
      ctx.onstatechange = () => {
        if (ctx.state === "interrupted") {
          setIsInterrupted(true);
        } else if (ctx.state === "running") {
          setIsInterrupted(false);
        }
      };
    }
  }, []); // Mount-only — wires the eagerly-created context

  /**
   * Get or create the shared AudioContext.
   * If it already exists and isn't closed, resume it if suspended/interrupted and return it.
   * Never creates a second context while one is alive.
   */
  const getOrCreateAudioContext = useCallback(() => {
    const existing = audioContextRef.current;
    if (existing && existing.state !== "closed") {
      // Phase 09 (IOS-01): handle both 'suspended' and 'interrupted' states
      if (existing.state === "suspended" || existing.state === "interrupted") {
        existing.resume().catch((err) =>
          console.warn("[AudioContextProvider] resume() failed:", err)
        );
      }
      return existing;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();

    // Phase 09 (IOS-01): Wire state change on newly created contexts too
    ctx.onstatechange = () => {
      if (ctx.state === "interrupted") {
        setIsInterrupted(true);
      } else if (ctx.state === "running") {
        setIsInterrupted(false);
      }
    };

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

      // Connecting a MediaStreamSource can briefly suspend the AudioContext in
      // some browsers. Resume explicitly so scheduled audio timers keep ticking.
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

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
   *
   * Phase 09 (IOS-01): Also handles 'interrupted' state, not just 'suspended'.
   */
  const resumeAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (ctx && (ctx.state === "suspended" || ctx.state === "interrupted")) {
      ctx.resume().catch((err) =>
        console.warn("[AudioContextProvider] resume() failed:", err)
      );
    }
  }, []);

  /**
   * Phase 09 (IOS-02): Tap-to-resume handler for the AudioInterruptedOverlay.
   *
   * CRITICAL: ctx.resume() MUST be called synchronously (no await before it)
   * because iOS Safari requires the resume() call to originate directly from
   * a user-gesture event handler. Any await before resume() breaks this
   * requirement and resume() will silently fail.
   *
   * After resuming, re-acquires the mic if MediaStreamTracks have ended
   * (phone call kills the mic stream even after AudioContext resumes).
   */
  const handleTapToResume = useCallback(
    async () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // IOS-02: resume() MUST fire synchronously — no await before this line
      const resumePromise = ctx.resume();

      try {
        await resumePromise;
      } catch (err) {
        console.warn("[AudioContextProvider] resume() failed on tap:", err);
        throw err; // Let caller handle fallback
      }

      // Re-acquire mic if tracks ended (phone call kills MediaStreamTrack)
      const tracks = streamRef.current?.getTracks() ?? [];
      const needsReacquire =
        tracks.some((t) => t.readyState === "ended") || tracks.length === 0;
      if (needsReacquire && isReady) {
        releaseMic(); // Clean up dead stream
        await requestMic(); // Fresh getUserMedia
      }

      setIsInterrupted(false);
    },
    [isReady, releaseMic, requestMic]
  );

  /**
   * Suspend audio when the tab/app goes to background, resume when it returns.
   *
   * Phase 09 (IOS-03): On foreground return, check MediaStreamTrack liveness.
   * Dead tracks (readyState === 'ended') indicate the mic was killed by iOS
   * during a phone call or lock screen. In this case, show the overlay instead
   * of silently resuming, so the user can tap to re-acquire the mic.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        suspendAudio();
        return;
      }

      // Returning to foreground
      const ctx = audioContextRef.current;
      const tracksLive =
        streamRef.current?.getTracks().every((t) => t.readyState === "live") ??
        false;

      if (ctx?.state === "interrupted" || (streamRef.current && !tracksLive)) {
        // Need user gesture to recover — show the interrupted overlay
        setIsInterrupted(true);
      } else if (ctx?.state === "running" && tracksLive) {
        // Everything alive — silent resume, no overlay
        return;
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
    streamRef,          // Phase 09: exposed for game components to check track state
    isReady,
    isInterrupted,      // Phase 09 (IOS-01): true when AudioContext is in 'interrupted' state
    micPermission,
    requestMic,
    releaseMic,
    suspendAudio,
    resumeAudio,
    handleTapToResume,  // Phase 09 (IOS-02): synchronous-resume-first handler for overlay tap
    getOrCreateAudioContext,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

/**
 * Hook to consume the AudioContextProvider value.
 * Must be used inside an AudioContextProvider.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
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
