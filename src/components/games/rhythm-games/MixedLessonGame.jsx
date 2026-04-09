/**
 * MixedLessonGame.jsx
 *
 * Duolingo-style unified lesson engine. Plays through a pre-authored sequence
 * of interleaved question types (visual recognition, syllable matching) in one
 * continuous session. Progress bar replaces dots. Crossfade between question types.
 * Trail-only — launched via location.state from TrailNodeModal.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  generateQuestions,
  ALL_DURATION_CODES,
} from "./utils/durationInfo";
import VisualRecognitionQuestion from "./renderers/VisualRecognitionQuestion";
import SyllableMatchingQuestion from "./renderers/SyllableMatchingQuestion";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import { getNodeById } from "../../../data/skillTrail";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { useMotionTokens } from "../../../utils/useMotionTokens";

const GAME_STATES = {
  IDLE: "idle",
  IN_PROGRESS: "in_progress",
  FEEDBACK: "feedback",
  COMPLETE: "complete",
};

const CORRECT_DELAY = 800;
const WRONG_DELAY = 1200;

export default function MixedLessonGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");
  const { reduce: reducedMotion } = useMotionTokens();

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Trail navigation state
  const nodeConfig = location.state?.nodeConfig || null;
  const nodeId = location.state?.nodeId || null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // Sounds
  const { playCorrectSound, playWrongSound } = useSounds();

  // Session timeout controls — use refs to avoid re-render cycles
  const pauseTimerRef = useRef(() => {});
  const resumeTimerRef = useRef(() => {});
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimerRef.current = sessionTimeout.pauseTimer;
    resumeTimerRef.current = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider, timer controls are no-ops
  }
  const pauseTimer = useCallback((...a) => pauseTimerRef.current(...a), []);
  const resumeTimer = useCallback((...a) => resumeTimerRef.current(...a), []);

  // Game state
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [questions, setQuestions] = useState([]); // Pre-generated: { type, correct, choices }[]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]); // boolean[] per question
  const [cardStates, setCardStates] = useState([
    "default",
    "default",
    "default",
    "default",
  ]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [fadeKey, setFadeKey] = useState(0); // Increment on question type change for crossfade

  // Landscape detection
  const [isLandscape, setIsLandscape] = useState(false);

  // Auto-start guard
  const hasAutoStartedRef = useRef(false);
  const feedbackTimerRef = useRef(null);

  // Landscape media query
  useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)");
    setIsLandscape(mql.matches);
    const handler = (e) => setIsLandscape(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Build duration pool from node's rhythmConfig (NOT from nodeConfig — per Pitfall 3)
  const buildDurationPool = useCallback(() => {
    if (!nodeId) return [];
    const node = getNodeById(nodeId);
    if (!node?.rhythmConfig) return [];
    const rc = node.rhythmConfig;
    const focus = rc.focusDurations || [];
    const context = rc.contextDurations || [];
    // Use focusDurations if non-empty, otherwise fall back to durations
    if (focus.length > 0) {
      return [...new Set([...focus, ...context])];
    }
    return rc.durations || [];
  }, [nodeId]);

  // Start game — pre-generate all questions from authored sequence (D-06, D-07, D-08, D-09)
  const startGame = useCallback(() => {
    const pool = buildDurationPool();
    if (pool.length === 0) return;

    const questionSequence = nodeConfig?.questions || [];
    if (questionSequence.length === 0) return;

    // Generate one question per authored entry — 1:1 mapping (D-09: pre-structured, not random)
    const allQuestions = questionSequence.map((entry) => {
      const dedupSyllables = entry.type === "syllable_matching";
      const generated = generateQuestions(pool, ALL_DURATION_CODES, 1, {
        dedupSyllables,
      });
      return { type: entry.type, ...generated[0] };
    });

    setQuestions(allQuestions);
    setCurrentIndex(0);
    setResults([]);
    setCardStates(["default", "default", "default", "default"]);
    setFeedbackMessage("");
    setFadeKey(0);
    setGameState(GAME_STATES.IN_PROGRESS);
    pauseTimer();
  }, [buildDurationPool, nodeConfig, pauseTimer]);

  // Trail auto-start (hasAutoStartedRef pattern, same as existing games)
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start guarded by hasAutoStartedRef
  }, [nodeConfig]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      resumeTimer();
    };
  }, [resumeTimer]);

  // Handle card selection — core answer handling (D-12, D-13)
  const handleSelect = useCallback(
    (cardIndex) => {
      if (gameState !== GAME_STATES.IN_PROGRESS) return;

      const currentQuestion = questions[currentIndex];
      const isCorrect =
        currentQuestion.choices[cardIndex] === currentQuestion.correct;

      setResults((prev) => [...prev, isCorrect]);

      // Sound (D-13)
      if (isCorrect) {
        playCorrectSound();
        setFeedbackMessage(t("game.feedback.correct", "Correct!"));
      } else {
        playWrongSound();
        setFeedbackMessage(
          t(
            "game.feedback.wrong",
            "Not quite \u2014 the correct answer is highlighted"
          )
        );
      }

      // Card states (same logic as standalone games)
      const newStates = currentQuestion.choices.map((choice, i) => {
        if (i === cardIndex) return isCorrect ? "correct" : "wrong";
        if (!isCorrect && choice === currentQuestion.correct) return "correct";
        return "dimmed";
      });
      setCardStates(newStates);
      setGameState(GAME_STATES.FEEDBACK);

      // Auto-advance with crossfade (D-11, D-14)
      const delay = isCorrect ? CORRECT_DELAY : WRONG_DELAY;
      feedbackTimerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          setGameState(GAME_STATES.COMPLETE);
          resumeTimer();
        } else {
          // Crossfade: increment fadeKey when question TYPE changes (D-11)
          const typeChanged =
            questions[nextIndex].type !== currentQuestion.type;
          if (typeChanged) {
            setFadeKey((k) => k + 1);
          }
          setCurrentIndex(nextIndex);
          setCardStates(["default", "default", "default", "default"]);
          setFeedbackMessage("");
          setGameState(GAME_STATES.IN_PROGRESS);
        }
      }, delay);
    },
    [
      gameState,
      questions,
      currentIndex,
      playCorrectSound,
      playWrongSound,
      resumeTimer,
      t,
    ]
  );

  // Reset game
  const handleReset = useCallback(() => {
    hasAutoStartedRef.current = false;
    startGame();
  }, [startGame]);

  // Exit to trail
  const handleExit = useCallback(() => {
    navigate("/trail");
  }, [navigate]);

  // Error guard — no nodeId or nodeConfig
  if (!nodeId || !nodeConfig) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4">
        <div className="max-w-sm rounded-xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-md">
          <p className="mb-4 text-lg text-white">
            {t(
              "game.error.generic",
              "Something went wrong. Go back to the trail and try again."
            )}
          </p>
          <BackButton />
        </div>
      </div>
    );
  }

  // VictoryScreen (D-12: score = results.filter(Boolean).length)
  if (gameState === GAME_STATES.COMPLETE) {
    return (
      <VictoryScreen
        score={results.filter(Boolean).length}
        totalPossibleScore={questions.length}
        onReset={handleReset}
        onExit={handleExit}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType={trailExerciseType}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  // Renderer selection — map question type to renderer component (T-25-04 mitigation)
  const rendererProps = {
    question: currentQuestion,
    cardStates,
    isLandscape,
    onSelect: handleSelect,
    disabled: gameState === GAME_STATES.FEEDBACK,
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "visual_recognition":
        return <VisualRecognitionQuestion {...rendererProps} />;
      case "syllable_matching":
        return <SyllableMatchingQuestion {...rendererProps} />;
      default:
        return null;
    }
  };

  // Progress bar (D-10, UI-SPEC section 2)
  const renderProgressBar = () => (
    <div className="flex flex-1 items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-valuenow={currentIndex}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-label={t("mixedLesson.progressLabel", "Lesson progress")}
      >
        <div
          className={`h-full rounded-full bg-green-400${reducedMotion ? "" : " transition-[width] duration-300 ease-in-out"}`}
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-sm font-bold text-white/70">
        {currentIndex}/{questions.length}
      </span>
    </div>
  );

  // Landscape layout
  if (isLandscape) {
    return (
      <div
        className={`fixed inset-0 flex flex-col overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4${reducedMotion ? "" : " animate-fadeIn"}`}
      >
        {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
        <div aria-live="polite" className="sr-only">
          {feedbackMessage}
        </div>

        {/* Top bar */}
        <div className="mb-4 flex items-center gap-4">
          <BackButton />
          {renderProgressBar()}
        </div>

        {/* Question area with crossfade */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            key={fadeKey}
            className={`flex w-full flex-col items-center gap-4${reducedMotion ? "" : " animate-fadeIn"}`}
          >
            {renderQuestion()}
          </div>
        </div>
      </div>
    );
  }

  // Portrait layout
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4${reducedMotion ? "" : " animate-fadeIn"}`}
    >
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
      <div aria-live="polite" className="sr-only">
        {feedbackMessage}
      </div>

      {/* Top bar */}
      <div className="mb-4 flex w-full items-center gap-4">
        <BackButton />
        {renderProgressBar()}
      </div>

      {/* Question area with crossfade */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div
          key={fadeKey}
          className={`flex w-full flex-col items-center gap-6${reducedMotion ? "" : " animate-fadeIn"}`}
        >
          {renderQuestion()}
        </div>
      </div>
    </div>
  );
}
