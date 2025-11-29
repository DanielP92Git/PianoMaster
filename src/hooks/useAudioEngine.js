import { useState, useRef, useEffect, useCallback } from "react";

const METRONOME_TIMING_DEBUG = true;

/**
 * Custom hook for managing Web Audio API operations
 * Handles metronome clicks, pattern playback, and precise timing
 * @param {number} initialTempo - Initial tempo in BPM (60-200)
 * @returns {Object} Audio engine API
 */
export const useAudioEngine = (initialTempo = 120) => {
  // State management
  const [tempo, setTempo] = useState(Math.max(60, Math.min(200, initialTempo)));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [error, setError] = useState(null);
  const [latencyOffset, setLatencyOffset] = useState(0); // milliseconds

  // Audio context and nodes
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const schedulerIdRef = useRef(null);

  // Timing constants
  const lookaheadTime = 0.1; // How far ahead to schedule audio (seconds)
  const scheduleAheadTime = 0.1; // How often to check for scheduling (seconds)

  // Scheduler state
  const nextBeatTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const scheduledEventsRef = useRef([]);
  const isRunningRef = useRef(false);

  // Piano sound management
  const pianoSoundBufferRef = useRef(null);
  const pianoSoundLoadedRef = useRef(false);

  // Tap sound management (for instant feedback)
  const tapSoundBufferRef = useRef(null);
  const tapSoundLoadedRef = useRef(false);

  /**
   * Initialize Web Audio API context with browser compatibility
   */
  const initializeAudioContext = useCallback(async () => {
    try {
      // Check for Web Audio API support
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        throw new Error("Web Audio API not supported in this browser");
      }

      // Create audio context
      const context = new AudioContext();
      audioContextRef.current = context;

      // Create master gain node
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNode.gain.value = 0.5; // Master volume at 50%
      gainNodeRef.current = gainNode;

      // Handle context state for browsers requiring user interaction
      if (context.state === "suspended") {
        await context.resume();
      }

      setAudioSupported(true);
      setIsInitialized(true);
      setError(null);

      // Load sounds asynchronously in the background (don't block initialization)
      // These will use fallback synthetic sounds if loading fails
      loadPianoSoundAsync();
      loadTapSoundAsync();

      return true;
    } catch (err) {
      const errorMessage = `Failed to initialize audio engine: ${err.message}`;
      setError(errorMessage);
      setAudioSupported(false);
      setIsInitialized(false);
      console.error("❌ Audio initialization error:", err);
      console.error("❌ Error stack:", err.stack);
      return false;
    }
  }, []); // No dependencies to avoid circular refs

  /**
   * Load piano sound asynchronously (non-blocking helper)
   */
  const loadPianoSoundAsync = async () => {
    try {
      await loadPianoSound();
    } catch (err) {
      // Silently fall back to synthesizer
    }
  };

  /**
   * Load tap sound asynchronously (non-blocking helper)
   */
  const loadTapSoundAsync = async () => {
    try {
      await loadTapSound();
    } catch (err) {
      // Silently fall back to synthesizer
    }
  };

  /**
   * Load piano sound (G4.mp3) for rhythm pattern playback
   */
  const loadPianoSound = useCallback(async () => {
    if (pianoSoundLoadedRef.current && pianoSoundBufferRef.current) {
      return true;
    }

    const possiblePianoPaths = [
      "/sounds/piano/G4.mp3",
      "/audio/piano/G4.mp3",
      "/src/assets/sounds/piano/G4.mp3",
      "/assets/sounds/piano/G4.mp3",
    ];

    for (const path of possiblePianoPaths) {
      try {
        const response = await fetch(path);

        if (!response.ok) {
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer);

        pianoSoundBufferRef.current = audioBuffer;
        pianoSoundLoadedRef.current = true;

        return true;
      } catch (err) {
        console.error("Error loading piano sound:", err);
      }
    }

    return false;
  }, []);

  /**
   * Load tap/drum-stick sound for immediate feedback
   */
  const loadTapSound = useCallback(async () => {
    if (tapSoundLoadedRef.current && tapSoundBufferRef.current) {
      return true;
    }

    const possibleTapPaths = [
      "/sounds/drum-stick.mp3",
      "/public/sounds/drum-stick.mp3",
      "/src/assets/sounds/drum-stick.mp3",
    ];

    for (const path of possibleTapPaths) {
      try {
        const response = await fetch(path);

        if (!response.ok) {
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer);

        tapSoundBufferRef.current = audioBuffer;
        tapSoundLoadedRef.current = true;

        return true;
      } catch (err) {
        console.error("Error loading tap sound:", err);
      }
    }

    return false;
  }, []);

  /**
   * Resume audio context if suspended (required for user interaction)
   * Also initializes audio context if not already initialized
   */
  const resumeAudioContext = useCallback(async () => {
    // If audio context doesn't exist yet, initialize it first
    if (!audioContextRef.current) {
      const initialized = await initializeAudioContext();
      if (!initialized) {
        console.error("Failed to initialize audio context");
        return false;
      }
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return true;
    } catch (err) {
      const errorMessage = `Failed to resume audio context: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage);
      return false;
    }
  }, [initializeAudioContext]);

  /**
   * Get current audio time
   */
  const getCurrentTime = useCallback(() => {
    return audioContextRef.current?.currentTime || 0;
  }, []);

  /**
   * Check if audio engine is ready for use
   * Uses direct audio context validation for synchronous checking
   */
  const isReady = useCallback(() => {
    return (
      audioContextRef.current !== null &&
      gainNodeRef.current !== null &&
      audioContextRef.current.state === "running"
    );
  }, []); // No dependencies - checks refs directly

  /**
   * Create a metronome click sound
   * @param {number} time - When to play the sound (in audio context time)
   * @param {boolean} isDownbeat - Whether this is a downbeat (first beat of measure)
   */
  const createMetronomeClick = useCallback((time, isDownbeat = false) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    try {
      if (METRONOME_TIMING_DEBUG) {
        console.log("[MetronomeTiming] createMetronomeClick", {
          requestedTime: time,
          audioCurrentTime: audioContextRef.current.currentTime,
          deltaSeconds: time - audioContextRef.current.currentTime,
          isDownbeat,
        });
      }
      // Create oscillator for the click sound
      const oscillator = audioContextRef.current.createOscillator();
      const clickGain = audioContextRef.current.createGain();

      // Configure frequency - higher pitch for downbeat
      oscillator.frequency.setValueAtTime(isDownbeat ? 1000 : 800, time);
      oscillator.type = "sine";

      // Configure amplitude envelope to avoid clicks/pops
      clickGain.gain.setValueAtTime(0, time);
      clickGain.gain.linearRampToValueAtTime(0.3, time + 0.001); // Quick attack
      clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Decay

      // Connect nodes
      oscillator.connect(clickGain);
      clickGain.connect(gainNodeRef.current);

      // Schedule play
      oscillator.start(time);
      oscillator.stop(time + 0.05); // Short duration

      return { oscillator, gain: clickGain };
    } catch (err) {
      console.error("Error creating metronome click:", err);
      return null;
    }
  }, []);

  /**
   * Play a metronome click immediately
   * @param {boolean} isDownbeat - Whether this is a downbeat
   */
  const playMetronomeClick = useCallback(
    (isDownbeat = false) => {
      if (!isReady()) return false;

      const currentTime = audioContextRef.current.currentTime;
      return createMetronomeClick(currentTime + 0.01, isDownbeat) !== null;
    },
    [createMetronomeClick, isReady]
  );

  /**
   * Create a pattern sound (different timbre from metronome)
   * @param {number} time - When to play the sound (in audio context time)
   * @param {string} waveType - Type of waveform ('triangle', 'sine', 'square', 'sawtooth')
   * @param {number} frequency - Frequency of the sound (default 600Hz)
   * @param {number} duration - Duration of the sound (default 0.1s)
   */
  const createPatternSound = useCallback(
    (time, waveType = "triangle", frequency = 600, duration = 0.1) => {
      if (!audioContextRef.current || !gainNodeRef.current) return;

      try {
        // Create oscillator for the pattern sound
        const oscillator = audioContextRef.current.createOscillator();
        const patternGain = audioContextRef.current.createGain();
        const filterNode = audioContextRef.current.createBiquadFilter();

        // Configure oscillator
        oscillator.frequency.setValueAtTime(frequency, time);
        oscillator.type = waveType;

        // Configure filter for warmer sound
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(1200, time);
        filterNode.Q.setValueAtTime(1, time);

        // Configure amplitude envelope for natural sound
        patternGain.gain.setValueAtTime(0, time);
        patternGain.gain.linearRampToValueAtTime(0.4, time + 0.005); // Quick attack
        patternGain.gain.exponentialRampToValueAtTime(
          0.1,
          time + duration * 0.3
        ); // Sustain
        patternGain.gain.exponentialRampToValueAtTime(0.01, time + duration); // Decay

        // Connect nodes: oscillator -> filter -> gain -> master
        oscillator.connect(filterNode);
        filterNode.connect(patternGain);
        patternGain.connect(gainNodeRef.current);

        // Schedule play
        oscillator.start(time);
        oscillator.stop(time + duration);

        return { oscillator, gain: patternGain, filter: filterNode };
      } catch (err) {
        console.error("Error creating pattern sound:", err);
        return null;
      }
    },
    []
  );

  /**
   * Create a piano sound using the loaded G4.mp3 buffer with optional pitch shifting
   * @param {number} time - When to play the sound (in audio context time)
   * @param {number} volume - Volume level (0-1)
   * @param {number} duration - Duration of the sound (default 1.0s)
   * @param {number} pitchShift - Semitones to shift pitch (0 = no shift, 1 = one semitone up, -1 = one semitone down)
   */
  const createPianoSound = useCallback(
    (time, volume = 0.6, duration = 1.0, pitchShift = 0) => {
      if (!audioContextRef.current || !gainNodeRef.current) {
        return null;
      }

      // Check audio context state
      if (audioContextRef.current.state !== "running") {
        return null;
      }

      try {
        if (pianoSoundLoadedRef.current && pianoSoundBufferRef.current) {
          // Create buffer source from loaded piano sound
          const source = audioContextRef.current.createBufferSource();
          const pianoGain = audioContextRef.current.createGain();

          source.buffer = pianoSoundBufferRef.current;

          // Apply pitch shifting by adjusting playback rate
          // Each semitone = 2^(1/12) ratio in frequency
          // G4 (392 Hz, MIDI 67) is the base note from the sample
          if (pitchShift !== 0) {
            source.playbackRate.value = Math.pow(2, pitchShift / 12);
          }

          // Configure volume envelope for natural decay
          pianoGain.gain.setValueAtTime(0, time);
          pianoGain.gain.linearRampToValueAtTime(volume, time + 0.01); // Quick attack
          pianoGain.gain.exponentialRampToValueAtTime(volume * 0.5, time + 0.2); // Sustain
          pianoGain.gain.exponentialRampToValueAtTime(0.01, time + duration); // Natural decay

          // Connect nodes
          source.connect(pianoGain);
          pianoGain.connect(gainNodeRef.current);

          // Schedule play
          source.start(time);
          source.stop(time + duration);
          return { source, gain: pianoGain };
        } else {
          // Fallback to synthetic sound if piano sound not loaded
          return createPatternSound(time, "triangle", 600, 0.1);
        }
      } catch (err) {
        console.error("Error creating piano sound:", err);
        return null;
      }
    },
    [createPatternSound]
  );

  const parseNoteToMidi = useCallback((noteName) => {
    if (typeof noteName !== "string") return null;
    const match = noteName
      .trim()
      .toUpperCase()
      .match(/^([A-G])(#?)(\d)$/);
    if (!match) return null;
    const [, letter, accidental, octaveStr] = match;
    const SEMITONE_MAP = {
      C: 0,
      "C#": 1,
      D: 2,
      "D#": 3,
      E: 4,
      F: 5,
      "F#": 6,
      G: 7,
      "G#": 8,
      A: 9,
      "A#": 10,
      B: 11,
    };
    const key = `${letter}${accidental || ""}`;
    const semitone = SEMITONE_MAP[key];
    if (semitone === undefined) return null;
    const octave = parseInt(octaveStr, 10);
    if (Number.isNaN(octave)) return null;
    return (octave + 1) * 12 + semitone;
  }, []);

  /**
   * Play a piano sound immediately with optional pitch
   * @param {number} volume - Volume level (0-1)
   * @param {string|number} pitch - Note name (e.g., 'C4', 'D4') or semitone shift from G4
   */
  const playPianoSound = useCallback(
    (volume = 0.6, pitch = 0) => {
      if (!isReady()) {
        return false;
      }

      const currentTime = audioContextRef.current.currentTime;

      // Calculate pitch shift from G4 (MIDI 67) if pitch is a note name
      let pitchShift = 0;
      if (typeof pitch === "string") {
        const targetMidi = parseNoteToMidi(pitch);
        if (targetMidi !== null) {
          pitchShift = targetMidi - 67; // 67 is G4 (the base sample)
        }
      } else {
        pitchShift = pitch; // Direct semitone shift
      }

      return (
        createPianoSound(currentTime + 0.01, volume, 1.0, pitchShift) !== null
      );
    },
    [createPianoSound, isReady, parseNoteToMidi]
  );

  /**
   * Synthesize tap sound (ultra-low latency fallback)
   * @param {number} volume - Volume level (0-1)
   */
  const createTapSoundSynthetic = useCallback((volume = 0.8) => {
    if (!audioContextRef.current) {
      return;
    }

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Create "click" sound
      oscillator.frequency.value = 2000; // 2kHz click
      oscillator.type = "sine";

      // Envelope: quick attack, fast decay
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.001); // 1ms attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05); // 50ms decay

      oscillator.start(now);
      oscillator.stop(now + 0.05);
    } catch (err) {
      console.error("Error creating synthetic tap sound:", err);
    }
  }, []);

  /**
   * Create tap sound with ZERO latency
   * @param {number} volume - Volume level (0-1)
   */
  const createTapSound = useCallback(
    (volume = 0.8) => {
      if (!audioContextRef.current) {
        console.warn("❌ Audio context not initialized");
        return;
      }

      // Option 1: Use loaded buffer (if available)
      if (tapSoundBufferRef.current) {
        try {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = tapSoundBufferRef.current;

          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = volume;

          source.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);

          // Play IMMEDIATELY
          source.start(audioContextRef.current.currentTime);
        } catch (err) {
          console.error("Error playing tap sound:", err);
        }
      } else {
        // Option 2: Fallback to synthetic click (no file needed)
        createTapSoundSynthetic(volume);
      }
    },
    [createTapSoundSynthetic]
  );

  /**
   * Play a pattern sound immediately
   * @param {string} waveType - Type of waveform
   * @param {number} frequency - Frequency of the sound
   * @param {number} duration - Duration of the sound
   */
  const playPatternSound = useCallback(
    (waveType = "triangle", frequency = 600, duration = 0.1) => {
      if (!isReady()) return false;

      const currentTime = audioContextRef.current.currentTime;
      return (
        createPatternSound(
          currentTime + 0.01,
          waveType,
          frequency,
          duration
        ) !== null
      );
    },
    [createPatternSound, isReady]
  );

  /**
   * Play a rhythm pattern as audio sequence
   * @param {Array} pattern - Array of 1s and 0s representing the rhythm
   * @param {number} startTime - When to start the pattern (in audio context time)
   * @param {number} beatDuration - Duration of each beat in seconds
   * @param {Object} soundConfig - Configuration for pattern sounds
   */
  const playRhythmPattern = useCallback(
    (pattern, startTime, beatDuration, soundConfig = {}) => {
      if (!isReady() || !Array.isArray(pattern)) return false;

      const config = {
        waveType: "triangle",
        frequency: 600,
        duration: 0.1,
        ...soundConfig,
      };

      const scheduledSounds = [];

      try {
        pattern.forEach((beat, index) => {
          if (beat === 1) {
            const beatTime = startTime + index * beatDuration;
            const sound = createPatternSound(
              beatTime,
              config.waveType,
              config.frequency,
              config.duration
            );
            if (sound) {
              scheduledSounds.push({ ...sound, time: beatTime });
            }
          }
        });

        return scheduledSounds;
      } catch (err) {
        console.error("Error playing rhythm pattern:", err);
        return false;
      }
    },
    [createPatternSound, isReady]
  );

  /**
   * Calculate beat duration from tempo
   * @param {number} bpm - Beats per minute
   * @returns {number} Duration of one beat in seconds
   */
  const getBeatDuration = useCallback(
    (bpm = tempo) => {
      return 60.0 / bpm;
    },
    [tempo]
  );

  /**
   * Set a new tempo with validation and smooth transition
   * @param {number} newTempo - New tempo in BPM (60-200)
   * @param {boolean} smoothTransition - Whether to transition smoothly
   * @returns {boolean} Success status
   */
  const setTempoValue = useCallback(
    (newTempo, smoothTransition = true) => {
      // Validate tempo range
      const clampedTempo = Math.max(60, Math.min(200, Math.round(newTempo)));

      if (clampedTempo === tempo) {
        return true; // Already at this tempo
      }

      if (!smoothTransition) {
        setTempo(clampedTempo);
        return true;
      }

      // Smooth transition implementation
      const steps = 10;
      const stepDuration = 100; // ms
      const tempoStep = (clampedTempo - tempo) / steps;
      let currentStep = 0;

      const transitionInterval = setInterval(() => {
        currentStep++;
        const newValue = tempo + tempoStep * currentStep;

        if (currentStep >= steps) {
          setTempo(clampedTempo);
          clearInterval(transitionInterval);
        } else {
          setTempo(Math.round(newValue));
        }
      }, stepDuration);

      return true;
    },
    [tempo]
  );

  /**
   * Convert BPM to milliseconds per beat
   * @param {number} bpm - Beats per minute
   * @returns {number} Milliseconds per beat
   */
  const bpmToMilliseconds = useCallback(
    (bpm = tempo) => {
      return (60.0 / bpm) * 1000;
    },
    [tempo]
  );

  /**
   * Convert BPM to note values
   * @param {number} bpm - Beats per minute
   * @returns {Object} Note duration values in seconds
   */
  const getNoteDurations = useCallback(
    (bpm = tempo) => {
      const quarterNote = 60.0 / bpm;
      return {
        whole: quarterNote * 4,
        half: quarterNote * 2,
        quarter: quarterNote,
        eighth: quarterNote / 2,
        sixteenth: quarterNote / 4,
        thirtysecond: quarterNote / 8,
      };
    },
    [tempo]
  );

  /**
   * Get current tempo information
   * @returns {Object} Tempo details
   */
  const getTempoInfo = useCallback(() => {
    return {
      bpm: tempo,
      beatDuration: getBeatDuration(),
      millisecondsPerBeat: bpmToMilliseconds(),
      noteDurations: getNoteDurations(),
      isValid: tempo >= 60 && tempo <= 200,
    };
  }, [tempo, getBeatDuration, bpmToMilliseconds, getNoteDurations]);

  /**
   * Adjust tempo by a relative amount
   * @param {number} delta - Amount to change tempo by (can be negative)
   * @param {boolean} smoothTransition - Whether to transition smoothly
   * @returns {boolean} Success status
   */
  const adjustTempo = useCallback(
    (delta, smoothTransition = true) => {
      const newTempo = tempo + delta;
      return setTempoValue(newTempo, smoothTransition);
    },
    [tempo, setTempoValue]
  );

  /**
   * Get high-precision current time
   * @returns {number} Current time in seconds with performance timing
   */
  const getPreciseCurrentTime = useCallback(() => {
    const performanceTime = performance.now() / 1000;
    const audioTime = audioContextRef.current?.currentTime || 0;

    // Use both timing sources for better accuracy
    return audioTime;
  }, []);

  /**
   * Apply latency compensation to a scheduled time
   * @param {number} time - Original scheduled time
   * @returns {number} Compensated time
   */
  const applyLatencyCompensation = useCallback(
    (time) => {
      return time + latencyOffset / 1000; // Convert ms to seconds
    },
    [latencyOffset]
  );

  /**
   * Set latency compensation offset
   * @param {number} offsetMs - Latency offset in milliseconds
   */
  const setLatencyCompensation = useCallback((offsetMs) => {
    const clampedOffset = Math.max(-500, Math.min(500, offsetMs)); // Reasonable bounds
    setLatencyOffset(clampedOffset);
  }, []);

  /**
   * Measure system audio latency (experimental)
   * @returns {Promise<number>} Estimated latency in milliseconds
   */
  const measureLatency = useCallback(async () => {
    if (!isReady()) {
      throw new Error("Audio engine not ready for latency measurement");
    }

    return new Promise((resolve) => {
      const measurements = [];
      const testCount = 5;
      let currentTest = 0;

      const runTest = () => {
        const startTime = performance.now();
        const audioStartTime = audioContextRef.current.currentTime;

        // Create a very short test sound
        const oscillator = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        oscillator.frequency.setValueAtTime(1000, audioStartTime);
        gain.gain.setValueAtTime(0.001, audioStartTime); // Very quiet
        gain.gain.exponentialRampToValueAtTime(0.001, audioStartTime + 0.01);

        oscillator.connect(gain);
        gain.connect(gainNodeRef.current);

        oscillator.start(audioStartTime + 0.01);
        oscillator.stop(audioStartTime + 0.02);

        // Measure when it actually plays vs when scheduled
        setTimeout(() => {
          const endTime = performance.now();
          const measuredLatency = endTime - startTime - 10; // Subtract the 10ms delay
          measurements.push(measuredLatency);

          currentTest++;
          if (currentTest < testCount) {
            setTimeout(runTest, 50); // Small delay between tests
          } else {
            // Calculate average latency
            const avgLatency =
              measurements.reduce((sum, val) => sum + val, 0) /
              measurements.length;
            resolve(Math.max(0, avgLatency)); // Ensure non-negative
          }
        }, 50);
      };

      runTest();
    });
  }, [isReady]);

  /**
   * Auto-calibrate latency compensation
   * @returns {Promise<number>} Measured and applied latency offset
   */
  const calibrateLatency = useCallback(async () => {
    try {
      const measuredLatency = await measureLatency();
      setLatencyCompensation(-measuredLatency); // Negative to compensate
      return measuredLatency;
    } catch (err) {
      console.error("Latency calibration failed:", err);
      throw err;
    }
  }, [measureLatency, setLatencyCompensation]);

  /**
   * Get latency compensation information
   * @returns {Object} Latency details
   */
  const getLatencyInfo = useCallback(() => {
    return {
      offsetMs: latencyOffset,
      offsetSeconds: latencyOffset / 1000,
      isCompensated: latencyOffset !== 0,
      canMeasure: isReady(),
    };
  }, [latencyOffset, isReady]);

  /**
   * Schedule an event to be executed at a specific time
   * @param {Function} callback - Function to call at the scheduled time
   * @param {number} time - When to execute (in audio context time)
   * @param {Object} data - Additional data to pass to the callback
   * @param {boolean} applyCompensation - Whether to apply latency compensation
   */
  const scheduleEvent = useCallback(
    (callback, time, data = {}, applyCompensation = true) => {
      const eventId = Date.now() + Math.random();
      const compensatedTime = applyCompensation
        ? applyLatencyCompensation(time)
        : time;

      const event = {
        id: eventId,
        callback,
        time: compensatedTime,
        originalTime: time,
        data,
        scheduled: false,
      };

      scheduledEventsRef.current.push(event);
      return eventId;
    },
    [applyLatencyCompensation]
  );

  /**
   * Remove a scheduled event
   * @param {string} eventId - ID of the event to remove
   */
  const removeScheduledEvent = useCallback((eventId) => {
    scheduledEventsRef.current = scheduledEventsRef.current.filter(
      (event) => event.id !== eventId
    );
  }, []);

  /**
   * Clear all scheduled events
   */
  const clearScheduledEvents = useCallback(() => {
    scheduledEventsRef.current = [];
  }, []);

  /**
   * Process scheduled events that need to be executed
   */
  const processScheduledEvents = useCallback(() => {
    if (!audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    const scheduleWindow = currentTime + lookaheadTime;

    scheduledEventsRef.current.forEach((event) => {
      if (!event.scheduled && event.time <= scheduleWindow) {
        event.callback(event.time, event.data);
        event.scheduled = true;
      }
    });

    // Clean up executed events that are in the past
    const beforeCleanup = scheduledEventsRef.current.length;
    scheduledEventsRef.current = scheduledEventsRef.current.filter(
      (event) => !event.scheduled || event.time > currentTime - 0.1
    );
    const afterCleanup = scheduledEventsRef.current.length;

    if (beforeCleanup !== afterCleanup) {
      console.error("Scheduled events were not cleaned up correctly");
    }
  }, [lookaheadTime]);

  /**
   * Main scheduler loop - processes events and maintains timing
   */
  const schedulerLoop = useCallback(
    function loop() {
      if (!isRunningRef.current) {
        return;
      }

      // Process scheduled events inline to avoid dependency issues
      if (audioContextRef.current) {
        const currentTime = audioContextRef.current.currentTime;
        const scheduleWindow = currentTime + lookaheadTime;

        scheduledEventsRef.current.forEach((event) => {
          if (!event.scheduled && event.time <= scheduleWindow) {
            event.callback(event.time, event.data);
            event.scheduled = true;
          }
        });

        // Clean up executed events
        scheduledEventsRef.current = scheduledEventsRef.current.filter(
          (event) => !event.scheduled || event.time > currentTime - 0.1
        );
      }

      // Schedule next iteration - sync with browser animation frames for precise timing
      // setTimeout controls the rate, requestAnimationFrame ensures sync with display refresh
      schedulerIdRef.current = setTimeout(() => {
        requestAnimationFrame(loop);
      }, scheduleAheadTime * 1000);
    },
    [lookaheadTime, scheduleAheadTime]
  );

  /**
   * Start the scheduler
   */
  const startScheduler = useCallback(() => {
    if (!isReady() || isRunningRef.current) return false;

    isRunningRef.current = true;
    setIsPlaying(true);

    // Initialize timing
    if (audioContextRef.current) {
      nextBeatTimeRef.current = audioContextRef.current.currentTime;
      currentBeatRef.current = 0;
    }

    // Start the scheduler loop
    schedulerLoop();
    return true;
  }, [isReady, schedulerLoop]);

  /**
   * Stop the scheduler
   */
  const stopScheduler = useCallback(() => {
    isRunningRef.current = false;
    setIsPlaying(false);

    if (schedulerIdRef.current) {
      clearTimeout(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }

    clearScheduledEvents();
  }, [clearScheduledEvents]);

  /**
   * Schedule a metronome pattern
   * @param {number} beats - Number of beats to schedule
   * @param {number} startTime - When to start (optional, defaults to current time)
   * @param {Object} timeSignature - Time signature object with beats property (default 4/4)
   */
  const scheduleMetronome = useCallback(
    (beats = 4, startTime = null, timeSignature = { beats: 4 }) => {
      if (!isReady()) {
        return false;
      }

      const start = startTime || audioContextRef.current.currentTime + 0.1;
      const beatDuration = getBeatDuration();
      const beatsPerMeasure = timeSignature.beats;

      for (let i = 0; i < beats; i++) {
        const beatTime = start + i * beatDuration;
        const isDownbeat = i % beatsPerMeasure === 0; // First beat of each measure is a downbeat

        scheduleEvent(
          (time) => createMetronomeClick(time, isDownbeat),
          beatTime,
          { beat: i, isDownbeat }
        );
      }

      return true;
    },
    [isReady, getBeatDuration, scheduleEvent, createMetronomeClick]
  );

  /**
   * Schedule a rhythm pattern with metronome
   * @param {Array} pattern - Rhythm pattern (1s and 0s)
   * @param {number} startTime - When to start the pattern
   * @param {number} metronomeBeats - Number of metronome beats before pattern (default 4)
   * @param {Object} timeSignature - Time signature object with beats property (default 4/4)
   */
  const scheduleRhythmSequence = useCallback(
    (
      pattern,
      startTime = null,
      metronomeBeats = 4,
      timeSignature = { beats: 4 }
    ) => {
      if (!isReady() || !Array.isArray(pattern)) {
        return false;
      }

      const start = startTime || audioContextRef.current.currentTime + 0.1;
      const beatDuration = getBeatDuration();

      // Schedule metronome count-in
      const beatsPerMeasure = timeSignature.beats;
      for (let i = 0; i < metronomeBeats; i++) {
        const beatTime = start + i * beatDuration;
        const isDownbeat = i % beatsPerMeasure === 0; // First beat of each measure is a downbeat

        scheduleEvent(
          (time) => createMetronomeClick(time, isDownbeat),
          beatTime,
          { phase: "count-in", beat: i, isDownbeat }
        );
      }

      // Schedule pattern playback with PIANO SOUNDS
      const patternStartTime = start + metronomeBeats * beatDuration;

      pattern.forEach((beat, index) => {
        if (beat === 1) {
          const beatTime = patternStartTime + index * beatDuration;
          scheduleEvent((time) => createPianoSound(time, 0.8, 0.5), beatTime, {
            phase: "pattern",
            beat: index,
          });
        }
      });

      // Schedule metronome clicks during pattern playback to maintain steady beat reference
      for (let i = 0; i < pattern.length; i++) {
        const beatTime = patternStartTime + i * beatDuration;
        const isDownbeat = i % beatsPerMeasure === 0; // First beat of each measure is a downbeat

        scheduleEvent(
          (time) => createMetronomeClick(time, isDownbeat),
          beatTime,
          { phase: "pattern-metronome", beat: i, isDownbeat }
        );
      }

      // Schedule continued metronome during user performance phase
      // Schedule more beats to cover extended user performance time
      const userPhaseStart = patternStartTime + pattern.length * beatDuration;
      const extendedBeats = pattern.length * 3; // 3x pattern length to give users plenty of time
      for (let i = 0; i < extendedBeats; i++) {
        const beatTime = userPhaseStart + i * beatDuration;
        const isDownbeat = i % beatsPerMeasure === 0; // First beat of each measure is a downbeat

        scheduleEvent(
          (time) => createMetronomeClick(time, isDownbeat),
          beatTime,
          { phase: "user-performance", beat: i, isDownbeat }
        );
      }

      return {
        countInStart: start,
        patternStart: patternStartTime,
        userPhaseStart: userPhaseStart,
        totalDuration: userPhaseStart + pattern.length * beatDuration - start,
      };
    },
    [
      isReady,
      getBeatDuration,
      scheduleEvent,
      createMetronomeClick,
      createPianoSound,
    ]
  );

  /**
   * Clean up audio resources
   */
  const cleanup = useCallback(() => {
    // Stop scheduler
    stopScheduler();

    if (schedulerIdRef.current) {
      clearTimeout(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsPlaying(false);
    setIsInitialized(false);
  }, [stopScheduler]);

  // Initialize on mount
  useEffect(() => {
    initializeAudioContext();

    // Cleanup on unmount
    return cleanup;
  }, [initializeAudioContext, cleanup]);

  // Public API
  return {
    // State
    tempo,
    isPlaying,
    isInitialized,
    audioSupported,
    error,

    // Status checks
    isReady,
    getCurrentTime,

    // Control methods
    resumeAudioContext,
    cleanup,

    // Audio generation
    createMetronomeClick,
    createMetronomeSound: createMetronomeClick, // Alias for consistency
    playMetronomeClick,
    createPatternSound,
    playPatternSound,
    createPianoSound,
    playPianoSound,
    createTapSound,
    createTapSoundSynthetic,
    playRhythmPattern,

    // Timing and scheduling
    getBeatDuration,
    scheduleEvent,
    removeScheduledEvent,
    clearScheduledEvents,
    startScheduler,
    stopScheduler,
    scheduleMetronome,
    scheduleRhythmSequence,

    // Tempo control
    setTempoValue,
    adjustTempo,
    bpmToMilliseconds,
    getNoteDurations,
    getTempoInfo,

    // Latency compensation
    getPreciseCurrentTime,
    applyLatencyCompensation,
    setLatencyCompensation,
    measureLatency,
    calibrateLatency,
    getLatencyInfo,
    latencyOffset,

    // Internal refs (for extension by other subtasks)
    audioContextRef,
    gainNodeRef,
    lookaheadTime,
    scheduleAheadTime,
    nextBeatTimeRef,
    currentBeatRef,
    scheduledEventsRef,
    isRunningRef,
  };
};

export default useAudioEngine;
