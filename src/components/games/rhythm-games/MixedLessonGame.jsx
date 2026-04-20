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

import { generateQuestions, ALL_DURATION_CODES } from "./utils/durationInfo";
import VisualRecognitionQuestion from "./renderers/VisualRecognitionQuestion";
import SyllableMatchingQuestion from "./renderers/SyllableMatchingQuestion";
import RhythmTapQuestion from "./renderers/RhythmTapQuestion";
import PulseQuestion from "./renderers/PulseQuestion";
import DiscoveryIntroQuestion from "./renderers/DiscoveryIntroQuestion";
import RhythmReadingQuestion from "./renderers/RhythmReadingQuestion";
import RhythmDictationQuestion from "./renderers/RhythmDictationQuestion";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay.jsx";
import { getNodeById } from "../../../data/skillTrail";
import { resolveByTags, resolveByAnyTag } from "../../../data/patterns/RhythmPatternGenerator";
import { binaryPatternToBeats } from "./utils/rhythmVexflowHelpers";
import { generateDistractors } from "./utils/rhythmTimingUtils";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { useMotionTokens } from "../../../utils/useMotionTokens";

// Map VexFlow duration codes to legacy pattern names for RhythmTapQuestion/getPattern() compatibility
const VEX_TO_OLD_NAME = {
  q: "quarter",
  h: "half",
  w: "whole",
  8: "eighth",
  16: "sixteenth",
  qr: "quarter-rest",
  hr: "half-rest",
  wr: "whole-rest",
  hd: "dotted-half",
  qd: "dotted-quarter",
};

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
  const { playCorrectSound, playWrongSound, playVictorySound } = useSounds();

  // Audio context for rhythm_tap questions (provided by AudioContextProvider wrapper)
  const { isInterrupted, handleTapToResume } = useAudioContext();

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
  const currentIndexRef = useRef(0); // Mutable ref — avoids stale-closure in async callbacks (CODE-01)
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

  // Keep currentIndexRef in sync with currentIndex state (CODE-01)
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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

  // Build rhythm tap config from node's rhythmConfig
  const buildRhythmTapConfig = useCallback(() => {
    if (!nodeId) return {};
    const node = getNodeById(nodeId);
    if (!node?.rhythmConfig) return {};
    const rc = node.rhythmConfig;
    // Translate VexFlow duration codes to legacy pattern names for RhythmTapQuestion/getPattern() compatibility
    const patterns = (rc.durations || ["q"]).map(
      (d) => VEX_TO_OLD_NAME[d] || d
    );
    return {
      patterns,
      patternTags: rc.patternTags || [],
      patternTagMode: rc.patternTagMode || "all", // D-06: "any" for boss nodes
      durations: rc.durations || ["q"],
      tempo: typeof rc.tempo === "object" ? rc.tempo.default : rc.tempo || 80,
      timeSignature: rc.timeSignature || "4/4",
      measureCount: rc.measureCount || 1, // D-08: 4 bars for full BOSS
      difficulty: "beginner",
      nodeType: node.nodeType || null,
    };
  }, [nodeId]);

  // Start game — pre-generate all questions from authored sequence (D-06, D-07, D-08, D-09)
  const startGame = useCallback(() => {
    const pool = buildDurationPool();
    const questionSequence = nodeConfig?.questions || [];
    if (questionSequence.length === 0) return;

    // CODE-03: Guard against empty pool — show complete state rather than crash
    if (pool.length === 0) {
      setQuestions([]);
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      setResults([]);
      setCardStates(["default", "default", "default", "default"]);
      setFeedbackMessage("");
      setFadeKey(0);
      setGameState(GAME_STATES.COMPLETE);
      resumeTimer();
      return;
    }

    // Generate one question per authored entry — 1:1 mapping (D-09: pre-structured, not random)
    const allQuestions = questionSequence.map((entry) => {
      if (entry.type === "rhythm_tap") {
        return { type: "rhythm_tap", rhythmConfig: buildRhythmTapConfig() };
      }
      if (entry.type === "pulse") {
        return { type: "pulse", rhythmConfig: buildRhythmTapConfig() };
      }
      if (entry.type === "discovery_intro") {
        return { type: "discovery_intro", focusDuration: entry.focusDuration };
      }
      if (entry.type === "rhythm_reading") {
        return { type: "rhythm_reading", rhythmConfig: buildRhythmTapConfig() };
      }
      if (entry.type === "rhythm_dictation") {
        // Pre-generate pattern + distractors for dictation
        const cfg = buildRhythmTapConfig();
        const node = getNodeById(nodeId);
        const rc = node?.rhythmConfig;
        const resolver = rc?.patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
        const result = resolver(
          rc?.patternTags || [],
          rc?.durations || ["q"],
          { timeSignature: rc?.timeSignature || "4/4" }
        );
        if (result) {
          const beats = binaryPatternToBeats(result.binary);
          const distractors = generateDistractors(beats, 2, {
            allowedDurations: rc?.durations || ["q"],
          });
          const allChoices = [beats, ...distractors];
          // Fisher-Yates shuffle
          for (let i = allChoices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
          }
          const correctIdx = allChoices.indexOf(beats);
          return {
            type: "rhythm_dictation",
            rhythmConfig: cfg,
            correctBeats: beats,
            choices: allChoices,
            correctIndex: correctIdx,
          };
        }
        // Fallback: use rhythm_tap if no curated pattern available
        return { type: "rhythm_tap", rhythmConfig: cfg };
      }
      // CODE-03: Guard generateQuestions result against empty/undefined
      const dedupSyllables = entry.type === "syllable_matching";
      const generated = generateQuestions(pool, ALL_DURATION_CODES, 1, {
        dedupSyllables,
      });
      if (!generated || generated.length === 0 || !generated[0]) {
        // Fallback: use pool[0] as correct with shuffled distractors
        const correct = pool[0];
        const distractors = ALL_DURATION_CODES.filter(
          (c) => c !== correct
        ).slice(0, 3);
        return {
          type: entry.type,
          correct,
          choices: [correct, ...distractors].sort(() => Math.random() - 0.5),
        };
      }
      return { type: entry.type, ...generated[0] };
    });

    setQuestions(allQuestions);
    currentIndexRef.current = 0; // CODE-01: sync ref on start
    setCurrentIndex(0);
    setResults([]);
    setCardStates(["default", "default", "default", "default"]);
    setFeedbackMessage("");
    setFadeKey(0);
    setGameState(GAME_STATES.IN_PROGRESS);
    pauseTimer();
  }, [
    buildDurationPool,
    buildRhythmTapConfig,
    nodeConfig,
    nodeId,
    pauseTimer,
    resumeTimer,
  ]);

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

      // CODE-01: read index from ref to avoid stale-closure in setTimeout
      const idx = currentIndexRef.current;
      const currentQuestion = questions[idx];
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
        // CODE-01: read from ref inside timeout to get current value (not stale closure)
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex >= questions.length) {
          playVictorySound();
          setGameState(GAME_STATES.COMPLETE);
          resumeTimer();
        } else {
          // Crossfade: increment fadeKey when question TYPE changes (D-11)
          const typeChanged =
            questions[nextIndex].type !== currentQuestion.type;
          if (typeChanged) {
            setFadeKey((k) => k + 1);
          }
          currentIndexRef.current = nextIndex; // CODE-01: update ref before state
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
      playCorrectSound,
      playWrongSound,
      playVictorySound,
      resumeTimer,
      t,
    ]
  );

  // Handle rhythm tap question completion — kid-friendly tap count scoring
  const handleRhythmTapComplete = useCallback(
    (onTimeTaps, totalExpectedTaps) => {
      const isCorrect = onTimeTaps >= Math.ceil(totalExpectedTaps / 2);
      setResults((prev) => [...prev, isCorrect]);

      // CODE-01: read index from ref to avoid stale-closure
      const isLastQuestion = currentIndexRef.current + 1 >= questions.length;

      // Skip correct sound on last question — victory sound will play instead
      if (isCorrect && !isLastQuestion) {
        playCorrectSound();
      } else if (!isCorrect) {
        playWrongSound();
      }

      // Shorter delay since RhythmTapQuestion already showed per-beat feedback
      feedbackTimerRef.current = setTimeout(() => {
        // CODE-01: read from ref inside timeout to get current value (not stale closure)
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex >= questions.length) {
          playVictorySound();
          setGameState(GAME_STATES.COMPLETE);
          resumeTimer();
        } else {
          const typeChanged =
            questions[nextIndex].type !==
            questions[currentIndexRef.current].type;
          if (typeChanged) {
            setFadeKey((k) => k + 1);
          }
          currentIndexRef.current = nextIndex; // CODE-01: update ref before state
          setCurrentIndex(nextIndex);
          setCardStates(["default", "default", "default", "default"]);
          setFeedbackMessage("");
          setGameState(GAME_STATES.IN_PROGRESS);
        }
      }, 500);
    },
    [questions, playCorrectSound, playWrongSound, playVictorySound, resumeTimer]
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
          <BackButton to="/trail" />
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

  // CODE-03: Render guard — empty question array during in-progress state
  if (gameState === GAME_STATES.IN_PROGRESS && questions.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4">
        <div className="max-w-sm rounded-xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-md">
          <p className="mb-4 text-lg text-white">
            {t(
              "game.error.generic",
              "Something went wrong. Go back to the trail and try again."
            )}
          </p>
          <BackButton to="/trail" />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndexRef.current];
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
      case "rhythm_tap":
        return (
          <RhythmTapQuestion
            question={currentQuestion}
            isLandscape={isLandscape}
            onComplete={handleRhythmTapComplete}
            disabled={gameState !== GAME_STATES.IN_PROGRESS}
          />
        );
      case "pulse":
        return (
          <PulseQuestion
            question={currentQuestion}
            isLandscape={isLandscape}
            onComplete={handleRhythmTapComplete}
            disabled={gameState !== GAME_STATES.IN_PROGRESS}
          />
        );
      case "discovery_intro":
        return (
          <DiscoveryIntroQuestion
            question={currentQuestion}
            isLandscape={isLandscape}
            onComplete={handleRhythmTapComplete}
            disabled={gameState !== GAME_STATES.IN_PROGRESS}
          />
        );
      case "rhythm_reading":
        return (
          <RhythmReadingQuestion
            question={currentQuestion}
            isLandscape={isLandscape}
            onComplete={handleRhythmTapComplete}
            disabled={gameState !== GAME_STATES.IN_PROGRESS}
          />
        );
      case "rhythm_dictation":
        return (
          <RhythmDictationQuestion
            question={currentQuestion}
            isLandscape={isLandscape}
            onComplete={handleRhythmTapComplete}
            disabled={gameState !== GAME_STATES.IN_PROGRESS}
          />
        );
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
        {isInterrupted && (
          <AudioInterruptedOverlay
            isVisible={true}
            onTapToResume={handleTapToResume}
            onRestartExercise={() => navigate("/trail")}
          />
        )}
        <div aria-live="polite" className="sr-only">
          {feedbackMessage}
        </div>

        {/* Top bar */}
        <div className="mb-4 flex items-center gap-4">
          <BackButton to={nodeId ? "/trail" : "/rhythm-mode"} />
          {renderProgressBar()}
        </div>

        {/* Question area with crossfade */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            key={`${fadeKey}-${currentIndex}`}
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
      {isInterrupted && (
        <AudioInterruptedOverlay
          isVisible={true}
          onTapToResume={handleTapToResume}
          onRestartExercise={() => navigate("/trail")}
        />
      )}
      <div aria-live="polite" className="sr-only">
        {feedbackMessage}
      </div>

      {/* Top bar */}
      <div className="mb-4 flex w-full items-center gap-4">
        <BackButton to={nodeId ? "/trail" : "/rhythm-mode"} />
        {renderProgressBar()}
      </div>

      {/* Question area with crossfade */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div
          key={`${fadeKey}-${currentIndex}`}
          className={`flex w-full flex-col items-center gap-6${reducedMotion ? "" : " animate-fadeIn"}`}
        >
          {renderQuestion()}
        </div>
      </div>
    </div>
  );
}
