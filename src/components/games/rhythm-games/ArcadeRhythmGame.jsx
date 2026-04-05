import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Zap, Flame } from "lucide-react";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay";
import VictoryScreen from "../VictoryScreen";
import GameOverScreen from "../GameOverScreen";
import BackButton from "../../ui/BackButton";
import { getNodeById } from "../../../data/skillTrail";
import { getPattern, TIME_SIGNATURES } from "./RhythmPatternGenerator";
import { binaryPatternToBeats } from "./utils/rhythmVexflowHelpers";
// scoreTap not used — arcade game uses wider inline timing windows
import FloatingFeedback from "./components/FloatingFeedback";
import CountdownOverlay from "./components/CountdownOverlay";

// ---------------------------------------------------------------------------
// Exported constants (tested directly)
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components -- component and constants are co-located intentionally; HMR-only dev concern
export const GAME_PHASES = {
  SETUP: "setup",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  FEEDBACK: "feedback",
  SESSION_COMPLETE: "session-complete",
};

export const INITIAL_LIVES = 3;
export const ON_FIRE_THRESHOLD = 5;
export const SCREEN_TRAVEL_TIME = 3.0; // seconds for a tile to travel from top to hit zone

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const TOTAL_PATTERNS = 10; // 10 patterns per session

/** Duration-coded tile heights in pixels */
const TILE_HEIGHTS = {
  16: 80, // whole (16 sixteenth units)
  12: 72, // dotted half
  8: 64, // half
  6: 56, // dotted quarter
  4: 56, // quarter
  3: 48, // dotted eighth
  2: 44, // eighth
  1: 36, // sixteenth
};

/** Duration-coded tile Tailwind classes */
function getTileColorClass(durationUnits, isRest) {
  if (isRest) return "bg-white/15 border border-dashed border-white/30";
  if (durationUnits >= 16)
    return "bg-violet-400/80 border border-violet-300/60";
  if (durationUnits >= 8)
    return "bg-emerald-400/80 border border-emerald-300/60";
  if (durationUnits >= 4) return "bg-blue-400/80 border border-blue-300/60";
  return "bg-orange-400/80 border border-orange-300/60";
}

/** Get time signature object from string */
function getTimeSignatureObject(timeSigStr) {
  const mapping = {
    "4/4": TIME_SIGNATURES.FOUR_FOUR,
    "3/4": TIME_SIGNATURES.THREE_FOUR,
    "2/4": TIME_SIGNATURES.TWO_FOUR,
    "6/8": TIME_SIGNATURES.SIX_EIGHT,
  };
  return mapping[timeSigStr] ?? TIME_SIGNATURES.FOUR_FOUR;
}

/**
 * ArcadeRhythmGame
 *
 * Falling-tile arcade rhythm game. Colored tiles descend toward a glowing
 * hit zone at the bottom of the screen. Children tap to score.
 *
 * ARCR-01: Falling tiles descend in sync with beat schedule via rAF
 * ARCR-02: Tapping the hit zone scores PERFECT/GOOD/MISS via audioContext.currentTime
 * ARCR-03: Missing a tile loses a life; 0 lives triggers GameOverScreen
 * ARCR-04: Consecutive hits increment combo; combo >= 5 triggers on-fire mode
 * ARCR-05: Completing 10 patterns triggers VictoryScreen with star rating and XP
 */
function ArcadeRhythmGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Trail state extraction from location.state
  const nodeId = location.state?.nodeId ?? null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // Audio context
  const {
    audioContextRef,
    isInterrupted,
    handleTapToResume,
    getOrCreateAudioContext,
  } = useAudioContext();

  // Accessibility
  const { reducedMotion = false } = useAccessibility();

  // Session timeout controls
  const { pauseTimer, resumeTimer } = useSessionTimeout();

  // Extract config from nodeConfig or use defaults (per RESEARCH Pattern 6)
  const tempo = nodeConfig?.tempo ?? nodeConfig?.config?.tempo ?? 90;
  const timeSignatureStr =
    nodeConfig?.timeSignature ?? nodeConfig?.config?.timeSignature ?? "4/4";
  const difficulty =
    nodeConfig?.difficulty ?? nodeConfig?.config?.difficulty ?? "beginner";
  const timeSignatureObj = getTimeSignatureObject(timeSignatureStr);

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [patternScores, setPatternScores] = useState([]);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [isOnFire, setIsOnFire] = useState(false);
  const [countdownValue, setCountdownValue] = useState(null);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [tiles, setTiles] = useState([]); // array of tile definitions for current pattern
  const [needsGestureToStart, setNeedsGestureToStart] = useState(false);

  // Refs for animation loop (no re-renders)
  const rafIdRef = useRef(null);
  const tilesRef = useRef([]); // tile definitions (mirrors tiles state, updated without re-render)
  const tileRefs = useRef([]); // array of DOM refs per tile
  const scoredRef = useRef(new Set()); // indices of already-scored tiles (prevent double-scoring)
  const scheduledBeatTimesRef = useRef([]); // AudioContext times for each non-rest beat onset
  const nextBeatIndexRef = useRef(0);
  const patternStartTimeRef = useRef(0);
  const countdownTimeoutsRef = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const hasAutoStartedRef = useRef(false); // auto-start guard
  const livesRef = useRef(INITIAL_LIVES); // ref mirror for lives (accessible in RAF callback)
  const gamePhaseRef = useRef(GAME_PHASES.SETUP); // ref mirror for gamePhase (accessible in RAF)
  const patternScoresRef = useRef([]); // ref mirror for patternScores (accessible in RAF callbacks)
  const currentPatternIndexRef = useRef(0); // ref mirror for currentPatternIndex
  const startPlayingPhaseRef = useRef(null); // latest startPlayingPhase (breaks stale closure chain)
  const startNextPatternRef = useRef(null); // latest startNextPattern (breaks stale closure chain)
  const tileLaneRef = useRef(null); // tile lane container (for height measurement)
  const laneHeightRef = useRef(0); // cached lane height for RAF animation

  // Sync refs with state
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  useEffect(() => {
    patternScoresRef.current = patternScores;
  }, [patternScores]);
  useEffect(() => {
    currentPatternIndexRef.current = currentPatternIndex;
  }, [currentPatternIndex]);

  // ---------------------------------------------------------------------------
  // Session timer management
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const activePhases = [GAME_PHASES.COUNTDOWN, GAME_PHASES.PLAYING];
    if (activePhases.includes(gamePhase)) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer();
  }, [gamePhase, pauseTimer, resumeTimer]);

  // ---------------------------------------------------------------------------
  // Cancel all timers helper
  // ---------------------------------------------------------------------------
  const cancelAllTimers = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    countdownTimeoutsRef.current.forEach((id) => clearTimeout(id));
    countdownTimeoutsRef.current = [];
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Audio helpers
  // ---------------------------------------------------------------------------

  /** Play a short tap click sound */
  const playTapClick = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === "closed") return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      // Audio scheduling error — ignore
    }
  }, [audioContextRef]);

  /** Play metronome click for countdown */
  const playMetronomeClick = useCallback(
    (time, isDownbeat) => {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === "closed") return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = isDownbeat ? 900 : 700;
        const vol = isDownbeat ? 0.15 : 0.1;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.025);
      } catch {
        // Audio scheduling error — ignore
      }
    },
    [audioContextRef]
  );

  // ---------------------------------------------------------------------------
  // Pattern fetching and tile building
  // ---------------------------------------------------------------------------

  /**
   * Build tile definitions from beats array.
   * Each tile has: id, durationUnits, isRest, spawnTime, beatTime, height, colorClass
   * spawnTime = beatTime - SCREEN_TRAVEL_TIME (tile starts off-screen)
   */
  const buildTilesFromBeats = useCallback((beats, playbackStartTime, bpm) => {
    const beatDuration = 60 / bpm;
    const sixteenthDuration = beatDuration / 4;
    const tileDefinitions = [];
    let offset = 0;
    let nonRestIndex = 0;

    beats.forEach((beat, idx) => {
      const beatTime = playbackStartTime + offset;
      const spawnTime = beatTime - SCREEN_TRAVEL_TIME;
      const height = TILE_HEIGHTS[beat.durationUnits] ?? TILE_HEIGHTS[4];
      const colorClass = getTileColorClass(beat.durationUnits, beat.isRest);

      tileDefinitions.push({
        id: idx,
        durationUnits: beat.durationUnits,
        isRest: beat.isRest,
        spawnTime,
        beatTime,
        height,
        colorClass,
        beatIndex: beat.isRest ? -1 : nonRestIndex,
      });

      if (!beat.isRest) nonRestIndex++;
      offset += sixteenthDuration * beat.durationUnits;
    });

    return tileDefinitions;
  }, []);

  /**
   * Build scheduled beat times array for scoreTap().
   * Returns only times for non-rest beats.
   */
  const buildBeatTimes = useCallback((beats, bpm, startTime) => {
    const beatDuration = 60 / bpm;
    const sixteenthDuration = beatDuration / 4;
    const times = [];
    let offset = 0;

    beats.forEach((beat) => {
      if (!beat.isRest) {
        times.push(startTime + offset);
      }
      offset += sixteenthDuration * beat.durationUnits;
    });

    return times;
  }, []);

  /** Fetch a new pattern and convert to beats */
  const fetchNewPattern = useCallback(async () => {
    try {
      const result = await getPattern(
        timeSignatureStr,
        difficulty,
        rhythmPatterns
      );
      if (!result || !result.pattern) return null;
      const beats = binaryPatternToBeats(result.pattern);
      return beats;
    } catch (err) {
      console.warn("[ArcadeRhythmGame] fetchNewPattern error:", err);
      return null;
    }
  }, [timeSignatureStr, difficulty, rhythmPatterns]);

  // ---------------------------------------------------------------------------
  // Screen shake on miss
  // ---------------------------------------------------------------------------
  const triggerScreenShake = useCallback(() => {
    if (reducedMotion) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }, [reducedMotion]);

  // ---------------------------------------------------------------------------
  // Miss handling (called from RAF loop when tile exits without being scored)
  // ---------------------------------------------------------------------------
  const handleMissFromRaf = useCallback(() => {
    // Only process if still playing
    if (gamePhaseRef.current !== GAME_PHASES.PLAYING) return;

    setCombo(0);
    setIsOnFire(false);
    setLatestFeedback("MISS");
    setFeedbackKey((k) => k + 1);
    triggerScreenShake();

    setLives((prev) => {
      const next = prev - 1;
      livesRef.current = next;
      if (next <= 0) {
        // Defer phase transition so state has time to flush
        setTimeout(() => {
          setGamePhase(GAME_PHASES.FEEDBACK);
        }, 50);
      }
      return next;
    });
  }, [triggerScreenShake]);

  // ---------------------------------------------------------------------------
  // RAF animation loop
  // ---------------------------------------------------------------------------
  const startRafLoop = useCallback(
    (tileDefinitions) => {
      scoredRef.current.clear();

      function animationFrame() {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (gamePhaseRef.current !== GAME_PHASES.PLAYING) return;

        const now = ctx.currentTime;

        tileDefinitions.forEach((tile, idx) => {
          const tileEl = tileRefs.current[idx];
          if (!tileEl) return;

          const elapsed = now - tile.spawnTime;
          const progress = elapsed / SCREEN_TRAVEL_TIME;

          if (progress < 0) {
            // Tile hasn't spawned yet — hide above screen
            tileEl.style.transform = "translateY(-100px)";
            tileEl.style.opacity = "0";
            return;
          }

          const targetY = laneHeightRef.current - 24 - tile.height / 2;

          if (progress <= 1.0) {
            // Tile is descending — position via pixel transform
            // progress 0 = top of lane, progress 1 = tile CENTER at hit zone line
            const yPx = progress * targetY;
            tileEl.style.transform = `translateY(${yPx}px)`;
            tileEl.style.opacity = "1";
            return;
          }

          // progress > 1.0 — tile past hit zone: keep moving down + fade out
          const overshoot = progress - 1.0;
          const yPx = targetY + overshoot * targetY * 0.5; // continue descending
          const fadeOpacity = Math.max(0, 1 - overshoot * 3); // fade over ~0.33 progress
          tileEl.style.transform = `translateY(${yPx}px)`;
          tileEl.style.opacity = String(fadeOpacity);

          // Trigger miss once when tile first crosses the line
          if (!scoredRef.current.has(idx)) {
            scoredRef.current.add(idx);
            if (!tile.isRest) {
              // Only penalize if the player hasn't already scored past this beat
              // (prevents phantom misses when a tap scores a later beat first)
              if (tile.beatIndex >= nextBeatIndexRef.current) {
                handleMissFromRaf();
              }
            }
          }
        });

        rafIdRef.current = requestAnimationFrame(animationFrame);
      }

      // Cache lane height before starting loop (avoids layout thrash in RAF)
      if (tileLaneRef.current) {
        laneHeightRef.current = tileLaneRef.current.offsetHeight;
      }

      rafIdRef.current = requestAnimationFrame(animationFrame);
    },
    [audioContextRef, handleMissFromRaf]
  );

  // ---------------------------------------------------------------------------
  // Pattern scoring and session advancement
  // ---------------------------------------------------------------------------

  /**
   * Transition to next pattern or session complete.
   * Called after all tiles in a pattern have been scored or exited.
   */
  const finishPattern = useCallback(
    (score) => {
      cancelAllTimers();
      setGamePhase(GAME_PHASES.FEEDBACK);

      setPatternScores((prev) => {
        const updated = [...prev, score];
        patternScoresRef.current = updated;
        return updated;
      });

      // Schedule advancement OUTSIDE state updater (StrictMode calls updaters twice)
      feedbackTimeoutRef.current = setTimeout(() => {
        const newPatternIndex = currentPatternIndexRef.current + 1;
        if (
          patternScoresRef.current.length >= TOTAL_PATTERNS ||
          livesRef.current <= 0
        ) {
          setGamePhase(GAME_PHASES.SESSION_COMPLETE);
        } else {
          setCurrentPatternIndex(newPatternIndex);
          currentPatternIndexRef.current = newPatternIndex;
          startNextPatternRef.current();
        }
      }, 600);
    },
    [cancelAllTimers]
  );

  // ---------------------------------------------------------------------------
  // Countdown phase
  // ---------------------------------------------------------------------------
  const startCountdown = useCallback(
    (beats) => {
      setGamePhase(GAME_PHASES.COUNTDOWN);
      setCountdownValue(3);

      // Clear previous pattern's tiles
      setTiles([]);
      tilesRef.current = [];
      tileRefs.current = [];

      const ctx = audioContextRef.current;
      const beatDuration = 60 / tempo;
      const beatsPerMeasure = timeSignatureObj?.beats ?? 4;

      // Resume suspended AudioContext (browser autoplay policy)
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // Schedule metronome clicks for countdown measure (audio-dependent, skip if no ctx)
      if (ctx) {
        const now = ctx.currentTime;
        for (let i = 0; i < beatsPerMeasure; i++) {
          playMetronomeClick(now + i * beatDuration, i === 0);
        }
      }

      // Visual countdown: 3 → 2 → 1 → GO (always schedule, independent of audio)
      const countdownSequence = [3, 2, 1, "GO"];
      countdownSequence.forEach((value, idx) => {
        const timeoutId = setTimeout(
          () => {
            setCountdownValue(value);
          },
          idx * beatDuration * 1000
        );
        countdownTimeoutsRef.current.push(timeoutId);
      });

      // After countdown measure, start playing
      const playingTimeoutId = setTimeout(
        () => {
          setCountdownValue(null);
          startPlayingPhaseRef.current(beats);
        },
        beatsPerMeasure * beatDuration * 1000
      );
      countdownTimeoutsRef.current.push(playingTimeoutId);
    },
    [audioContextRef, tempo, timeSignatureObj, playMetronomeClick]
  );

  // ---------------------------------------------------------------------------
  // Playing phase
  // ---------------------------------------------------------------------------
  const startPlayingPhase = useCallback(
    (beats) => {
      setGamePhase(GAME_PHASES.PLAYING);
      gamePhaseRef.current = GAME_PHASES.PLAYING;
      nextBeatIndexRef.current = 0;
      scoredRef.current.clear();

      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Offset by SCREEN_TRAVEL_TIME so tiles spawn at the top now and arrive
      // at the hit zone after descending for the full travel duration.
      const playbackStartTime = ctx.currentTime + SCREEN_TRAVEL_TIME + 0.05;
      patternStartTimeRef.current = playbackStartTime;

      // Build tile definitions
      const tileDefinitions = buildTilesFromBeats(
        beats,
        playbackStartTime,
        tempo
      );
      tilesRef.current = tileDefinitions;
      setTiles(tileDefinitions);

      // Build scheduled beat times for tap scoring
      const beatTimes = buildBeatTimes(beats, tempo, playbackStartTime);
      scheduledBeatTimesRef.current = beatTimes;

      // Start RAF loop (brief delay to allow tile DOM refs to mount)
      setTimeout(() => {
        startRafLoop(tileDefinitions);
      }, 50);

      // Schedule pattern end check (total duration + buffer)
      const beatDuration = 60 / tempo;
      const sixteenthDuration = beatDuration / 4;
      const totalDuration = beats.reduce(
        (sum, b) => sum + b.durationUnits * sixteenthDuration,
        0
      );
      const patternEndTime = (totalDuration + SCREEN_TRAVEL_TIME + 0.5) * 1000;

      feedbackTimeoutRef.current = setTimeout(() => {
        if (gamePhaseRef.current === GAME_PHASES.PLAYING) {
          // Tally hits
          const hitCount = scoredRef.current.size;
          const nonRestCount = beatTimes.length;
          // We don't have per-quality counts here, use approximate scoring
          finishPattern(
            Math.max(
              0,
              Math.round((hitCount / Math.max(nonRestCount, 1)) * 100)
            )
          );
        }
      }, patternEndTime);
    },
    [
      audioContextRef,
      tempo,
      buildTilesFromBeats,
      buildBeatTimes,
      startRafLoop,
      finishPattern,
    ]
  );
  startPlayingPhaseRef.current = startPlayingPhase;

  // ---------------------------------------------------------------------------
  // Start next pattern helper
  // ---------------------------------------------------------------------------
  const startNextPattern = useCallback(async () => {
    const beats = await fetchNewPattern();
    if (beats) {
      startCountdown(beats);
    }
  }, [fetchNewPattern, startCountdown]);
  startNextPatternRef.current = startNextPattern;

  // ---------------------------------------------------------------------------
  // Tap scoring
  // ---------------------------------------------------------------------------
  const handleHitZoneTap = useCallback(() => {
    if (gamePhaseRef.current !== GAME_PHASES.PLAYING) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    playTapClick();

    const tapTime = ctx.currentTime;
    if (scheduledBeatTimesRef.current.length === 0) return;

    // Arcade-specific scoring with wider windows than MetronomeTrainer
    // Visual-only falling-tile games need generous windows (~3x wider)
    const ARCADE_PERFECT_MS = 150; // ±150ms — generous for visual-only arcade game
    const ARCADE_GOOD_MS = 280; // ±280ms — forgiving for children

    const beatTimes = scheduledBeatTimesRef.current;
    const searchStart = Math.max(0, nextBeatIndexRef.current);
    const searchEnd = Math.min(
      beatTimes.length - 1,
      nextBeatIndexRef.current + 2
    );
    let bestDelta = Infinity;
    let bestIdx = searchStart;
    for (let i = searchStart; i <= searchEnd; i++) {
      const delta = Math.abs((tapTime - beatTimes[i]) * 1000);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    }

    let quality;
    if (bestDelta <= ARCADE_PERFECT_MS) quality = "PERFECT";
    else if (bestDelta <= ARCADE_GOOD_MS) quality = "GOOD";
    else quality = "MISS";

    const noteIdx = bestIdx;
    const newNextBeatIndex = bestIdx + 1;

    // Mark the corresponding tile as scored
    // Find the tile whose beatIndex matches noteIdx
    const tileIdx = tilesRef.current.findIndex(
      (t) => !t.isRest && t.beatIndex === noteIdx
    );
    if (tileIdx !== -1) {
      scoredRef.current.add(tileIdx);
    }

    nextBeatIndexRef.current = newNextBeatIndex;

    if (quality === "MISS") {
      // Tap too early/late — reset combo but don't lose a life
      // (lives are only lost when tiles pass through untapped, via handleMissFromRaf)
      setCombo(0);
      setIsOnFire(false);
    } else {
      // PERFECT or GOOD
      setCombo((prev) => {
        const next = prev + 1;
        if (next >= ON_FIRE_THRESHOLD) {
          setIsOnFire(true);
        }
        return next;
      });
    }

    setLatestFeedback(quality);
    setFeedbackKey((k) => k + 1);

    // Visual feedback: apply scored class to tile element
    if (tileIdx !== -1) {
      const tileEl = tileRefs.current[tileIdx];
      if (tileEl) {
        if (quality === "GOOD") {
          tileEl.style.transition = reducedMotion
            ? "none"
            : "opacity 200ms ease-out";
          tileEl.style.opacity = "0";
        } else if (quality === "PERFECT") {
          tileEl.style.opacity = "0";
        }
      }
    }
  }, [audioContextRef, tempo, playTapClick, triggerScreenShake, reducedMotion]);

  // ---------------------------------------------------------------------------
  // Trail navigation
  // ---------------------------------------------------------------------------
  const handleNextExercise = useCallback(() => {
    if (nodeId && trailExerciseIndex !== null && trailTotalExercises !== null) {
      const nextIndex = trailExerciseIndex + 1;
      if (nextIndex < trailTotalExercises) {
        const node = getNodeById(nodeId);
        if (node && node.exercises && node.exercises[nextIndex]) {
          const nextExercise = node.exercises[nextIndex];
          const navState = {
            nodeId,
            nodeConfig: nextExercise.config,
            exerciseIndex: nextIndex,
            totalExercises: trailTotalExercises,
            exerciseType: nextExercise.type,
          };
          switch (nextExercise.type) {
            case "note_recognition":
              navigate("/notes-master-mode/notes-recognition-game", {
                state: navState,
              });
              break;
            case "sight_reading":
              navigate("/notes-master-mode/sight-reading-game", {
                state: navState,
              });
              break;
            case "memory_game":
              navigate("/notes-master-mode/memory-game", { state: navState });
              break;
            case "rhythm":
              navigate("/rhythm-mode/metronome-trainer", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "rhythm_reading":
              navigate("/rhythm-mode/rhythm-reading-game", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "rhythm_dictation":
              navigate("/rhythm-mode/rhythm-dictation-game", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "arcade_rhythm":
              navigate("/rhythm-mode/arcade-rhythm-game", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "boss_challenge":
              navigate("/notes-master-mode/sight-reading-game", {
                state: { ...navState, isBoss: true },
              });
              break;
            case "pitch_comparison":
              navigate("/ear-training-mode/note-comparison-game", {
                state: navState,
              });
              break;
            case "interval_id":
              navigate("/ear-training-mode/interval-game", { state: navState });
              break;
            default:
              navigate("/trail");
          }
          return;
        }
      }
    }
    navigate("/trail");
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // ---------------------------------------------------------------------------
  // Start game
  // ---------------------------------------------------------------------------
  const startGame = useCallback(async () => {
    // Resume AudioContext inside user gesture (required by browser autoplay policy)
    // Ensure AudioContext exists (StrictMode cleanup may have nulled the ref)
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    cancelAllTimers();
    setCurrentPatternIndex(0);
    currentPatternIndexRef.current = 0;
    setPatternScores([]);
    patternScoresRef.current = [];
    setLives(INITIAL_LIVES);
    livesRef.current = INITIAL_LIVES;
    setCombo(0);
    setIsOnFire(false);
    setTiles([]);
    tilesRef.current = [];
    tileRefs.current = [];
    scoredRef.current.clear();

    const beats = await fetchNewPattern();
    if (beats) {
      startCountdown(beats);
    }
  }, [
    audioContextRef,
    getOrCreateAudioContext,
    cancelAllTimers,
    fetchNewPattern,
    startCountdown,
  ]);

  // IOS-02: Handle user-gesture tap-to-start when AudioContext is suspended
  const handleGestureStart = useCallback(async () => {
    const ctx = getOrCreateAudioContext();
    if (ctx) {
      await ctx.resume().catch(() => {});
    }
    setNeedsGestureToStart(false);
    hasAutoStartedRef.current = true;
    setTimeout(() => startGame(), 100);
  }, [audioContextRef, getOrCreateAudioContext, startGame]);

  // ---------------------------------------------------------------------------
  // Auto-start from trail node
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      const ctx = audioContextRef.current;
      if (ctx && (ctx.state === "suspended" || ctx.state === "interrupted")) {
        setNeedsGestureToStart(true);
        return;
      }
      hasAutoStartedRef.current = true;
      setTimeout(() => startGame(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeConfig]);

  // Reset guard when nodeId changes
  useEffect(() => {
    hasAutoStartedRef.current = false;
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentPatternIndex(0);
    setPatternScores([]);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setIsOnFire(false);
    setTiles([]);
    cancelAllTimers();
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Check for game over (lives = 0) and auto-transition to SESSION_COMPLETE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (lives <= 0 && gamePhase === GAME_PHASES.PLAYING) {
      cancelAllTimers();
      setGamePhase(GAME_PHASES.FEEDBACK);
      feedbackTimeoutRef.current = setTimeout(() => {
        setGamePhase(GAME_PHASES.SESSION_COMPLETE);
      }, 400);
    }
  }, [lives, gamePhase, cancelAllTimers]);

  // ---------------------------------------------------------------------------
  // Calculate final score for VictoryScreen / GameOverScreen
  // ---------------------------------------------------------------------------
  const totalScore = patternScores.reduce((sum, s) => sum + s, 0);
  const totalPossibleScore = TOTAL_PATTERNS * 100;
  const correctAnswers = patternScores.filter((s) => s >= 60).length;

  // Keyboard handler: spacebar to tap during PLAYING
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && gamePhaseRef.current === GAME_PHASES.PLAYING) {
        e.preventDefault();
        handleHitZoneTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleHitZoneTap]);

  // ---------------------------------------------------------------------------
  // Main game render
  // ---------------------------------------------------------------------------
  const isPlaying = gamePhase === GAME_PHASES.PLAYING;

  // ---------------------------------------------------------------------------
  // SESSION_COMPLETE → render VictoryScreen or GameOverScreen
  // ---------------------------------------------------------------------------
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    if (lives <= 0) {
      return (
        <GameOverScreen
          livesLost={true}
          score={totalScore}
          correctAnswers={correctAnswers}
          totalQuestions={TOTAL_PATTERNS}
          nodeId={nodeId}
          onReset={() => {
            setGamePhase(GAME_PHASES.SETUP);
            hasAutoStartedRef.current = false;
          }}
        />
      );
    }

    return (
      <VictoryScreen
        score={totalScore}
        totalPossibleScore={totalPossibleScore}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType={trailExerciseType}
        onNextExercise={handleNextExercise}
        onReset={() => {
          setGamePhase(GAME_PHASES.SETUP);
          hasAutoStartedRef.current = false;
        }}
        onExit={() => navigate("/trail")}
      />
    );
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 ${
        isShaking && !reducedMotion ? "animate-[shake_400ms_ease-in-out]" : ""
      }`}
      dir="ltr"
      onPointerDown={isPlaying ? handleHitZoneTap : undefined}
      style={
        isShaking && !reducedMotion
          ? { animation: "shake 400ms ease-in-out" }
          : undefined
      }
    >
      {/* Screen shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* Header (h-12) */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between px-4 py-2 text-white/80">
        {/* Back button */}
        <BackButton to={nodeId ? "/trail?path=rhythm" : "/rhythm-mode"} />

        {/* Exercise counter */}
        <div className="text-sm font-bold text-white/80" dir="ltr">
          {currentPatternIndex + 1} / {TOTAL_PATTERNS}
        </div>

        {/* Lives + combo */}
        <div className="flex items-center gap-3">
          {/* Combo badge */}
          {combo >= 2 && (
            <div
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-bold ${
                isOnFire
                  ? "border-orange-400/40 bg-orange-400/20 text-orange-300"
                  : "border-yellow-400/40 bg-yellow-400/20 text-yellow-300"
              }`}
            >
              {isOnFire && <Flame className="h-3 w-3" />}
              {combo}
              <Zap className="h-3 w-3" />
            </div>
          )}

          {/* Lives hearts */}
          <div
            className="flex items-center gap-1"
            aria-label={`${lives} lives remaining`}
            role="group"
          >
            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`h-5 w-5 ${
                  i < lives ? "fill-red-400 text-red-400" : "text-white/30"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main game area */}
      {/* ------------------------------------------------------------------ */}
      <main className="relative flex-1 overflow-hidden">
        {/* On-fire aria-live announcement */}
        {isOnFire && (
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            On fire! Keep going!
          </span>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Setup screen */}
        {/* ---------------------------------------------------------------- */}
        {gamePhase === GAME_PHASES.SETUP && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                {t("games.arcadeRhythm.title", "Arcade Rhythm")}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {t(
                  "games.arcadeRhythm.subtitle",
                  "Tap the hit zone when tiles arrive!"
                )}
              </p>
            </div>
            <button
              onClick={startGame}
              className="rounded-xl bg-indigo-500 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-indigo-400 active:scale-95"
            >
              {t("games.actions.play", "Play")}
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Tile lane (shown during COUNTDOWN and PLAYING) */}
        {/* ---------------------------------------------------------------- */}
        {(gamePhase === GAME_PHASES.COUNTDOWN ||
          gamePhase === GAME_PHASES.PLAYING ||
          gamePhase === GAME_PHASES.FEEDBACK) && (
          <div
            ref={tileLaneRef}
            className="absolute inset-0 overflow-hidden"
            style={{ paddingBottom: "48px" }} // leave space for hit zone
          >
            {tiles.map((tile, idx) => (
              <div
                key={tile.id}
                ref={(el) => {
                  tileRefs.current[idx] = el;
                }}
                className={`absolute left-4 right-4 rounded-xl ${tile.colorClass} ${
                  isOnFire && !tile.isRest && !reducedMotion
                    ? "drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                    : ""
                }`}
                style={{
                  height: `${tile.height}px`,
                  top: 0,
                  transform: "translateY(-100%)",
                  opacity: 0,
                  willChange: "transform",
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Hit zone line + tap target */}
        {/* ---------------------------------------------------------------- */}
        {(gamePhase === GAME_PHASES.PLAYING ||
          gamePhase === GAME_PHASES.COUNTDOWN ||
          gamePhase === GAME_PHASES.FEEDBACK) && (
          <div
            className="absolute bottom-0 left-0 right-0 h-12"
            onPointerDown={isPlaying ? handleHitZoneTap : undefined}
            role="button"
            tabIndex={isPlaying ? 0 : -1}
            aria-label={t("games.rhythmReading.tapArea.tapHere", "Tap here!")}
            style={{ cursor: isPlaying ? "pointer" : "default" }}
          >
            {/* Visual hit zone line */}
            <div
              className={`absolute left-4 right-4 ${!reducedMotion ? "animate-pulse" : ""}`}
              style={{
                top: "50%",
                height: "3px",
                transform: "translateY(-50%)",
                backgroundColor: isOnFire ? "#f97316" : "#6366f1",
                boxShadow: isOnFire
                  ? "0 0 16px 6px rgba(249, 115, 22, 0.9)"
                  : "0 0 12px 4px rgba(99, 102, 241, 0.8)",
                transition: "background-color 150ms, box-shadow 150ms",
              }}
            />

            {/* Tap instruction */}
            {gamePhase === GAME_PHASES.COUNTDOWN && (
              <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                <span className="text-xs font-medium text-white/50">
                  {t("games.rhythmReading.tapArea.tapHere", "Tap here!")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Floating feedback (above hit zone) */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="absolute bottom-12 left-0 right-0"
          style={{ pointerEvents: "none" }}
        >
          <FloatingFeedback
            quality={latestFeedback}
            feedbackKey={feedbackKey}
            reducedMotion={reducedMotion}
          />
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Countdown overlay */}
      {/* ------------------------------------------------------------------ */}
      <CountdownOverlay
        countdownValue={countdownValue}
        reducedMotion={reducedMotion}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Trail gesture gate — needs user tap to resume AudioContext */}
      {/* ------------------------------------------------------------------ */}
      {needsGestureToStart && (
        <AudioInterruptedOverlay
          isVisible={true}
          onTapToResume={handleGestureStart}
          onRestartExercise={() => navigate(-1)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* iOS audio interrupted overlay */}
      {/* ------------------------------------------------------------------ */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted && !needsGestureToStart}
        onTapToResume={handleTapToResume}
        onRestartExercise={() => {
          setGamePhase(GAME_PHASES.SETUP);
          hasAutoStartedRef.current = false;
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Rotate prompt for iOS/non-PWA */}
      {/* ------------------------------------------------------------------ */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
    </div>
  );
}

export default ArcadeRhythmGame;
