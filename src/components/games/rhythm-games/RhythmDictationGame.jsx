import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";

import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { usePianoSampler } from "../../../hooks/usePianoSampler";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useSafeSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay.jsx";
import VictoryScreen from "../VictoryScreen";
import BackButton from "../../ui/BackButton";

import {
  getPattern,
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
} from "./RhythmPatternGenerator";
import { binaryPatternToBeats } from "./utils/rhythmVexflowHelpers";
import {
  generateDistractors,
  schedulePatternPlayback,
} from "./utils/rhythmTimingUtils";
import { DictationChoiceCard } from "./components/DictationChoiceCard";
import { getNodeById } from "../../../data/skillTrail";

// ---------------------------------------------------------------------------
// Game phase finite-state machine
// ---------------------------------------------------------------------------
const GAME_PHASES = {
  SETUP: "setup",
  READY: "ready", // Waiting for user to click "Listen" before pattern plays
  LISTENING: "listening",
  CHOOSING: "choosing",
  FEEDBACK: "feedback",
  SESSION_COMPLETE: "session-complete",
};

const TOTAL_QUESTIONS = 10;
const DEFAULT_TEMPO = 90;
const DEFAULT_TIME_SIG = "4/4";
const DEFAULT_DIFFICULTY = DIFFICULTY_LEVELS.BEGINNER;

/**
 * RhythmDictationGame
 *
 * Aural rhythm recognition game (RDICT-01 through RDICT-06).
 * Child hears a piano rhythm pattern, then picks the correct notation
 * from 3 vertically-stacked VexFlow choice cards.
 *
 * Structural template: MetronomeTrainer.jsx
 */
export function RhythmDictationGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("common");

  // --- Orientation prompt (portrait-primary, landscape-compatible per UI-SPEC) ---
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // --- Trail state (from TrailNodeModal navigation) ---
  const nodeId = location.state?.nodeId ?? null;
  const nodeType = nodeId ? (getNodeById(nodeId)?.nodeType ?? null) : null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const difficulty = nodeConfig?.difficulty ?? DEFAULT_DIFFICULTY;
  const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null;
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
  const { playNote } = usePianoSampler(); // kept for potential other uses; pattern playback uses audioEngine
  const { playCorrectSound, playWrongSound } = useSounds();

  // --- Game settings ---
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [timeSignature, setTimeSignature] = useState(DEFAULT_TIME_SIG);

  // --- Audio engine (G4.mp3 piano sample — matches MetronomeTrainer) ---
  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  // enginePlayNote: wrapper that passes audioEngine.createPianoSound to schedulePatternPlayback
  // The schedulePatternPlayback callback signature is (note, { startTime, duration }) — forward duration for correct note lengths.
  const enginePlayNote = useCallback(
    (_note, opts) => {
      if (audioEngine?.createPianoSound) {
        audioEngine.createPianoSound(
          opts?.startTime,
          0.8,
          opts?.duration ?? 0.5
        );
      }
    },
    [audioEngine]
  );

  // Session timeout controls — safe hook returns no-ops outside provider
  const { pauseTimer, resumeTimer } = useSafeSessionTimeout();

  // --- Game state ---
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Question data
  const [correctBeats, setCorrectBeats] = useState(null); // [{durationUnits, isRest}]
  const [choices, setChoices] = useState([]); // [beats, beats, beats]
  const [correctIndex, setCorrectIndex] = useState(-1); // index within choices
  const [_selectedIndex, setSelectedIndex] = useState(null); // user's pick (tracked for future use)
  const [cardStates, setCardStates] = useState([
    "default",
    "default",
    "default",
  ]);

  // Audio status
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  // Feedback text
  const [feedbackText, setFeedbackText] = useState("");

  // Scores — one entry per question (1 = correct, 0 = wrong)
  const [questionScores, setQuestionScores] = useState([]);

  // IOS-02: Gesture gate — true when AudioContext is suspended on trail auto-start
  const [needsGestureToStart, setNeedsGestureToStart] = useState(false);

  // Kodaly syllable toggle (D-13 to D-16)
  const SYLLABLE_TOGGLE_KEY = "pianomaster_kodaly_syllables";
  const isDiscovery = nodeType === "discovery";
  const [syllablesEnabled, setSyllablesEnabled] = useState(() => {
    if (isDiscovery) return true;
    try {
      return localStorage.getItem(SYLLABLE_TOGGLE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const showSyllableToggle = !isDiscovery;

  const handleSyllableToggle = useCallback(() => {
    setSyllablesEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SYLLABLE_TOGGLE_KEY, String(next));
      } catch {
        // localStorage unavailable — toggle still works in memory
      }
      return next;
    });
  }, []);

  const currentLanguage = i18n.language?.startsWith("he") ? "he" : "en";

  // Auto-start guard
  const hasAutoStartedRef = useRef(false);

  // Pending timeout refs (needed for cleanup on unmount)
  const feedbackTimeoutRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Session timeout: pause during active gameplay, resume during setup/feedback
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const activePhases = [
      GAME_PHASES.READY,
      GAME_PHASES.LISTENING,
      GAME_PHASES.CHOOSING,
    ];
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
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Map a TIME_SIGNATURES object name to its string form, or use as-is if string.
   */
  function resolveTimeSigString(cfg) {
    if (typeof cfg === "string") return cfg;
    // It might be a TIME_SIGNATURES object like { name: '4/4', ... }
    if (cfg && cfg.name) return cfg.name;
    return DEFAULT_TIME_SIG;
  }

  /**
   * Build the TIME_SIGNATURES object from a string key.
   */
  function timeSigStringToObject(str) {
    const map = {
      "4/4": TIME_SIGNATURES.FOUR_FOUR,
      "3/4": TIME_SIGNATURES.THREE_FOUR,
      "2/4": TIME_SIGNATURES.TWO_FOUR,
      "6/8": TIME_SIGNATURES.SIX_EIGHT,
    };
    return map[str] || TIME_SIGNATURES.FOUR_FOUR;
  }

  /**
   * Shuffle an array in place and return a new array (Fisher-Yates).
   */
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------------------------------------------------------------------------
  // Play pattern audio (uses G4.mp3 via audioEngine — matches MetronomeTrainer)
  // ---------------------------------------------------------------------------
  const playPattern = useCallback(
    (beats, currentTempo, onComplete) => {
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = getOrCreateAudioContext();
      }
      if (!ctx || !beats || beats.length === 0) {
        onComplete?.();
        return;
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      const { totalDuration } = schedulePatternPlayback(
        beats,
        currentTempo,
        ctx,
        enginePlayNote
      );

      // After pattern finishes + 300ms buffer, mark done
      const delayMs = (totalDuration + 0.3) * 1000;
      feedbackTimeoutRef.current = setTimeout(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        onComplete?.();
      }, delayMs);
    },
    [audioContextRef, enginePlayNote, getOrCreateAudioContext]
  );

  // ---------------------------------------------------------------------------
  // Generate a new question
  // ---------------------------------------------------------------------------
  const generateQuestion = useCallback(
    async (questionIndex, currentTempo, currentTimeSig) => {
      try {
        const result = await getPattern(
          currentTimeSig,
          difficulty,
          rhythmPatterns
        );

        if (!result || !result.pattern) {
          // Pattern generation failed — skip to next question
          if (questionIndex + 1 < TOTAL_QUESTIONS) {
            setCurrentQuestion((q) => q + 1);
            generateQuestion(questionIndex + 1, currentTempo, currentTimeSig);
          } else {
            setGamePhase(GAME_PHASES.SESSION_COMPLETE);
          }
          return;
        }

        const beats = binaryPatternToBeats(result.pattern);
        const distractors = generateDistractors(beats, 2);

        // Shuffle: place correct + distractors randomly
        const allChoices = [beats, ...distractors];
        const shuffled = shuffleArray(allChoices);
        // Track which index is the correct one (fingerprint comparison avoids
        // fragile reference-equality that would break if shuffleArray ever
        // deep-clones or if beats is recreated between generation and lookup)
        const correctFp = JSON.stringify(beats);
        const corrIdx = shuffled.findIndex(
          (c) => JSON.stringify(c) === correctFp
        );

        setCorrectBeats(beats);
        setChoices(shuffled);
        setCorrectIndex(corrIdx);
        setSelectedIndex(null);
        setCardStates(["default", "default", "default"]);
        setFeedbackText("");

        // Transition to READY — user must press "Listen" before pattern plays
        setGamePhase(GAME_PHASES.READY);
      } catch (err) {
        console.warn("[RhythmDictationGame] generateQuestion error:", err);
        setGamePhase(GAME_PHASES.SESSION_COMPLETE);
      }
    },
    [difficulty, rhythmPatterns]
  );

  // ---------------------------------------------------------------------------
  // LISTENING phase: auto-play pattern when we enter it
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (gamePhase !== GAME_PHASES.LISTENING || !correctBeats) return;
    setFeedbackText(t("games.rhythmDictation.listening"));

    playPattern(correctBeats, tempo, () => {
      setFeedbackText("");
      setGamePhase(GAME_PHASES.CHOOSING);
    });
  }, [gamePhase, correctBeats]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // READY phase: user clicks "Listen to the pattern" to start playback
  // ---------------------------------------------------------------------------
  const handleReady = useCallback(() => {
    setGamePhase(GAME_PHASES.LISTENING);
  }, []);

  // ---------------------------------------------------------------------------
  // Replay button handler
  // ---------------------------------------------------------------------------
  const handleReplay = useCallback(() => {
    if (isPlayingRef.current || gamePhase === GAME_PHASES.FEEDBACK) return;
    if (!correctBeats) return;

    setFeedbackText(t("games.rhythmDictation.listening"));
    playPattern(correctBeats, tempo, () => {
      setFeedbackText("");
    });
  }, [correctBeats, gamePhase, tempo, playPattern, t]);

  // ---------------------------------------------------------------------------
  // Advance to next question or complete session
  // ---------------------------------------------------------------------------
  const advanceQuestion = useCallback(() => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion >= TOTAL_QUESTIONS) {
      setGamePhase(GAME_PHASES.SESSION_COMPLETE);
    } else {
      setCurrentQuestion(nextQuestion);
      generateQuestion(nextQuestion, tempo, timeSignature);
    }
  }, [currentQuestion, tempo, timeSignature, generateQuestion]);

  // ---------------------------------------------------------------------------
  // Card selection handler
  // ---------------------------------------------------------------------------
  const handleCardSelect = useCallback(
    (cardIdx) => {
      if (gamePhase !== GAME_PHASES.CHOOSING) return;
      setGamePhase(GAME_PHASES.FEEDBACK);
      setSelectedIndex(cardIdx);

      const isCorrect = cardIdx === correctIndex;

      if (isCorrect) {
        // Correct: correct card glows green, others dim
        playCorrectSound();
        setFeedbackText(t("games.rhythmDictation.correct"));
        const newStates = ["dimmed", "dimmed", "dimmed"];
        newStates[correctIndex] = "correct";
        setCardStates(newStates);
        setQuestionScores((prev) => [...prev, 1]);

        feedbackTimeoutRef.current = setTimeout(() => {
          advanceQuestion();
        }, 1500);
      } else {
        // Wrong: selected card flashes red
        playWrongSound();
        setFeedbackText(t("games.rhythmDictation.wrong"));
        const flashStates = ["default", "default", "default"];
        flashStates[cardIdx] = "wrong";
        setCardStates(flashStates);
        setQuestionScores((prev) => [...prev, 0]);

        // After 300ms: dim selected, reveal correct, auto-replay correct pattern
        // Then advance AFTER replay finishes + 1s breathing room (no premature cutoff)
        feedbackTimeoutRef.current = setTimeout(() => {
          const revealStates = ["dimmed", "dimmed", "dimmed"];
          revealStates[correctIndex] = "correct";
          setCardStates(revealStates);

          // Auto-replay correct pattern (RDICT-05), then advance after replay ends
          playPattern(correctBeats, tempo, () => {
            feedbackTimeoutRef.current = setTimeout(() => {
              advanceQuestion();
            }, 1000); // 1s breathing room after replay finishes
          });
        }, 300);
      }
    },
    [
      gamePhase,
      correctIndex,
      correctBeats,
      tempo,
      playPattern,
      playCorrectSound,
      playWrongSound,
      t,
      advanceQuestion,
    ]
  );

  // ---------------------------------------------------------------------------
  // Auto-start from trail
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      const ctx = audioContextRef.current;
      // IOS-02: If AudioContext is missing (needs user gesture to create) or suspended, show tap-to-start overlay
      if (!ctx || ctx.state === "suspended" || ctx.state === "interrupted") {
        setNeedsGestureToStart(true);
        return;
      }
      hasAutoStartedRef.current = true;
      const resolvedTimeSig =
        resolveTimeSigString(nodeConfig.timeSignature) || DEFAULT_TIME_SIG;
      const resolvedTempo = nodeConfig.tempo || DEFAULT_TEMPO;
      setTempo(resolvedTempo);
      setTimeSignature(resolvedTimeSig);
      setCurrentQuestion(0);
      setQuestionScores([]);
      generateQuestion(0, resolvedTempo, resolvedTimeSig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start guarded by hasAutoStartedRef; only nodeConfig triggers
  }, [nodeConfig]);

  // ---------------------------------------------------------------------------
  // Manual start (non-trail mode)
  // ---------------------------------------------------------------------------
  const handleStartGame = useCallback(() => {
    hasAutoStartedRef.current = true;
    setCurrentQuestion(0);
    setQuestionScores([]);
    generateQuestion(0, tempo, timeSignature);
  }, [tempo, timeSignature, generateQuestion]);

  // IOS-02: Handle user-gesture tap-to-start for trail auto-start when AudioContext was suspended
  const handleGestureStart = useCallback(async () => {
    // Create AudioContext if it doesn't exist yet (iOS needs user gesture to create)
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    setNeedsGestureToStart(false);
    hasAutoStartedRef.current = true;
    const resolvedTimeSig =
      resolveTimeSigString(nodeConfig?.timeSignature) || DEFAULT_TIME_SIG;
    const resolvedTempo = nodeConfig?.tempo || DEFAULT_TEMPO;
    setTempo(resolvedTempo);
    setTimeSignature(resolvedTimeSig);
    setCurrentQuestion(0);
    setQuestionScores([]);
    generateQuestion(0, resolvedTempo, resolvedTimeSig);
  }, [getOrCreateAudioContext, nodeConfig, generateQuestion]);

  // ---------------------------------------------------------------------------
  // handleNextExercise — trail exercise routing (mirrors MetronomeTrainer)
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
            case "arcade_rhythm":
              navigate("/rhythm-mode/arcade-rhythm-game", { state: navState });
              break;
            case "rhythm_tap":
              navigate("/rhythm-mode/rhythm-reading-game", {
                state: navState,
              });
              break;
            case "rhythm_pulse":
              navigate("/rhythm-mode/metronome-trainer", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            default:
              navigate("/trail");
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
    setCurrentQuestion(0);
    setQuestionScores([]);
    setCorrectBeats(null);
    setChoices([]);
    setCardStates(["default", "default", "default"]);
    setFeedbackText("");
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  // ---------------------------------------------------------------------------
  // Compute final score for VictoryScreen
  // ---------------------------------------------------------------------------
  const correctCount = questionScores.filter((s) => s === 1).length;

  // ---------------------------------------------------------------------------
  // Render: SESSION_COMPLETE → VictoryScreen
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
            {t("games.rhythmDictation.title")}
          </h1>
          <button
            onClick={handleStartGame}
            className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
          >
            {t("games.metronomeTrainer.startGame", {
              defaultValue: "Start Game",
            })}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: main game (READY / LISTENING / CHOOSING / FEEDBACK)
  // ---------------------------------------------------------------------------
  const isInFeedback = gamePhase === GAME_PHASES.FEEDBACK;
  // Choice cards visible during LISTENING (so user can study options while hearing pattern),
  // CHOOSING (active selection), and FEEDBACK (showing result)
  const showCards =
    gamePhase === GAME_PHASES.LISTENING ||
    gamePhase === GAME_PHASES.CHOOSING ||
    gamePhase === GAME_PHASES.FEEDBACK;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* iOS rotate prompt */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

      {/* IOS-02: Gesture gate — shown when AudioContext needs user gesture to start (e.g. iOS trail auto-start) */}
      {needsGestureToStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <button
            onClick={handleGestureStart}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-12 py-8 backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/30">
              <svg
                className="h-8 w-8 text-indigo-300"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">
              {t("games.actions.start", "Start Game")}
            </span>
          </button>
        </div>
      )}

      {/* iOS audio interruption overlay */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={handleReset}
      />

      {/* Feedback announcement (sr-only live region for screen readers) */}
      <div aria-live="polite" className="sr-only">
        {feedbackText}
      </div>

      {/* 3-column layout: [back] [cards] [controls] */}
      <div className="flex h-screen items-stretch overflow-hidden">
        {/* Left column: back button */}
        <div className="flex w-14 flex-shrink-0 items-start justify-center pt-3">
          <BackButton to={nodeId ? "/trail?path=rhythm" : "/rhythm-mode"} />
        </div>

        {/* Center column: answer cards */}
        <div className="flex flex-1 flex-col justify-center gap-3 py-3">
          {/* Syllable toggle button — top of center column, hidden on Discovery (always-on) */}
          {showSyllableToggle && (
            <div className="flex justify-end px-2">
              <button
                onClick={handleSyllableToggle}
                aria-pressed={syllablesEnabled}
                aria-label={t("games.rhythmReading.syllableToggle.ariaLabel")}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-normal transition-colors ${
                  syllablesEnabled
                    ? "border-indigo-400/40 bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/40"
                    : "border-white/20 bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {"\u2669"} {t("games.rhythmReading.syllableToggle.label")}
              </button>
            </div>
          )}

          {/* READY phase — "Listen to the pattern" gate */}
          {gamePhase === GAME_PHASES.READY && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="font-rounded text-sm text-white/70">
                {t("games.rhythmDictation.getReady", {
                  defaultValue: "Get ready to listen",
                })}
              </p>
              <button
                onClick={handleReady}
                className="rounded-xl border border-indigo-400/30 bg-indigo-500/80 px-6 py-3 font-rounded text-white transition-colors hover:bg-indigo-500"
              >
                {t("games.rhythmDictation.listenButton", {
                  defaultValue: "Listen to the pattern",
                })}
              </button>
            </div>
          )}

          {/* Choice cards — vertical stack (D-06) */}
          {showCards && choices.length === 3 && (
            <div className="flex flex-col gap-3">
              {choices.map((choiceBeats, idx) => (
                <DictationChoiceCard
                  key={idx}
                  beats={choiceBeats}
                  timeSignature={timeSignature}
                  cardIndex={idx}
                  state={cardStates[idx] ?? "default"}
                  onSelect={handleCardSelect}
                  disabled={isInFeedback}
                  showSyllables={syllablesEnabled}
                  language={currentLanguage}
                />
              ))}
            </div>
          )}

          {/* Loading state while generating first question */}
          {gamePhase === GAME_PHASES.SETUP && nodeConfig && (
            <div className="flex items-center justify-center py-8">
              <span className="animate-pulse text-sm text-white/60">
                {t("games.rhythmDictation.listening", {
                  defaultValue: "Loading...",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Right column: replay + progress + score */}
        <div className="flex w-16 flex-shrink-0 flex-col items-center justify-center gap-3">
          {/* Replay icon button */}
          {(gamePhase === GAME_PHASES.LISTENING ||
            gamePhase === GAME_PHASES.CHOOSING) && (
            <button
              onClick={handleReplay}
              disabled={isPlaying}
              aria-label={t("games.rhythmDictation.playAgain", {
                defaultValue: "Play Again",
              })}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isPlaying
                  ? "cursor-not-allowed bg-indigo-500/50 opacity-50"
                  : "cursor-pointer bg-indigo-500 text-white hover:bg-indigo-400"
              }`}
            >
              <Volume2 size={18} />
            </button>
          )}

          {/* Feedback text */}
          {feedbackText && (
            <span className="text-center font-rounded text-xs text-white/80">
              {feedbackText}
            </span>
          )}

          {/* Progress */}
          <span dir="ltr" className="font-rounded text-xs text-white/70">
            {currentQuestion + 1}/{TOTAL_QUESTIONS}
          </span>

          {/* Score */}
          <span className="font-rounded text-xs text-indigo-300">
            {correctCount} ✓
          </span>
        </div>
      </div>
    </div>
  );
}

export default RhythmDictationGame;
