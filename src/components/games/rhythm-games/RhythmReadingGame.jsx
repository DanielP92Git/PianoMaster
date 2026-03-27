import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAudioContext } from '../../../contexts/AudioContextProvider';
import { usePianoSampler } from '../../../hooks/usePianoSampler';
import { useSounds } from '../../../features/games/hooks/useSounds';
import { useSessionTimeout } from '../../../contexts/SessionTimeoutContext';
import { useLandscapeLock } from '../../../hooks/useLandscapeLock';
import { useRotatePrompt } from '../../../hooks/useRotatePrompt';
import { RotatePromptOverlay } from '../../orientation/RotatePromptOverlay';
import { AudioInterruptedOverlay } from '../shared/AudioInterruptedOverlay';
import VictoryScreen from '../VictoryScreen';
import BackButton from '../../ui/BackButton';
import { getNodeById } from '../../../data/skillTrail';
import { getPattern, TIME_SIGNATURES } from './RhythmPatternGenerator';
import {
  binaryPatternToBeats,
} from './utils/rhythmVexflowHelpers';
import {
  schedulePatternPlayback,
} from './utils/rhythmTimingUtils';
import { scoreTap } from './utils/rhythmScoringUtils';
import RhythmStaffDisplay from './components/RhythmStaffDisplay';
import FloatingFeedback from './components/FloatingFeedback';
import CountdownOverlay from './components/CountdownOverlay';
import { MetronomeDisplay } from './components';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

// Game phases FSM
const GAME_PHASES = {
  SETUP: 'setup',
  COUNT_IN: 'count-in',
  PLAYING: 'playing',
  FEEDBACK: 'feedback',
  SESSION_COMPLETE: 'session-complete',
};

/**
 * RhythmReadingGame
 *
 * Tap-along rhythm game where children synchronize taps to visual notation.
 * Shows VexFlow-rendered rhythm pattern, sweeping cursor, and scores
 * each tap PERFECT/GOOD/MISS using AudioContext.currentTime.
 *
 * RTAP-01: VexFlow rhythm notation (1 measure, b/4 notes, stems up)
 * RTAP-02: Indigo cursor sweeps left-to-right synced to audioContext.currentTime
 * RTAP-03: Count-in plays audio clicks + visual 3-2-1-GO
 * RTAP-04: Taps scored via audioContext.currentTime with tempo-scaled thresholds
 * RTAP-05: Session of 10 exercises completes through VictoryScreen
 */
export function RhythmReadingGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Trail state extraction from location.state
  const nodeId = location.state?.nodeId ?? null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // Audio contexts
  const { audioContextRef, isInterrupted, handleTapToResume } = useAudioContext();
  const { playNote } = usePianoSampler();
  useSounds(); // Loaded for potential future use (correct/wrong sounds for post-exercise feedback)

  // Accessibility context for reducedMotion (safe outside AccessibilityProvider in tests)
  let reducedMotion = false;
  try {
    const a11y = useAccessibility();
    reducedMotion = a11y?.reducedMotion ?? false;
  } catch {
    // Not in AccessibilityProvider — reducedMotion defaults to false
  }

  // Session timeout controls
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider — timer controls are no-ops
  }

  // Extract config from nodeConfig or use defaults
  const tempo = nodeConfig?.tempo ?? nodeConfig?.config?.tempo ?? 80;
  const timeSignatureStr = nodeConfig?.timeSignature ?? nodeConfig?.config?.timeSignature ?? '4/4';
  const difficulty = nodeConfig?.difficulty ?? nodeConfig?.config?.difficulty ?? 'beginner';

  // Get TIME_SIGNATURES object for MetronomeDisplay
  const getTimeSignatureObject = useCallback((timeSigStr) => {
    const mapping = {
      '4/4': TIME_SIGNATURES.FOUR_FOUR,
      '3/4': TIME_SIGNATURES.THREE_FOUR,
      '2/4': TIME_SIGNATURES.TWO_FOUR,
      '6/8': TIME_SIGNATURES.SIX_EIGHT,
    };
    return mapping[timeSigStr] ?? TIME_SIGNATURES.FOUR_FOUR;
  }, []);

  const timeSignatureObj = getTimeSignatureObject(timeSignatureStr);

  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [currentExercise, setCurrentExercise] = useState(0);
  const totalExercises = 10; // D-02: 10 exercises per session
  const [currentBeats, setCurrentBeats] = useState(null);
  const [tapResults, setTapResults] = useState([]);
  const [exerciseScores, setExerciseScores] = useState([]);
  const [countdownValue, setCountdownValue] = useState(null);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(1); // for MetronomeDisplay

  // Refs for timing and animation (not state — no re-renders on updates)
  const cursorDivRef = useRef(null); // passed to RhythmStaffDisplay
  const patternStartTimeRef = useRef(0);
  const scheduledBeatTimesRef = useRef([]); // AudioContext times for each beat onset
  const nextBeatIndexRef = useRef(0);
  const rafIdRef = useRef(null);
  const measureDurationRef = useRef(0); // total measure duration in seconds
  const countdownTimeoutsRef = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const hasAutoStartedRef = useRef(false); // auto-start guard pattern

  // Pause/resume session timer based on game phase
  useEffect(() => {
    const activePhases = [GAME_PHASES.COUNT_IN, GAME_PHASES.PLAYING];
    if (activePhases.includes(gamePhase)) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer();
  }, [gamePhase, pauseTimer, resumeTimer]);

  // Auto-start from trail node (hasAutoStartedRef guard)
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      const ctx = audioContextRef.current;
      // IOS-02: If AudioContext needs a gesture to resume, defer
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
        return;
      }
      hasAutoStartedRef.current = true;
      setTimeout(() => startGame(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start effect guarded by hasAutoStartedRef; only nodeConfig changes should re-evaluate
  }, [nodeConfig]);

  // Reset guard when nodeId changes (navigating between trail nodes)
  useEffect(() => {
    hasAutoStartedRef.current = false;
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentExercise(0);
    setCurrentBeats(null);
    setTapResults([]);
    setExerciseScores([]);
    cancelAllTimers();
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup RAF and timers on unmount
  useEffect(() => {
    return () => {
      cancelAllTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  /**
   * Build scheduled beat times array from beats and tempo.
   * Returns array of AudioContext times for each non-rest beat onset.
   */
  const buildBeatTimes = useCallback((beats, bpm, startTime) => {
    const beatDuration = 60 / bpm; // seconds per quarter note
    const sixteenthDuration = beatDuration / 4;
    const times = [];
    let offset = 0;

    beats.forEach((beat) => {
      if (!beat.isRest) {
        times.push(startTime + offset);
      }
      offset += sixteenthDuration * beat.durationUnits;
    });

    return { times, totalDuration: offset };
  }, []);

  /**
   * Play a short tap click sound (D-05).
   * 900Hz sine burst, 15ms, 0.2 gain.
   */
  const playTapClick = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
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

  /**
   * Play metronome click for count-in.
   * Downbeat (beat 1): 900Hz, 0.15 gain. Other beats: 700Hz, 0.1 gain.
   */
  const playMetronomeClick = useCallback((time, isDownbeat) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = isDownbeat ? 900 : 700;
      const vol = isDownbeat ? 0.15 : 0.10;

      osc.type = 'sine';
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
  }, [audioContextRef]);

  /**
   * Fetch a new pattern and convert to beats array.
   * Returns { beats, binaryPattern } or null on failure.
   */
  const fetchNewPattern = useCallback(async () => {
    try {
      const result = await getPattern(timeSignatureStr, difficulty);
      if (!result || !result.pattern) return null;
      const beats = binaryPatternToBeats(result.pattern);
      return { beats, binaryPattern: result.pattern };
    } catch (err) {
      console.warn('[RhythmReadingGame] fetchNewPattern error:', err);
      return null;
    }
  }, [timeSignatureStr, difficulty]);

  /**
   * Start count-in phase: schedule metronome clicks and visual countdown.
   * After count-in, automatically starts the playing phase.
   */
  const startCountIn = useCallback((beats) => {
    setGamePhase(GAME_PHASES.COUNT_IN);
    setCountdownValue(3);
    setTapResults([]);

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const beatDuration = 60 / tempo; // seconds per beat
    const beatsPerMeasure = timeSignatureObj.beats ?? 4;
    const now = ctx.currentTime;

    // Schedule metronome clicks for count-in measure
    for (let i = 0; i < beatsPerMeasure; i++) {
      const clickTime = now + i * beatDuration;
      playMetronomeClick(clickTime, i === 0);
    }

    // Visual countdown: 3 → 2 → 1 → GO → null
    const countdownSequence = [3, 2, 1, 'GO'];
    countdownSequence.forEach((value, idx) => {
      const timeoutId = setTimeout(
        () => {
          setCountdownValue(value);
          // Update MetronomeDisplay beat
          setCurrentBeat(idx + 1);
        },
        idx * beatDuration * 1000
      );
      countdownTimeoutsRef.current.push(timeoutId);
    });

    // After full count-in measure, start playing
    const playingTimeoutId = setTimeout(() => {
      setCountdownValue(null);
      startPlaying(beats);
    }, beatsPerMeasure * beatDuration * 1000);
    countdownTimeoutsRef.current.push(playingTimeoutId);
  }, [audioContextRef, tempo, timeSignatureObj, playMetronomeClick]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Start playing phase: schedule pattern audio, start cursor RAF loop, enable tapping.
   */
  const startPlaying = useCallback((beats) => {
    setGamePhase(GAME_PHASES.PLAYING);
    nextBeatIndexRef.current = 0;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume context if suspended (iOS safety)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Small buffer so audio scheduler has time to fire first note
    const playbackStartTime = ctx.currentTime + 0.05;
    patternStartTimeRef.current = playbackStartTime;

    // Schedule pattern audio (playNote for each non-rest beat per D-13)
    const { totalDuration } = schedulePatternPlayback(
      beats,
      tempo,
      ctx,
      playNote
    );
    measureDurationRef.current = totalDuration;

    // Pre-compute scheduled beat times for scoring
    const { times } = buildBeatTimes(beats, tempo, playbackStartTime);
    scheduledBeatTimesRef.current = times;

    // Start MetronomeDisplay beat updates
    const beatDuration = 60 / tempo;
    const beatsPerMeasure = timeSignatureObj.beats ?? 4;
    let lastBeatUpdate = -1;

    // RAF cursor sweep loop
    function updateCursor() {
      const context = audioContextRef.current;
      if (!context) return;

      const elapsed = context.currentTime - patternStartTimeRef.current;
      const total = measureDurationRef.current;
      if (total <= 0) return;

      const progress = Math.min(elapsed / total, 1);

      // Update cursor position directly via DOM (avoids React re-render on every frame)
      if (cursorDivRef.current) {
        cursorDivRef.current.style.left = `${progress * 100}%`;
      }

      // Update MetronomeDisplay beat indicator
      const beatIdx = Math.floor(elapsed / beatDuration) % beatsPerMeasure;
      const beatNumber = beatIdx + 1;
      if (beatNumber !== lastBeatUpdate) {
        lastBeatUpdate = beatNumber;
        setCurrentBeat(beatNumber);
      }

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(updateCursor);
      } else {
        // Pattern complete — transition to feedback phase
        rafIdRef.current = null;
        transitionToFeedback(beats);
      }
    }

    rafIdRef.current = requestAnimationFrame(updateCursor);
  }, [audioContextRef, tempo, timeSignatureObj, playNote, buildBeatTimes]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle pointer-down tap on the tap area (D-04, D-05, RTAP-04).
   */
  const handleTap = useCallback(() => {
    if (gamePhase !== GAME_PHASES.PLAYING) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // D-05: tactile audio feedback click
    playTapClick();

    const tapTime = ctx.currentTime;
    const beats = currentBeats;

    if (!beats || scheduledBeatTimesRef.current.length === 0) return;

    const { quality, noteIdx, newNextBeatIndex } = scoreTap(
      tapTime,
      scheduledBeatTimesRef.current,
      nextBeatIndexRef.current,
      tempo
    );

    // Advance next beat index to prevent double-scoring
    nextBeatIndexRef.current = newNextBeatIndex;

    // Update tap results for note color updates in RhythmStaffDisplay
    setTapResults((prev) => {
      // Replace any existing result for this noteIdx
      const updated = prev.filter((r) => r.noteIdx !== noteIdx);
      updated.push({ noteIdx, quality });
      return updated;
    });

    // Trigger FloatingFeedback animation
    setLatestFeedback(quality);
    setFeedbackKey((k) => k + 1);
  }, [gamePhase, audioContextRef, currentBeats, tempo, playTapClick]);

  /**
   * Transition to feedback phase after pattern completes.
   */
  const transitionToFeedback = useCallback((beats) => {
    setGamePhase(GAME_PHASES.FEEDBACK);

    // Calculate exercise score: (PERFECT*3 + GOOD*1) / (totalBeats*3) * 100
    setTapResults((currentTapResults) => {
      const nonRestBeats = (beats || []).filter((b) => !b.isRest).length;
      const maxPoints = nonRestBeats * 3;
      let earned = 0;
      currentTapResults.forEach(({ quality }) => {
        if (quality === 'PERFECT') earned += 3;
        else if (quality === 'GOOD') earned += 1;
      });
      const score = maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;

      setExerciseScores((prev) => {
        const updated = [...prev, score];

        // Check if session complete
        feedbackTimeoutRef.current = setTimeout(() => {
          if (updated.length >= totalExercises) {
            setGamePhase(GAME_PHASES.SESSION_COMPLETE);
          } else {
            // Load next pattern and start count-in
            setCurrentExercise((ex) => ex + 1);
            fetchAndStartNextExercise();
          }
        }, 1000);

        return updated;
      });

      return currentTapResults;
    });
  }, [totalExercises, fetchAndStartNextExercise]);

  /**
   * Fetch next pattern and start count-in.
   */
  const fetchAndStartNextExercise = useCallback(async () => {
    const result = await fetchNewPattern();
    if (result) {
      setCurrentBeats(result.beats);
      setTapResults([]);
      startCountIn(result.beats);
    }
  }, [fetchNewPattern, startCountIn]);

  /**
   * Start a new game session (from SETUP or after victory).
   */
  const startGame = useCallback(async () => {
    cancelAllTimers();
    setCurrentExercise(0);
    setExerciseScores([]);
    setTapResults([]);

    const result = await fetchNewPattern();
    if (result) {
      setCurrentBeats(result.beats);
      startCountIn(result.beats);
    }
  }, [cancelAllTimers, fetchNewPattern, startCountIn]);

  /**
   * Handle next exercise routing for trail mode.
   * Follows MetronomeTrainer.handleNextExercise pattern exactly.
   */
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
            case 'note_recognition':
              navigate('/notes-master-mode/notes-recognition-game', { state: navState });
              break;
            case 'sight_reading':
              navigate('/notes-master-mode/sight-reading-game', { state: navState });
              break;
            case 'memory_game':
              navigate('/notes-master-mode/memory-game', { state: navState });
              break;
            case 'rhythm':
              navigate('/rhythm-mode/metronome-trainer', { state: navState, replace: true });
              window.location.reload();
              break;
            case 'rhythm_reading':
              navigate('/rhythm-mode/rhythm-reading-game', { state: navState, replace: true });
              window.location.reload();
              break;
            case 'boss_challenge':
              navigate('/notes-master-mode/sight-reading-game', { state: { ...navState, isBoss: true } });
              break;
            default:
              navigate('/trail');
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // Calculate final scores for VictoryScreen
  const totalScore = exerciseScores.reduce((sum, s) => sum + s, 0);
  const totalPossibleScore = totalExercises * 100;

  // Render VictoryScreen when session complete
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
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
        onExit={() => navigate('/trail')}
      />
    );
  }

  const isPlaying = gamePhase === GAME_PHASES.PLAYING;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex flex-col"
      dir="ltr"
    >
      {/* Header bar */}
      <header className="flex h-12 items-center justify-between px-4 py-2 text-white/80">
        <BackButton />
        <div className="text-sm font-medium">
          {t('games.rhythmReading.title')} &mdash;{' '}
          <span dir="ltr">
            {currentExercise + 1} / {totalExercises}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {/* VexFlow Staff Display */}
        <div style={{ position: 'relative' }}>
          <RhythmStaffDisplay
            beats={currentBeats}
            timeSignature={timeSignatureStr}
            cursorProgress={0} // cursor is controlled directly via cursorDivRef
            tapResults={tapResults}
            showCursor={isPlaying || gamePhase === GAME_PHASES.COUNT_IN}
            reducedMotion={reducedMotion}
          />
          {/* Cursor div - passed via ref to be updated by RAF without React re-renders */}
          <div
            ref={cursorDivRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '16px', // inside the card padding
              left: '0%',
              width: '2px',
              height: 'calc(100% - 32px)',
              backgroundColor: 'rgb(129, 140, 248)',
              opacity: isPlaying ? 0.8 : 0,
              boxShadow: reducedMotion ? 'none' : '0 0 8px rgba(129,140,248,0.8)',
              pointerEvents: 'none',
              zIndex: 10,
              transition: isPlaying ? 'none' : 'opacity 0.2s',
            }}
          />
        </div>

        {/* MetronomeDisplay beat circles */}
        <div className="flex justify-center">
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={timeSignatureObj}
            isActive={gamePhase === GAME_PHASES.COUNT_IN || isPlaying}
            isCountIn={gamePhase === GAME_PHASES.COUNT_IN}
          />
        </div>

        {/* Tap area */}
        <div
          className="relative flex-1"
          style={{ position: 'relative', minHeight: '120px' }}
        >
          <button
            onPointerDown={isPlaying ? handleTap : undefined}
            disabled={!isPlaying}
            aria-label={t('games.rhythmReading.tapArea.tapHere')}
            className={`flex h-full max-h-96 w-full items-center justify-center rounded-3xl bg-white/10 border border-white/20 text-white font-bold text-xl transition-transform duration-75
              ${isPlaying
                ? 'cursor-pointer hover:bg-white/20 active:scale-95'
                : 'opacity-50 cursor-not-allowed'
              }`}
            style={{ minHeight: '120px' }}
          >
            {gamePhase === GAME_PHASES.SETUP
              ? t('games.actions.start')
              : isPlaying
                ? t('games.rhythmReading.tapArea.tapHere')
                : gamePhase === GAME_PHASES.COUNT_IN
                  ? '...'
                  : gamePhase === GAME_PHASES.FEEDBACK
                    ? '...'
                    : t('games.rhythmReading.tapArea.tapHere')
            }
          </button>

          {/* Floating PERFECT/GOOD/MISS feedback */}
          <FloatingFeedback
            quality={latestFeedback}
            feedbackKey={feedbackKey}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Setup screen Start button */}
        {gamePhase === GAME_PHASES.SETUP && (
          <div className="flex justify-center pb-4">
            <button
              onClick={startGame}
              className="rounded-xl bg-indigo-500 px-8 py-3 font-bold text-white hover:bg-indigo-400 transition-colors"
            >
              {t('games.actions.start', 'Start Game')}
            </button>
          </div>
        )}
      </main>

      {/* Countdown overlay */}
      <CountdownOverlay
        countdownValue={countdownValue}
        reducedMotion={reducedMotion}
      />

      {/* iOS audio interrupted overlay */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={() => {
          setGamePhase(GAME_PHASES.SETUP);
          hasAutoStartedRef.current = false;
        }}
      />

      {/* Rotate prompt for iOS/non-PWA */}
      {shouldShowPrompt && (
        <RotatePromptOverlay onDismiss={dismissPrompt} />
      )}
    </div>
  );
}

export default RhythmReadingGame;
