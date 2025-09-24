import { useState, useRef, useEffect, useCallback } from "react";

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

  // Audio buffers for piano sounds
  const pianoSoundBufferRef = useRef(null);
  const pianoSoundLoadedRef = useRef(false);

  // Timing constants
  const lookaheadTime = 0.1; // How far ahead to schedule audio (seconds)
  const scheduleAheadTime = 0.1; // How often to check for scheduling (seconds)

  // Scheduler state
  const nextBeatTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const scheduledEventsRef = useRef([]);
  const isRunningRef = useRef(false);

  /**
   * Load piano sound buffer from MP3 file
   */
  const loadPianoSound = useCallback(async () => {
    if (!audioContextRef.current || pianoSoundLoadedRef.current) return true;

    // Try multiple possible paths for the F4.mp3 file
    const possiblePaths = [
      "/sounds/piano/F4.mp3", // public/sounds/piano/F4.mp3
      "/public/sounds/piano/F4.mp3", // alternative public path
      "/assets/sounds/piano/F4.mp3", // assets directory in public
      "/src/assets/sounds/piano/F4.mp3", // original path (likely won't work)
      "/F4.mp3", // root level
    ];

    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to load piano sound from: ${path}`);
        const response = await fetch(path);

        if (!response.ok) {
          console.log(
            `Failed to fetch from ${path}: ${response.status} ${response.statusText}`
          );
          continue;
        }

        console.log(`Successfully fetched piano sound from: ${path}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer);

        pianoSoundBufferRef.current = audioBuffer;
        pianoSoundLoadedRef.current = true;
        console.log("Piano sound loaded successfully");
        return true;
      } catch (err) {
        console.log(`Error loading piano sound from ${path}:`, err);
        continue;
      }
    }

    console.error(
      "Failed to load piano sound from any path. Using fallback synthetic sound."
    );
    pianoSoundLoadedRef.current = false;
    return false;
  }, []);

  /**
   * Resume audio context if suspended (required for user interaction)
   */
  const resumeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) return false;

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
        console.log("Audio context resumed");
      }
      // Try to load piano sound if not already loaded
      if (!pianoSoundLoadedRef.current) {
        await loadPianoSound();
      }
      return true;
    } catch (err) {
      const errorMessage = `Failed to resume audio context: ${err.message}`;
      setError(errorMessage);
      console.error(errorMessage);
      return false;
    }
  }, [loadPianoSound]);

  /**
   * Get current audio time
   */
  const getCurrentTime = useCallback(() => {
    return audioContextRef.current?.currentTime || 0;
  }, []);

  /**
   * Check if audio engine is ready for use
   */
  const isReady = useCallback(() => {
    return (
      isInitialized &&
      audioSupported &&
      audioContextRef.current &&
      audioContextRef.current.state === "running"
    );
  }, [isInitialized, audioSupported]);

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
        console.log(
          "Audio context suspended - will resume on user interaction"
        );
      }

      // Load piano sound
      await loadPianoSound();

      setAudioSupported(true);
      setIsInitialized(true);
      setError(null);

      console.log("Audio engine initialized successfully");
      return true;
    } catch (err) {
      const errorMessage = `Failed to initialize audio engine: ${err.message}`;
      setError(errorMessage);
      setAudioSupported(false);
      setIsInitialized(false);
      console.error(errorMessage);
      return false;
    }
  }, [loadPianoSound]);

  /**
   * Create a piano sound from loaded buffer
   * @param {number} time - When to play the sound (in audio context time)
   * @param {number} volume - Volume level (0-1)
   * @param {number} playbackRate - Playback rate for pitch adjustment (default 1.0)
   */
  const createPianoSound = useCallback(
    (time, volume = 0.6, playbackRate = 1.0) => {
      console.log(
        "createPianoSound called with time:",
        time,
        "volume:",
        volume,
        "playbackRate:",
        playbackRate
      );
      console.log("Audio context exists?", !!audioContextRef.current);
      console.log("Gain node exists?", !!gainNodeRef.current);
      console.log("Piano buffer exists?", !!pianoSoundBufferRef.current);

      if (!audioContextRef.current || !gainNodeRef.current) {
        console.log("Missing audio context or gain node");
        return null;
      }

      try {
        if (pianoSoundBufferRef.current) {
          console.log("Using loaded piano sound buffer");
          console.log(
            `  Scheduling piano sound to start at: ${time.toFixed(3)}`
          );
          console.log(
            `  Current audio context time: ${audioContextRef.current.currentTime.toFixed(3)}`
          );
          console.log(
            `  Time difference: ${(time - audioContextRef.current.currentTime).toFixed(3)}s`
          );

          // Use loaded piano sound
          const source = audioContextRef.current.createBufferSource();
          const pianoGain = audioContextRef.current.createGain();

          source.buffer = pianoSoundBufferRef.current;
          source.playbackRate.setValueAtTime(playbackRate, time);

          // Configure gain with envelope for natural sound
          pianoGain.gain.setValueAtTime(0, time);
          pianoGain.gain.linearRampToValueAtTime(volume, time + 0.01); // Quick attack
          pianoGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5); // Natural decay

          // Connect nodes
          source.connect(pianoGain);
          pianoGain.connect(gainNodeRef.current);

          // Schedule play
          source.start(time);
          console.log("Piano sound scheduled to play at time:", time);

          // Add event listener to see when it actually starts
          source.addEventListener("ended", () => {
            console.log(
              `🎵 Piano sound finished playing (was scheduled for ${time.toFixed(3)})`
            );
          });

          return { source, gain: pianoGain };
        } else {
          console.log(
            "Piano buffer not loaded, using fallback synthetic sound"
          );
          // Fallback to synthetic sound if piano sound not loaded
          return createPatternSound(time, "triangle", 349.23, 0.3); // F4 frequency
        }
      } catch (err) {
        console.error("Error creating piano sound:", err);
        return null;
      }
    },
    []
  );

  /**
   * Play a piano sound immediately
   * @param {number} volume - Volume level (0-1)
   * @param {number} playbackRate - Playback rate for pitch adjustment
   */
  const playPianoSound = useCallback(
    (volume = 0.6, playbackRate = 1.0) => {
      console.log(
        "Audio engine playPianoSound called with volume:",
        volume,
        "playbackRate:",
        playbackRate
      );
      console.log("Audio engine ready?", isReady());
      console.log("Piano sound loaded?", pianoSoundLoadedRef.current);

      if (!isReady()) {
        console.log("Audio engine not ready");
        return false;
      }

      const currentTime = audioContextRef.current.currentTime;
      const result =
        createPianoSound(currentTime + 0.01, volume, playbackRate) !== null;
      console.log("Piano sound creation result:", result);
      return result;
    },
    [createPianoSound, isReady]
  );

  /**
   * Create a metronome click sound
   * @param {number} time - When to play the sound (in audio context time)
   * @param {boolean} isDownbeat - Whether this is a downbeat (first beat of measure)
   */
  const createMetronomeClick = useCallback((time, isDownbeat = false) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    try {
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

    console.log(
      `🔄 Processing scheduled events. Current time: ${currentTime.toFixed(3)}, Schedule window: ${scheduleWindow.toFixed(3)}`
    );
    console.log(
      `📋 Total scheduled events: ${scheduledEventsRef.current.length}`
    );

    scheduledEventsRef.current.forEach((event, index) => {
      console.log(
        `  Event ${index}: scheduled=${event.scheduled}, time=${event.time.toFixed(3)}, phase=${event.data.phase}`
      );

      if (!event.scheduled && event.time <= scheduleWindow) {
        console.log(
          `✅ Executing scheduled event at time ${event.time.toFixed(3)} (phase: ${event.data.phase})`
        );
        event.callback(event.time, event.data);
        event.scheduled = true;
      } else if (!event.scheduled) {
        console.log(
          `⏳ Event ${index} not ready yet (time: ${event.time.toFixed(3)}, current: ${currentTime.toFixed(3)})`
        );
      }
    });

    // Clean up executed events that are in the past
    const beforeCleanup = scheduledEventsRef.current.length;
    scheduledEventsRef.current = scheduledEventsRef.current.filter(
      (event) => !event.scheduled || event.time > currentTime - 0.1
    );
    const afterCleanup = scheduledEventsRef.current.length;

    if (beforeCleanup !== afterCleanup) {
      console.log(`�