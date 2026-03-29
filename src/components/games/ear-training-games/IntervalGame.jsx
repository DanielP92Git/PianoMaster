/**
 * IntervalGame.jsx
 *
 * Ear training game: child hears two notes played sequentially and identifies
 * the interval as Step, Skip, or Leap.
 *
 * Requirements: INTV-01 through INTV-05
 * Design spec: 09-UI-SPEC.md (D-06, D-07, D-08, D-10)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';

import { useAudioContext } from '../../../contexts/AudioContextProvider';
import { usePianoSampler } from '../../../hooks/usePianoSampler';
import { useSounds } from '../../../features/games/hooks/useSounds';
import { useSessionTimeout } from '../../../contexts/SessionTimeoutContext';
import { useRotatePrompt } from '../../../hooks/useRotatePrompt';
import { useLandscapeLock } from '../../../hooks/useLandscapeLock';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { RotatePromptOverlay } from '../../orientation/RotatePromptOverlay';
import { AudioInterruptedOverlay } from '../shared/AudioInterruptedOverlay.jsx';
import VictoryScreen from '../VictoryScreen';
import BackButton from '../../ui/BackButton';

import {
  generateIntervalQuestion,
  classifyInterval,
  getNotesInBetween,
} from './earTrainingUtils';
import { PianoKeyboardReveal } from './components/PianoKeyboardReveal';
import { getNodeById } from '../../../data/skillTrail';

// ---------------------------------------------------------------------------
// Game phase finite-state machine
// ---------------------------------------------------------------------------
const GAME_PHASES = {
  SETUP: 'setup',
  LISTENING: 'listening',
  CHOOSING: 'choosing',
  FEEDBACK: 'feedback',
  SESSION_COMPLETE: 'session-complete',
};

const TOTAL_QUESTIONS = 10;
const NOTE_DURATION = 0.6;   // seconds per note
const NOTE_GAP = 0.25;       // gap between note1 and note2
const CORRECT_PAUSE_MS = 1500;
const WRONG_PAUSE_MS = 2000;
const DEFAULT_ASCENDING_RATIO = 0.6; // D-10: ~60% ascending first

// ---------------------------------------------------------------------------
// Button state CSS classes (from 09-UI-SPEC.md)
// ---------------------------------------------------------------------------
const STATE_CLASSES = {
  default:
    'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150',
  correct:
    'bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-xl shadow-[0_0_12px_rgba(74,222,128,0.4)] transition-all duration-300',
  wrong:
    'bg-red-500/20 backdrop-blur-md border-2 border-red-400 rounded-xl transition-all duration-300',
  dimmed:
    'opacity-40 pointer-events-none bg-white/10 border border-white/20 rounded-xl',
  disabled:
    'opacity-50 pointer-events-none bg-white/10 border border-white/20 rounded-xl',
};

/**
 * IntervalGame
 *
 * Child hears two piano notes played sequentially, then identifies the
 * interval as Step, Skip, or Leap using three vertically-stacked buttons
 * with inline hints. After answering, a piano keyboard SVG reveals both
 * notes with in-between keys dim-highlighted.
 *
 * INTV-01: Two-note melodic interval via piano synthesis
 * INTV-02: Step/Skip/Leap classification with age-appropriate hints
 * INTV-03: Ascending-first progression (~60% ascending, ~40% mixed)
 * INTV-04: Piano keyboard reveal with in-between highlights + interval label
 * INTV-05: Session of 10 questions → VictoryScreen with star rating + XP
 */
export default function IntervalGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  // --- Orientation prompt ---
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();
  useLandscapeLock();

  // --- Accessibility ---
  const { reducedMotion } = useAccessibility();

  // --- Trail state (from TrailNodeModal navigation) ---
  const nodeId = location.state?.nodeId ?? null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // --- Audio ---
  const { isInterrupted, handleTapToResume, getOrCreateAudioContext } = useAudioContext();
  const { playNote } = usePianoSampler();
  const { playCorrectSound, playWrongSound } = useSounds();

  // --- Session timeout ---
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider — timer controls are no-ops
  }

  // --- Game state ---
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  // { note1, note2, semitones, direction, category }

  const [selectedAnswer, setSelectedAnswer] = useState(null); // 'step' | 'skip' | 'leap'
  const [answerCorrect, setAnswerCorrect] = useState(null);   // boolean
  const [questionScores, setQuestionScores] = useState([]);   // 1 or 0 per question
  const [feedbackText, setFeedbackText] = useState('');

  // Keyboard reveal
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Audio status
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  // Auto-start guard
  const hasAutoStartedRef = useRef(false);

  // Timeout cleanup ref
  const feedbackTimeoutRef = useRef(null);

  // Ascending ratio (can be overridden by nodeConfig)
  const ascendingRatio =
    nodeConfig?.ascendingRatio != null
      ? nodeConfig.ascendingRatio
      : DEFAULT_ASCENDING_RATIO;

  // ---------------------------------------------------------------------------
  // Session timeout: pause during active gameplay
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const activePhases = [GAME_PHASES.LISTENING, GAME_PHASES.CHOOSING];
    const isActive = activePhases.includes(gamePhase);
    if (isActive) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer();
  }, [gamePhase, pauseTimer, resumeTimer]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Play two notes sequentially (INTV-01)
  // ---------------------------------------------------------------------------
  const playInterval = useCallback(
    (question) => {
      if (!question) return;

      let ctx = getOrCreateAudioContext();
      if (!ctx) return;

      isPlayingRef.current = true;
      setIsPlaying(true);

      const now = ctx.currentTime;
      // Note 1 at time now
      playNote(question.note1, { duration: NOTE_DURATION, velocity: 0.75, startTime: now });
      // Note 2 after note1 + gap
      const note2Start = now + NOTE_DURATION + NOTE_GAP;
      playNote(question.note2, { duration: NOTE_DURATION, velocity: 0.75, startTime: note2Start });

      // Total duration: note1 + gap + note2
      const totalDurationMs = (NOTE_DURATION + NOTE_GAP + NOTE_DURATION) * 1000;

      feedbackTimeoutRef.current = setTimeout(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        // Transition to CHOOSING phase after playback
        setGamePhase((prev) => {
          if (prev === GAME_PHASES.LISTENING) return GAME_PHASES.CHOOSING;
          return prev;
        });
      }, totalDurationMs + 200); // +200ms buffer
    },
    [playNote, getOrCreateAudioContext]
  );

  // ---------------------------------------------------------------------------
  // Generate a new question
  // ---------------------------------------------------------------------------
  const generateQuestion = useCallback(
    (qIndex) => {
      const question = generateIntervalQuestion(qIndex, TOTAL_QUESTIONS, ascendingRatio);
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setShowKeyboard(false);
      setFeedbackText('');
      setGamePhase(GAME_PHASES.LISTENING);
    },
    [ascendingRatio]
  );

  // ---------------------------------------------------------------------------
  // LISTENING phase: auto-play when we enter it
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.LISTENING || !currentQuestion) return;
    setFeedbackText(
      t('games.intervalGame.listening', { defaultValue: 'Listen carefully...' })
    );
    playInterval(currentQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per question
  }, [gamePhase, currentQuestion]);

  // ---------------------------------------------------------------------------
  // Replay button handler (available during CHOOSING)
  // ---------------------------------------------------------------------------
  const handleReplay = useCallback(() => {
    if (isPlayingRef.current || gamePhase === GAME_PHASES.FEEDBACK) return;
    if (!currentQuestion) return;
    setFeedbackText(
      t('games.intervalGame.listening', { defaultValue: 'Listen carefully...' })
    );
    playInterval(currentQuestion);
  }, [currentQuestion, gamePhase, playInterval, t]);

  // ---------------------------------------------------------------------------
  // Button state derivation
  // ---------------------------------------------------------------------------
  function getButtonState(buttonId) {
    if (gamePhase === GAME_PHASES.LISTENING) return STATE_CLASSES.disabled;
    if (gamePhase !== GAME_PHASES.FEEDBACK) return STATE_CLASSES.default;
    // In FEEDBACK phase:
    if (buttonId === selectedAnswer) {
      return answerCorrect ? STATE_CLASSES.correct : STATE_CLASSES.wrong;
    }
    // Reveal correct answer if user was wrong
    if (!answerCorrect && buttonId === currentQuestion?.category) {
      return STATE_CLASSES.correct;
    }
    return STATE_CLASSES.dimmed;
  }

  // ---------------------------------------------------------------------------
  // Answer handler
  // ---------------------------------------------------------------------------
  const handleAnswer = useCallback(
    (choice) => {
      if (gamePhase !== GAME_PHASES.CHOOSING || !currentQuestion) return;
      setGamePhase(GAME_PHASES.FEEDBACK);
      setSelectedAnswer(choice);

      const correctAnswer = currentQuestion.category;
      const isCorrect = choice === correctAnswer;
      setAnswerCorrect(isCorrect);
      setShowKeyboard(true);

      if (isCorrect) {
        playCorrectSound();
        setFeedbackText(
          t('games.intervalGame.correct', { defaultValue: 'Correct!' })
        );
        setQuestionScores((prev) => [...prev, 1]);

        feedbackTimeoutRef.current = setTimeout(() => {
          advanceQuestion();
        }, CORRECT_PAUSE_MS);
      } else {
        playWrongSound();
        setFeedbackText(
          t('games.intervalGame.wrong', { defaultValue: 'Try again!' })
        );
        setQuestionScores((prev) => [...prev, 0]);

        feedbackTimeoutRef.current = setTimeout(() => {
          advanceQuestion();
        }, WRONG_PAUSE_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advanceQuestion defined below (stable ref pattern)
    [gamePhase, currentQuestion, playCorrectSound, playWrongSound, t]
  );

  // ---------------------------------------------------------------------------
  // Advance to next question or complete session
  // ---------------------------------------------------------------------------
  const advanceQuestion = useCallback(() => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      setGamePhase(GAME_PHASES.SESSION_COMPLETE);
    } else {
      setQuestionIndex(nextIndex);
      generateQuestion(nextIndex);
    }
  }, [questionIndex, generateQuestion]);

  // ---------------------------------------------------------------------------
  // Auto-start from trail
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      setQuestionIndex(0);
      setQuestionScores([]);
      generateQuestion(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start guarded by hasAutoStartedRef
  }, [nodeConfig]);

  // ---------------------------------------------------------------------------
  // Manual start (non-trail mode)
  // ---------------------------------------------------------------------------
  const handleStartGame = useCallback(() => {
    hasAutoStartedRef.current = true;
    setQuestionIndex(0);
    setQuestionScores([]);
    generateQuestion(0);
  }, [generateQuestion]);

  // ---------------------------------------------------------------------------
  // handleNextExercise — trail exercise routing
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
              navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
              break;
            case 'rhythm_dictation':
              navigate('/rhythm-mode/rhythm-dictation-game', { state: navState, replace: true });
              window.location.reload();
              break;
            case 'pitch_comparison':
              navigate('/ear-training/note-comparison', { state: navState });
              break;
            case 'interval_id':
              navigate('/ear-training/interval-game', { state: navState, replace: true });
              window.location.reload();
              break;
            case 'boss_challenge':
              navigate('/notes-master-mode/sight-reading-game', {
                state: { ...navState, isBoss: true },
              });
              break;
            default:
              navigate('/trail');
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // ---------------------------------------------------------------------------
  // Restart handler
  // ---------------------------------------------------------------------------
  const handleReset = useCallback(() => {
    hasAutoStartedRef.current = false;
    setGamePhase(GAME_PHASES.SETUP);
    setQuestionIndex(0);
    setQuestionScores([]);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setShowKeyboard(false);
    setFeedbackText('');
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  const correctCount = questionScores.filter((s) => s === 1).length;

  // Interval label + subLabel for PianoKeyboardReveal (D-08)
  const intervalLabel = (() => {
    if (!currentQuestion || !showKeyboard) return null;
    const categoryLabel = t(
      `games.intervalGame.${currentQuestion.category}`,
      { defaultValue: currentQuestion.category.toUpperCase() }
    ).toUpperCase();
    return `${categoryLabel} \u2014 ${currentQuestion.note1} to ${currentQuestion.note2}`;
  })();

  const subLabel = (() => {
    if (!currentQuestion || !showKeyboard) return null;
    const between = getNotesInBetween(currentQuestion.note1, currentQuestion.note2);
    if (between.length === 1) {
      return (
        t('games.intervalGame.jumpedOver', { note: between[0] }) ||
        `Jumped over ${between[0]}`
      );
    }
    if (between.length > 1) {
      return (
        t('games.intervalGame.jumpedOverMultiple', { count: between.length }) ||
        `${between.length} notes between`
      );
    }
    return null;
  })();

  // ---------------------------------------------------------------------------
  // Render: SESSION_COMPLETE → VictoryScreen
  // ---------------------------------------------------------------------------
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    return (
      <VictoryScreen
        score={correctCount}
        totalPossibleScore={TOTAL_QUESTIONS}
        onReset={handleReset}
        onExit={() => navigate('/trail')}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType={trailExerciseType}
        onNextExercise={handleNextExercise}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: SETUP phase (non-trail standalone mode)
  // ---------------------------------------------------------------------------
  if (gamePhase === GAME_PHASES.SETUP && !nodeConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        {shouldShowPrompt && (
          <RotatePromptOverlay onDismiss={dismissPrompt} />
        )}
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-white text-center">
            {t('games.intervalGame.title', { defaultValue: 'Interval Game' })}
          </h1>
          <p className="text-white/70 text-center text-sm">
            {t('games.intervalGame.description', {
              defaultValue: 'Listen to two notes and identify how far apart they are.',
            })}
          </p>
          <button
            onClick={handleStartGame}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl px-6 py-3 transition-colors"
          >
            {t('games.intervalGame.startGame', { defaultValue: 'Start Game' })}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: main game (LISTENING / CHOOSING / FEEDBACK)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* iOS rotate prompt */}
      {shouldShowPrompt && (
        <RotatePromptOverlay onDismiss={dismissPrompt} />
      )}

      {/* iOS audio interruption overlay */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={handleReset}
      />

      <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto">

        {/* Header bar */}
        <div className="flex items-center justify-between h-12">
          <BackButton />
          <div className="flex items-center gap-2">
            {/* Progress counter — dir=ltr to prevent digit reversal in RTL */}
            <span dir="ltr" className="text-white/70 text-sm font-rounded">
              {questionIndex + 1} / {TOTAL_QUESTIONS}
            </span>
            {/* Score */}
            <span className="text-indigo-300 text-sm font-rounded">
              {correctCount} ✓
            </span>
          </div>
        </div>

        {/* Audio status row with replay button */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl h-12">
          <div className="flex items-center gap-2">
            <Volume2
              size={20}
              className={isPlaying ? 'text-indigo-300 animate-pulse' : 'text-white/60'}
            />
            {feedbackText ? (
              <span aria-live="polite" className="text-sm text-white/80 font-rounded">
                {feedbackText}
              </span>
            ) : (
              <span className="text-sm text-white/40 font-rounded" aria-hidden="true">
                {gamePhase === GAME_PHASES.CHOOSING
                  ? t('games.intervalGame.playAgain', { defaultValue: 'Play Again' })
                  : ''}
              </span>
            )}
          </div>

          {/* Replay button — visible during LISTENING and CHOOSING */}
          {(gamePhase === GAME_PHASES.LISTENING || gamePhase === GAME_PHASES.CHOOSING) && (
            <button
              onClick={handleReplay}
              disabled={isPlaying}
              aria-label={t('games.intervalGame.playAgain', { defaultValue: 'Play Again' })}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-rounded transition-all ${
                isPlaying
                  ? 'opacity-50 cursor-not-allowed bg-indigo-500/50'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer'
              }`}
            >
              <Volume2 size={16} />
              <span>{t('games.intervalGame.playAgain', { defaultValue: 'Play Again' })}</span>
            </button>
          )}
        </div>

        {/* Question heading */}
        <div className="text-center py-2">
          <h2 className="text-white text-lg font-bold">
            {t('games.intervalGame.question', {
              defaultValue: 'How far apart are the notes?',
            })}
          </h2>
        </div>

        {/* Feedback announcement (sr-only live region for screen readers) */}
        <div aria-live="polite" className="sr-only">
          {feedbackText}
        </div>

        {/* Answer buttons — vertical stack (D-07) */}
        <div className="flex flex-col gap-3 w-full">
          {['step', 'skip', 'leap'].map((choice) => (
            <button
              key={choice}
              onClick={() => handleAnswer(choice)}
              disabled={gamePhase !== GAME_PHASES.CHOOSING}
              className={`w-full min-h-[64px] flex items-center justify-between px-5 rounded-xl ${getButtonState(choice)}`}
              aria-label={`${t(`games.intervalGame.${choice}`, { defaultValue: choice })} — ${t(`games.intervalGame.${choice}Hint`, { defaultValue: '' })}`}
            >
              <span className="text-base font-bold text-white">
                {t(`games.intervalGame.${choice}`, { defaultValue: choice.charAt(0).toUpperCase() + choice.slice(1) })}
              </span>
              <span className="text-sm text-white/60">
                {t(`games.intervalGame.${choice}Hint`, {
                  defaultValue:
                    choice === 'step' ? 'next door' :
                    choice === 'skip' ? 'jump one' :
                    'far apart',
                })}
              </span>
            </button>
          ))}
        </div>

        {/* Piano keyboard reveal (D-08) */}
        {gamePhase === GAME_PHASES.FEEDBACK && currentQuestion && (
          <div aria-live="assertive">
            <PianoKeyboardReveal
              note1={currentQuestion.note1}
              note2={currentQuestion.note2}
              showInBetween={true}
              intervalLabel={intervalLabel}
              subLabel={subLabel}
              visible={showKeyboard}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* Loading state while awaiting first question in trail mode */}
        {gamePhase === GAME_PHASES.SETUP && nodeConfig && (
          <div className="flex items-center justify-center py-8">
            <span className="text-white/60 text-sm animate-pulse">
              {t('games.intervalGame.listening', { defaultValue: 'Loading...' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
