import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown, Volume2 } from "lucide-react";

import { usePianoSampler } from "../../../hooks/usePianoSampler";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay.jsx";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import { PianoKeyboardReveal } from "./components/PianoKeyboardReveal";
import { generateNotePair, getTierForQuestion } from "./earTrainingUtils";
import { getNodeById } from "../../../data/skillTrail";

// ---------------------------------------------------------------------------
// Game phase finite-state machine
// ---------------------------------------------------------------------------
const GAME_PHASES = {
  SETUP: "setup",
  LISTENING: "listening",
  CHOOSING: "choosing",
  FEEDBACK: "feedback",
  SESSION_COMPLETE: "session-complete",
};

const TOTAL_QUESTIONS = 10;
const NOTE_DURATION = 0.6; // seconds per note
const NOTE_GAP = 0.25; // silence between notes
const CORRECT_PAUSE_MS = 1500;
const WRONG_PAUSE_MS = 2000;

// Button state classes (mirroring DictationChoiceCard verbatim)
const STATE_CLASSES = {
  default:
    "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150",
  correct:
    "bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-xl shadow-[0_0_12px_rgba(74,222,128,0.4)] transition-all duration-300",
  wrong:
    "bg-red-500/20 backdrop-blur-md border-2 border-red-400 rounded-xl transition-all duration-300",
  dimmed:
    "opacity-40 pointer-events-none bg-white/10 border border-white/20 rounded-xl",
  disabled:
    "opacity-60 cursor-not-allowed pointer-events-none bg-white/10 border border-white/20 rounded-xl",
};

/**
 * NoteComparisonGame
 *
 * Ear training game where children hear two piano notes and tap HIGHER or LOWER
 * to identify the second note's direction relative to the first (PITCH-01 through PITCH-05).
 *
 * Structural template: RhythmDictationGame.jsx
 */
export default function NoteComparisonGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // --- Trail state (from TrailNodeModal navigation) ---
  const nodeId = location.state?.nodeId ?? null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // --- Audio ---
  const {
    audioContextRef,
    isInterrupted,
    handleTapToResume,
    getOrCreateAudioContext,
  } = useAudioContext();
  const { playNote } = usePianoSampler();
  const { playCorrectSound, playWrongSound } = useSounds();

  // --- Orientation ---
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();
  useLandscapeLock();

  // --- Accessibility ---
  const { reducedMotion } = useAccessibility();

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentPair, setCurrentPair] = useState(null); // { note1, note2, semitones, direction }
  const [selectedAnswer, setSelectedAnswer] = useState(null); // 'higher' | 'lower'
  const [answerCorrect, setAnswerCorrect] = useState(null); // boolean
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Auto-start guard
  const hasAutoStartedRef = useRef(false);
  const feedbackTimeoutRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // playNotePair — schedule two notes via Web Audio API timing (PITCH-01)
  // Async to ensure AudioContext is running before scheduling (trail auto-start
  // mounts a new AudioContext that starts suspended — no user gesture on this page).
  // ---------------------------------------------------------------------------
  const playNotePair = useCallback(
    async (note1, note2, onComplete) => {
      const ctx = audioContextRef.current || getOrCreateAudioContext();
      if (!ctx) {
        onComplete?.();
        return;
      }
      // Ensure AudioContext is running before scheduling oscillators
      if (ctx.state === "suspended" || ctx.state === "interrupted") {
        try {
          await ctx.resume();
        } catch {
          /* browser may block without user gesture */
        }
      }
      const when1 = ctx.currentTime + 0.05;
      const when2 = when1 + NOTE_DURATION + NOTE_GAP;
      playNote(note1, {
        duration: NOTE_DURATION,
        velocity: 0.7,
        startTime: when1,
      });
      playNote(note2, {
        duration: NOTE_DURATION,
        velocity: 0.7,
        startTime: when2,
      });
      const totalMs = (when2 + NOTE_DURATION - ctx.currentTime + 0.2) * 1000;
      feedbackTimeoutRef.current = setTimeout(() => onComplete?.(), totalMs);
    },
    [audioContextRef, playNote, getOrCreateAudioContext]
  );

  // ---------------------------------------------------------------------------
  // startGame — begin a new session (manual or via trail)
  // ---------------------------------------------------------------------------
  const startGame = useCallback(
    (_config) => {
      const tier = getTierForQuestion(0);
      const pair = generateNotePair(tier.minSemitones, tier.maxSemitones);

      setGamePhase(GAME_PHASES.LISTENING);
      setCurrentQuestion(0);
      setCorrectCount(0);
      setCurrentPair(pair);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setShowKeyboard(false);
      pauseTimer();

      playNotePair(pair.note1, pair.note2, () => {
        setGamePhase(GAME_PHASES.CHOOSING);
      });
    },
    [pauseTimer, playNotePair]
  );

  // ---------------------------------------------------------------------------
  // nextQuestion — advance to the next question or complete session
  // ---------------------------------------------------------------------------
  const nextQuestion = useCallback(
    (questionIndex) => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= TOTAL_QUESTIONS) {
        setGamePhase(GAME_PHASES.SESSION_COMPLETE);
        resumeTimer();
        return;
      }

      const tier = getTierForQuestion(nextIndex);
      const pair = generateNotePair(tier.minSemitones, tier.maxSemitones);

      setCurrentQuestion(nextIndex);
      setCurrentPair(pair);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setShowKeyboard(false);
      setGamePhase(GAME_PHASES.LISTENING);

      playNotePair(pair.note1, pair.note2, () => {
        setGamePhase(GAME_PHASES.CHOOSING);
      });
    },
    [resumeTimer, playNotePair]
  );

  // ---------------------------------------------------------------------------
  // handleAnswer — process the user's HIGHER or LOWER selection (PITCH-02)
  // ---------------------------------------------------------------------------
  const handleAnswer = useCallback(
    (answer) => {
      if (gamePhase !== GAME_PHASES.CHOOSING || !currentPair) return;

      const correctAnswer =
        currentPair.direction === "ascending" ? "higher" : "lower";
      const isCorrect = answer === correctAnswer;

      setSelectedAnswer(answer);
      setAnswerCorrect(isCorrect);
      setGamePhase(GAME_PHASES.FEEDBACK);

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        playCorrectSound();
      } else {
        playWrongSound();
      }

      // D-05 reveal sequence: keyboard slides in after 100ms
      feedbackTimeoutRef.current = setTimeout(() => {
        setShowKeyboard(true);
      }, 100);

      const pauseMs = isCorrect ? CORRECT_PAUSE_MS : WRONG_PAUSE_MS;
      feedbackTimeoutRef.current = setTimeout(() => {
        nextQuestion(currentQuestion);
      }, pauseMs);
    },
    [
      gamePhase,
      currentPair,
      currentQuestion,
      playCorrectSound,
      playWrongSound,
      nextQuestion,
    ]
  );

  // ---------------------------------------------------------------------------
  // handleReplay — replay current pair during CHOOSING phase
  // ---------------------------------------------------------------------------
  const handleReplay = useCallback(() => {
    if (gamePhase !== GAME_PHASES.CHOOSING || !currentPair) return;
    playNotePair(currentPair.note1, currentPair.note2);
  }, [gamePhase, currentPair, playNotePair]);

  // ---------------------------------------------------------------------------
  // handleReset — restart the game
  // ---------------------------------------------------------------------------
  const handleReset = useCallback(() => {
    hasAutoStartedRef.current = false;
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentQuestion(0);
    setCorrectCount(0);
    setCurrentPair(null);
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setShowKeyboard(false);
  }, []);

  // ---------------------------------------------------------------------------
  // handleNextExercise — trail exercise routing (mirrors RhythmDictationGame)
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
              navigate("/rhythm-mode/rhythm-reading-game", { state: navState });
              break;
            case "rhythm_dictation":
              navigate("/rhythm-mode/rhythm-dictation-game", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "pitch_comparison":
              navigate("/ear-training-mode/note-comparison-game", {
                state: navState,
              });
              break;
            case "interval_id":
              navigate("/ear-training-mode/interval-game", { state: navState });
              break;
            case "boss_challenge":
              navigate("/notes-master-mode/sight-reading-game", {
                state: { ...navState, isBoss: true },
              });
              break;
            case "arcade_rhythm":
              navigate("/rhythm-mode/arcade-rhythm-game", { state: navState });
              break;
            default:
              navigate("/trail");
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // ---------------------------------------------------------------------------
  // Auto-start from trail (one-time, guarded by hasAutoStartedRef)
  // Reset guard in cleanup so React 18 strict mode double-mount re-triggers.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      startGame(nodeConfig);
    }
    return () => {
      hasAutoStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start guarded by hasAutoStartedRef; only nodeConfig triggers
  }, [nodeConfig]);

  // ---------------------------------------------------------------------------
  // getButtonState — derive visual state for a HIGHER/LOWER button
  // ---------------------------------------------------------------------------
  function getButtonState(buttonId) {
    if (gamePhase === GAME_PHASES.LISTENING) return "disabled";
    if (gamePhase !== GAME_PHASES.FEEDBACK) return "default";
    // In FEEDBACK phase:
    if (buttonId === selectedAnswer) return answerCorrect ? "correct" : "wrong";
    // Reveal the correct answer when user was wrong
    if (currentPair) {
      const correctAnswer =
        currentPair.direction === "ascending" ? "higher" : "lower";
      if (!answerCorrect && buttonId === correctAnswer) return "correct";
    }
    return "dimmed";
  }

  // ---------------------------------------------------------------------------
  // Render: SESSION_COMPLETE — VictoryScreen (PITCH-05)
  // ---------------------------------------------------------------------------
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    return (
      <VictoryScreen
        score={correctCount}
        totalPossibleScore={TOTAL_QUESTIONS}
        onReset={handleReset}
        onExit={() => navigate("/trail")}
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4">
        {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
        <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <h1 className="text-xl font-bold text-white">
            {t("games.noteComparison.title", {
              defaultValue: "Higher or Lower?",
            })}
          </h1>
          <p className="text-sm text-white/70">
            {t("games.noteComparison.description", {
              defaultValue:
                "Listen to two notes and decide which one is higher!",
            })}
          </p>
          <button
            onClick={() => {
              hasAutoStartedRef.current = true;
              startGame(null);
            }}
            className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
          >
            {t("games.noteComparison.startGame", {
              defaultValue: "Start Game",
            })}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: main game (LISTENING / CHOOSING / FEEDBACK)
  // ---------------------------------------------------------------------------
  const higherState = getButtonState("higher");
  const lowerState = getButtonState("lower");

  const directionLabel =
    currentPair?.direction === "ascending"
      ? t("games.noteComparison.reveal.higher", { defaultValue: "HIGHER" })
      : t("games.noteComparison.reveal.lower", { defaultValue: "LOWER" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* iOS rotate prompt */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

      {/* iOS audio interruption overlay */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={handleReset}
      />

      <div className="mx-auto flex max-w-lg flex-col gap-3 p-4">
        {/* Header bar */}
        <div className="flex h-12 items-center justify-between">
          <BackButton
            to={nodeId ? "/trail?path=ear_training" : "/ear-training-mode"}
          />
          <div className="flex items-center gap-2">
            {/* Progress counter — dir=ltr to prevent digit reversal in RTL */}
            <span dir="ltr" className="font-rounded text-sm text-white/70">
              {currentQuestion + 1} / {TOTAL_QUESTIONS}
            </span>
            {/* Score */}
            <span className="font-rounded text-sm text-indigo-300">
              {correctCount} ✓
            </span>
          </div>
        </div>

        {/* Audio status row */}
        <div className="flex h-12 items-center justify-between rounded-xl bg-white/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <Volume2
              size={20}
              className={
                gamePhase === GAME_PHASES.LISTENING
                  ? "animate-pulse text-indigo-300"
                  : "text-white/60"
              }
            />
            {gamePhase === GAME_PHASES.LISTENING && (
              <span
                aria-live="polite"
                className="font-rounded text-sm text-white/80"
              >
                {t("games.noteComparison.listening", {
                  defaultValue: "Listen...",
                })}
              </span>
            )}
          </div>

          {/* Replay button — visible during CHOOSING phase */}
          {gamePhase === GAME_PHASES.CHOOSING && (
            <button
              onClick={handleReplay}
              aria-label={t("games.noteComparison.playAgain", {
                defaultValue: "Play Again",
              })}
              className="flex cursor-pointer items-center gap-1 rounded-xl bg-indigo-500 px-4 py-2 font-rounded text-sm text-white transition-all hover:bg-indigo-400"
            >
              <Volume2 size={20} />
              <span>
                {t("games.noteComparison.playAgain", {
                  defaultValue: "Play Again",
                })}
              </span>
            </button>
          )}
        </div>

        {/* Question prompt */}
        <div className="py-2 text-center">
          <p className="font-rounded text-base text-white/80">
            {t("games.noteComparison.question", {
              defaultValue: "Is the second note higher or lower?",
            })}
          </p>
        </div>

        {/* HIGHER / LOWER answer buttons */}
        <div className="grid w-full grid-cols-2 gap-3">
          {/* HIGHER button */}
          <button
            onClick={() => handleAnswer("higher")}
            disabled={
              gamePhase === GAME_PHASES.LISTENING ||
              gamePhase === GAME_PHASES.FEEDBACK
            }
            aria-label={t("games.noteComparison.higher", {
              defaultValue: "Higher",
            })}
            className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-1 ${STATE_CLASSES[higherState]}`}
          >
            <ArrowUp size={28} className="text-white" />
            <span className="text-base font-bold text-white">
              {t("games.noteComparison.higher", { defaultValue: "HIGHER" })}
            </span>
          </button>

          {/* LOWER button */}
          <button
            onClick={() => handleAnswer("lower")}
            disabled={
              gamePhase === GAME_PHASES.LISTENING ||
              gamePhase === GAME_PHASES.FEEDBACK
            }
            aria-label={t("games.noteComparison.lower", {
              defaultValue: "Lower",
            })}
            className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-1 ${STATE_CLASSES[lowerState]}`}
          >
            <ArrowDown size={28} className="text-white" />
            <span className="text-base font-bold text-white">
              {t("games.noteComparison.lower", { defaultValue: "LOWER" })}
            </span>
          </button>
        </div>

        {/* FEEDBACK phase: keyboard reveal + direction label (PITCH-04) */}
        {gamePhase === GAME_PHASES.FEEDBACK && currentPair && (
          <div className="mt-2 flex flex-col items-center gap-3">
            {/* Screen-reader feedback announcement */}
            <div aria-live="assertive" className="sr-only">
              {answerCorrect
                ? t("games.noteComparison.correct", {
                    defaultValue: "Correct!",
                  })
                : t("games.noteComparison.wrong", {
                    defaultValue: "Try again!",
                  })}
            </div>

            {/* Piano keyboard slides in from bottom (D-05) */}
            <PianoKeyboardReveal
              note1={currentPair.note1}
              note2={currentPair.note2}
              showInBetween={false}
              visible={showKeyboard}
              reducedMotion={reducedMotion}
            />

            {/* Direction label (text-3xl bold per UI-SPEC) */}
            {showKeyboard && (
              <div className="flex animate-floatUp flex-col items-center gap-1">
                <span
                  aria-live="polite"
                  className="text-3xl font-bold text-white"
                >
                  {directionLabel}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading state while trail auto-starts */}
        {gamePhase === GAME_PHASES.SETUP && nodeConfig && (
          <div className="flex items-center justify-center py-8">
            <span className="animate-pulse text-sm text-white/60">
              {t("games.noteComparison.listening", {
                defaultValue: "Loading...",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
