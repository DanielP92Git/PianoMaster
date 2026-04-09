/**
 * SyllableMatchingGame.jsx
 *
 * Quiz game: Shows a large SVG note + "What syllable is this?" prompt.
 * Child picks the correct Kodaly syllable from 4 text cards.
 * 5 questions per exercise. Trail-only.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  generateQuestions,
  DURATION_INFO,
  ALL_DURATION_CODES,
} from "./utils/durationInfo";
import DurationCard, { SVG_COMPONENTS } from "./components/DurationCard";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import { getNodeById } from "../../../data/skillTrail";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import {
  SYLLABLE_MAP_EN,
  SYLLABLE_MAP_HE,
  REST_SYLLABLE_EN,
  REST_SYLLABLE_HE,
} from "./utils/rhythmVexflowHelpers";

const GAME_STATES = {
  IDLE: "idle",
  IN_PROGRESS: "in_progress",
  FEEDBACK: "feedback",
  COMPLETE: "complete",
};

const QUESTION_COUNT = 5;
const CORRECT_DELAY = 800;
const WRONG_DELAY = 1200;

export default function SyllableMatchingGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("common");
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

  // Quiz state
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [_selectedIndex, _setSelectedIndex] = useState(null);
  const [results, setResults] = useState([]);
  const [cardStates, setCardStates] = useState([
    "default",
    "default",
    "default",
    "default",
  ]);
  const [feedbackMessage, setFeedbackMessage] = useState("");

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

  // Syllable lookup helper
  const getSyllable = useCallback(
    (code) => {
      const info = DURATION_INFO[code];
      if (!info) return code;
      const lang = i18n.language;
      if (info.isRest)
        return lang === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
      const map = lang === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
      return map[info.durationUnits] || code;
    },
    [i18n.language]
  );

  // Build duration pool from nodeConfig
  const buildDurationPool = useCallback(() => {
    if (!nodeId) return [];
    const node = getNodeById(nodeId);
    if (!node?.rhythmConfig) return [];
    const rc = node.rhythmConfig;
    const focus = rc.focusDurations || [];
    const context = rc.contextDurations || [];
    if (focus.length > 0) {
      return [...new Set([...focus, ...context])];
    }
    return rc.durations || [];
  }, [nodeId]);

  // Start game
  const startGame = useCallback(() => {
    const pool = buildDurationPool();
    if (pool.length === 0) return;

    const q = generateQuestions(pool, ALL_DURATION_CODES, QUESTION_COUNT, {
      dedupSyllables: true,
    });
    setQuestions(q);
    setCurrentIndex(0);
    _setSelectedIndex(null);
    setResults([]);
    setCardStates(["default", "default", "default", "default"]);
    setFeedbackMessage("");
    setGameState(GAME_STATES.IN_PROGRESS);
    pauseTimer();
  }, [buildDurationPool, pauseTimer]);

  // Trail auto-start
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

  // Handle card selection
  const handleSelect = useCallback(
    (cardIndex) => {
      if (gameState !== GAME_STATES.IN_PROGRESS) return;

      const currentQuestion = questions[currentIndex];
      const isCorrect =
        currentQuestion.choices[cardIndex] === currentQuestion.correct;

      _setSelectedIndex(cardIndex);
      setResults((prev) => [...prev, isCorrect]);

      // Play sound
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

      // Update card states
      const newStates = currentQuestion.choices.map((choice, i) => {
        if (i === cardIndex) return isCorrect ? "correct" : "wrong";
        if (!isCorrect && choice === currentQuestion.correct) return "correct";
        return "dimmed";
      });
      setCardStates(newStates);
      setGameState(GAME_STATES.FEEDBACK);

      // Auto-advance
      const delay = isCorrect ? CORRECT_DELAY : WRONG_DELAY;
      feedbackTimerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          setGameState(GAME_STATES.COMPLETE);
          resumeTimer();
        } else {
          setCurrentIndex(nextIndex);
          _setSelectedIndex(null);
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

  // Error state
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

  // VictoryScreen
  if (gameState === GAME_STATES.COMPLETE) {
    return (
      <VictoryScreen
        score={results.filter(Boolean).length}
        totalPossibleScore={QUESTION_COUNT}
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

  // Render the SVG prompt for the current note
  const SvgIcon = SVG_COMPONENTS[currentQuestion.correct];

  // Progress dots
  const renderProgressDots = () => (
    <div
      className="flex items-center justify-center gap-2"
      role="group"
      aria-label="Progress"
    >
      {Array.from({ length: QUESTION_COUNT }, (_, i) => {
        let dotClass = "w-3 h-3 rounded-full bg-white/30";
        if (i < results.length) {
          dotClass = results[i]
            ? "w-3 h-3 rounded-full bg-green-400"
            : "w-3 h-3 rounded-full bg-red-400";
        } else if (i === currentIndex) {
          dotClass = "w-3 h-3 rounded-full bg-white/60 ring-1 ring-white/40";
        }
        return <div key={i} className={dotClass} aria-hidden="true" />;
      })}
    </div>
  );

  // Card grid (text mode with syllables)
  const renderCards = () => {
    const gridClass = isLandscape
      ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
      : "grid grid-cols-2 gap-4 w-full max-w-sm";

    return (
      <div className={gridClass}>
        {currentQuestion.choices.map((choice, i) => {
          const syllable = getSyllable(choice);
          return (
            <DurationCard
              key={`${currentIndex}-${i}`}
              type="text"
              text={syllable}
              state={cardStates[i]}
              onSelect={handleSelect}
              disabled={gameState === GAME_STATES.FEEDBACK}
              cardIndex={i}
              ariaLabel={syllable}
            />
          );
        })}
      </div>
    );
  };

  // Prompt panel with large SVG
  const renderPromptPanel = () => (
    <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
      <div dir="ltr" className="flex items-center justify-center">
        {SvgIcon && (
          <SvgIcon
            className={`${isLandscape ? "h-16" : "h-24"} w-auto`}
            aria-label={t(DURATION_INFO[currentQuestion.correct].i18nKey)}
          />
        )}
      </div>
      <p className="mt-2 text-center text-base text-white/60">
        {t("syllableMatching.prompt")}
      </p>
    </div>
  );

  // Landscape layout
  if (isLandscape) {
    return (
      <div
        className={`fixed inset-0 flex flex-col overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4 ${
          reducedMotion ? "" : "animate-fadeIn"
        }`}
      >
        {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
        <div aria-live="polite" className="sr-only">
          {feedbackMessage}
        </div>

        {/* Top bar */}
        <div className="mb-4 flex items-center gap-4">
          <BackButton />
          <div className="flex-1">{renderProgressDots()}</div>
        </div>

        {/* Main content: prompt centered above, cards row below */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {renderPromptPanel()}
          {renderCards()}
        </div>
      </div>
    );
  }

  // Portrait layout
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4 ${
        reducedMotion ? "" : "animate-fadeIn"
      }`}
    >
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
      <div aria-live="polite" className="sr-only">
        {feedbackMessage}
      </div>

      {/* Back button */}
      <div className="self-start">
        <BackButton />
      </div>

      {/* Progress dots */}
      <div className="mt-4">{renderProgressDots()}</div>

      {/* Prompt panel with SVG + question text */}
      <div className="mt-6">{renderPromptPanel()}</div>

      {/* Answer cards — 2x2 grid */}
      <div className="mt-6 flex w-full flex-1 items-start justify-center">
        {renderCards()}
      </div>
    </div>
  );
}
