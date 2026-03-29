/**
 * NoteSpeedCards — Speed card game for single-note trail nodes
 *
 * A Duolingo-kids-style speed card game where notes flash by on a staff
 * and the child taps the screen when the target note appears.
 */

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Zap, Heart } from "lucide-react";
import flameIcon from "../../../assets/icons/flame.png";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import GameOverScreen from "../GameOverScreen";
import { NoteImageDisplay } from "./NoteImageDisplay";
import {
  TREBLE_NOTES,
  BASS_NOTES,
} from "../sight-reading-game/constants/gameSettings";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import { getNodeById } from "../../../data/skillTrail";

// ============================================================
// Pure Functions (exported for testability — tested by NoteSpeedCards.test.js)
// ============================================================

/**
 * Generate a shuffled sequence of cards with exactly `targetCount` target cards
 * and `totalCards - targetCount` distractor cards.
 *
 * @param {number} totalCards - Total number of cards in the sequence
 * @param {number} targetCount - How many cards should be the target note
 * @param {string} targetPitch - The pitch of the target note (e.g. 'C4')
 * @param {string[]} distractorPool - Array of distractor pitches to sample from
 * @returns {{ id: number, pitch: string, isTarget: boolean }[]}
 */
export function generateCardSequence(totalCards, targetCount, targetPitch, distractorPool) {
  const cards = [];

  // Create target cards
  for (let i = 0; i < targetCount; i++) {
    cards.push({ id: i, pitch: targetPitch, isTarget: true });
  }

  // Create distractor cards, cycling through the pool
  const distractorCount = totalCards - targetCount;
  for (let i = 0; i < distractorCount; i++) {
    const pitch = distractorPool[i % distractorPool.length];
    cards.push({ id: targetCount + i, pitch, isTarget: false });
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Re-assign sequential IDs after shuffle
  return cards.map((card, index) => ({ ...card, id: index }));
}

/**
 * Get the display duration (ms) for a card at the given index in the sequence.
 * Speed ramps up in 4 tiers:
 *   Cards 0-4:   2000ms (Learning)
 *   Cards 5-9:   1500ms (Warming Up)
 *   Cards 10-14: 1200ms (Challenge)
 *   Cards 15+:   1000ms (Fast)
 *
 * @param {number} cardIndex - 0-based index of the card
 * @returns {number} Duration in milliseconds
 */
export function getSpeedForCard(cardIndex) {
  if (cardIndex < 8) return 2500;
  if (cardIndex < 16) return 2000;
  if (cardIndex < 24) return 1700;
  return 1400;
}

/**
 * Calculate a 0-100 score based on how many targets the player caught.
 *
 * @param {number} caught - Number of target cards the player tapped
 * @param {number} total - Total number of target cards in the sequence
 * @returns {number} Score from 0 to 100
 */
export function calculateScore(caught, total) {
  if (total === 0) return 0;
  return Math.round((caught / total) * 100);
}

const INITIAL_LIVES = 3;

// ============================================================
// Game Component
// ============================================================

/**
 * NoteSpeedCards game component.
 *
 * Cards slide right-to-left (LTR) across the screen. The player taps
 * when the target note appears. Speed ramps through 4 tiers.
 * Integrates with trail auto-start and VictoryScreen.
 */
export function NoteSpeedCards() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("common");
  const { highContrast } = useAccessibility();
  const { snappy, fade, reduce } = useMotionTokens();
  const { playCorrectSound, playWrongSound } = useSounds();

  // Landscape lock + rotate prompt
  useLandscapeLock();
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Session timeout integration (try/catch — not always in provider)
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider — no-op
  }

  // ── Trail state (from navigation) ────────────────────────────────────────
  const nodeId = location.state?.nodeId || null;
  const nodeConfig = location.state?.nodeConfig || null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;

  // Derived config (defaults for standalone/free-play mode)
  const targetNote = nodeConfig?.targetNote || "C4";
  const distractorNotes = nodeConfig?.distractorNotes || ["D4", "E4", "G4", "A4"];
  const totalCards = nodeConfig?.totalCards || 30;
  const totalTargets = nodeConfig?.targetCount || 8;
  const clef = nodeConfig?.clef || "treble";

  // ── Game state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState("idle"); // 'idle' | 'countdown' | 'in-progress' | 'complete' | 'game-over'
  const [countdownValue, setCountdownValue] = useState(null);
  const [cardSequence, setCardSequence] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [correctCatches, setCorrectCatches] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'wrong' | 'missed' | null
  const [feedbackKey, setFeedbackKey] = useState(0); // force re-mount to re-animate

  // ── Refs (avoid stale closures in setTimeout) ─────────────────────────────
  const isGameActiveRef = useRef(false);
  const currentCardIndexRef = useRef(0);
  const comboRef = useRef(0);
  const correctCatchesRef = useRef(0);
  const currentSpeedRef = useRef(2000);
  const tappedThisCard = useRef(false);
  const livesRef = useRef(INITIAL_LIVES);
  const isTransitioning = useRef(false);
  const hasAutoStartedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isGameActiveRef.current = gameState === "in-progress";
  }, [gameState]);

  useEffect(() => {
    currentCardIndexRef.current = currentCardIndex;
  }, [currentCardIndex]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    correctCatchesRef.current = correctCatches;
  }, [correctCatches]);

  // ── RTL support ───────────────────────────────────────────────────────────
  const isRTL = i18n.dir() === "rtl";

  // ── Note object lookup ─────────────────────────────────────────────────────
  const noteObjects = useMemo(() => {
    return clef === "bass" ? BASS_NOTES : TREBLE_NOTES;
  }, [clef]);

  const getNoteObj = useCallback(
    (pitchString) => {
      const found = noteObjects.find((n) => n.pitch === pitchString);
      if (found) return { ...found, __clef: clef };
      return {
        note: pitchString,
        englishName: pitchString,
        pitch: pitchString,
        __clef: clef,
        ImageComponent: null,
      };
    },
    [noteObjects, clef],
  );

  // ── Speed tier label ──────────────────────────────────────────────────────
  const getSpeedLabel = useCallback(
    (cardIndex) => {
      if (cardIndex < 8) return t("noteSpeedCards.speedLabel.learning");
      if (cardIndex < 16) return t("noteSpeedCards.speedLabel.warmingUp");
      if (cardIndex < 24) return t("noteSpeedCards.speedLabel.challenge");
      return t("noteSpeedCards.speedLabel.fast");
    },
    [t],
  );

  // ── Target headline (from i18n or node name) ──────────────────────────────
  const noteName = t(`trail:noteNames.${targetNote.replace(/[0-9]/g, "")}`, { defaultValue: targetNote });
  const headline = t("noteSpeedCards.headline", { noteName });
  const subheadline = t("noteSpeedCards.subheadline", { noteName });

  // ── Start game (with countdown) ─────────────────────────────────────────
  const startGame = useCallback(() => {
    const sequence = generateCardSequence(totalCards, totalTargets, targetNote, distractorNotes);
    setCardSequence(sequence);
    setCurrentCardIndex(0);
    setCorrectCatches(0);
    setWrongTaps(0);
    setCombo(0);
    setFeedbackState(null);
    correctCatchesRef.current = 0;
    comboRef.current = 0;
    currentCardIndexRef.current = 0;
    tappedThisCard.current = false;
    setLives(INITIAL_LIVES);
    livesRef.current = INITIAL_LIVES;
    setCountdownValue(3);
    setGameState("countdown");
  }, [totalCards, totalTargets, targetNote, distractorNotes]);

  // ── Countdown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "countdown") return;
    if (countdownValue <= 0) {
      setGameState("in-progress");
      return;
    }
    const id = setTimeout(() => setCountdownValue((prev) => prev - 1), 800);
    return () => clearTimeout(id);
  }, [gameState, countdownValue]);

  // ── Reset game ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    hasAutoStartedRef.current = false;
    startGame();
  }, [startGame]);

  // ── Trail auto-start ──────────────────────────────────────────────────────
  // Reset auto-start flag when node changes
  useEffect(() => {
    hasAutoStartedRef.current = false;
    setGameState("idle");
    setCurrentCardIndex(0);
    setCorrectCatches(0);
    setCombo(0);
    setFeedbackState(null);
    correctCatchesRef.current = 0;
    comboRef.current = 0;
  }, [nodeId]);

  // Auto-start when navigated from trail
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      setTimeout(() => startGame(), 50);
    }
  }, [nodeConfig, nodeId, startGame]);

  // ── Session timeout pausing ───────────────────────────────────────────────
  useEffect(() => {
    if (gameState === "in-progress") {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer();
  }, [gameState, pauseTimer, resumeTimer]);

  // ── Missed target handler ─────────────────────────────────────────────────
  const handleMissedTarget = useCallback(() => {
    setFeedbackState("missed");
    setFeedbackKey((prev) => prev + 1);
    // No combo reset for missed targets (neutral, not punishing)
  }, []);

  // ── Game loop (setTimeout-based) ──────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "in-progress") return;

    if (currentCardIndex >= cardSequence.length) {
      // All cards shown — game complete
      setGameState("complete");
      isGameActiveRef.current = false;
      return;
    }

    tappedThisCard.current = false;
    setFeedbackState(null);

    // Block taps during card transition animation (~400ms)
    isTransitioning.current = true;
    const transitionId = setTimeout(() => {
      isTransitioning.current = false;
    }, 400);

    // Calculate speed with bonus reduction (-100ms per correct catch, floor 700ms)
    const baseSpeed = getSpeedForCard(currentCardIndex);
    const adjustedSpeed = Math.max(1000, baseSpeed - correctCatchesRef.current * 50);
    currentSpeedRef.current = adjustedSpeed;

    const id = setTimeout(() => {
      if (!isGameActiveRef.current) return;
      // Card expired — check if target was missed
      const card = cardSequence[currentCardIndexRef.current];
      if (card?.isTarget && !tappedThisCard.current) {
        handleMissedTarget();
      }
      setCurrentCardIndex((prev) => prev + 1);
    }, adjustedSpeed);

    return () => {
      clearTimeout(id);
      clearTimeout(transitionId);
    };
  }, [currentCardIndex, gameState, cardSequence, handleMissedTarget]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleTap = useCallback(
    (e) => {
      // Prevent default touch behaviour to avoid 300ms click delay on mobile
      if (e?.cancelable) e.preventDefault();

      if (gameState !== "in-progress") return;
      if (isTransitioning.current) return; // ignore taps during card transition
      if (tappedThisCard.current) return; // prevent double-tap
      tappedThisCard.current = true;

      const card = cardSequence[currentCardIndexRef.current];
      if (!card) return;

      if (card.isTarget) {
        // Correct catch
        playCorrectSound();
        setCorrectCatches((prev) => prev + 1);
        correctCatchesRef.current += 1;
        setCombo((prev) => prev + 1);
        comboRef.current += 1;
        setFeedbackState("correct");
      } else {
        // Wrong tap — combo reset + lose a life
        playWrongSound();
        setCombo(0);
        comboRef.current = 0;
        setWrongTaps((prev) => prev + 1);
        setFeedbackState("wrong");

        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setGameState("game-over");
          isGameActiveRef.current = false;
          return; // don't advance card
        }
      }
      setFeedbackKey((prev) => prev + 1);
      // Advance card shortly after tap feedback
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 300);
    },
    [gameState, cardSequence, playCorrectSound, playWrongSound],
  );

  // Touch handler that prevents 300ms delay on mobile
  const handleTouchStart = useCallback(
    (e) => {
      handleTap(e);
    },
    [handleTap],
  );

  // Spacebar handler for desktop/laptop play
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTap]);

  // ── handleNextExercise (trail navigation) ─────────────────────────────────
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
                replace: true,
              });
              break;
            case "sight_reading":
              navigate("/notes-master-mode/sight-reading-game", { state: navState });
              break;
            case "memory_game":
              navigate("/notes-master-mode/memory-game", { state: navState });
              break;
            case "note_catch":
              navigate("/notes-master-mode/note-speed-cards", {
                state: navState,
                replace: true,
              });
              break;
            case "rhythm":
              navigate("/rhythm-mode/metronome-trainer", { state: navState });
              break;
            case "boss_challenge":
              navigate("/notes-master-mode/sight-reading-game", {
                state: { ...navState, isBoss: true },
              });
              break;
            case "rhythm_reading":
              navigate("/rhythm-mode/rhythm-reading-game", { state: navState });
              break;
            case "rhythm_dictation":
              navigate("/rhythm-mode/rhythm-dictation-game", { state: navState });
              break;
            case "pitch_comparison":
              navigate("/ear-training-mode/note-comparison-game", { state: navState });
              break;
            case "interval_id":
              navigate("/ear-training-mode/interval-game", { state: navState });
              break;
            default:
              navigate("/trail");
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // ── Accessibility helpers ─────────────────────────────────────────────────
  const glassBase = highContrast ? "bg-white/30" : "bg-white/10";
  const secondaryText = highContrast ? "text-white" : "text-white/70";

  // ── Feedback aria label ───────────────────────────────────────────────────
  const feedbackAnnouncement =
    feedbackState === "correct"
      ? "Caught it!"
      : feedbackState === "wrong"
        ? "Not quite!"
        : feedbackState === "missed"
          ? "Missed!"
          : "";

  // ── Card animation direction (RTL-aware) ──────────────────────────────────
  const cardEnter = isRTL ? { x: "-100%" } : { x: "100%" };
  const cardExit = isRTL ? { x: "100%" } : { x: "-100%" };

  // ── Render: Game over state ──────────────────────────────────────────────
  if (gameState === "game-over") {
    return (
      <GameOverScreen
        score={correctCatches}
        totalQuestions={totalCards}
        livesLost={true}
        correctAnswers={correctCatches}
        onReset={handleReset}
      />
    );
  }

  // ── Render: Complete state ────────────────────────────────────────────────
  if (gameState === "complete") {
    return (
      <VictoryScreen
        score={calculateScore(correctCatches, totalTargets)}
        totalPossibleScore={100}
        onReset={handleReset}
        onExit={() => navigate("/trail")}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType="note_catch"
        onNextExercise={handleNextExercise}
        subtitle={t("noteSpeedCards.catchResult", { caught: correctCatches, total: totalTargets })}
      />
    );
  }

  // ── Current card data ─────────────────────────────────────────────────────
  const currentCard = cardSequence[currentCardIndex] ?? null;
  const currentNoteObj = currentCard ? getNoteObj(currentCard.pitch) : null;

  // ── Render: Idle state ────────────────────────────────────────────────────
  if (gameState === "idle") {
    return (
      <div className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        {/* Rotate prompt for portrait mobile */}
        {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

        {/* Back button */}
        <div className="absolute left-4 top-4 z-10">
          <BackButton to="/trail" name="Back to Trail" />
        </div>

        {/* Idle card */}
        <div
          className={`mx-6 flex flex-col items-center gap-6 rounded-3xl border border-white/20 p-8 shadow-xl ${glassBase} backdrop-blur-md`}
        >
          <h1 className="font-rounded text-center text-2xl font-bold text-white">
            {headline}
          </h1>
          <p className={`text-center text-base ${secondaryText}`}>{subheadline}</p>

          <button
            onClick={startGame}
            className="font-playful cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-10 py-4 text-xl font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95"
          >
            {t("noteSpeedCards.startButton")}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Countdown state ──────────────────────────────────────────────
  if (gameState === "countdown") {
    return (
      <div className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdownValue}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-8xl font-bold text-white"
            style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}
          >
            {countdownValue}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Render: In-progress state ─────────────────────────────────────────────
  return (
    <div
      className="relative flex h-[100svh] touch-manipulation cursor-pointer flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 select-none"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
    >
      {/* Rotate prompt */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

      {/* Screen-reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {feedbackAnnouncement}
      </div>

      {/* ── HUD row ── */}
      <div
        className="relative z-20 flex h-[52px] shrink-0 items-center gap-3 px-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back button — stopPropagation so tap doesn't trigger game */}
        <BackButton to="/trail" name="Back to Trail" />

        {/* Score pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white ${glassBase} backdrop-blur-md`}
        >
          <Zap className="h-3.5 w-3.5 text-indigo-300" />
          <span>
            {correctCatches}/{totalTargets}
          </span>
        </div>

        {/* Combo pill */}
        {combo >= 1 && (
          <div
            className={`flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-sm font-bold ${combo >= 3 ? "text-orange-300" : "text-white"} ${glassBase} backdrop-blur-md`}
          >
            <img
              src={flameIcon}
              alt=""
              className={`h-4 w-4 ${combo >= 3 ? "opacity-100" : "opacity-60"}`}
            />
            <span>×{combo}</span>
          </div>
        )}

        {/* Hearts */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
            <AnimatePresence key={i} mode="wait">
              {i < lives ? (
                <motion.div
                  key="filled"
                  exit={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className="h-5 w-5 fill-red-400 text-red-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Heart className="h-5 w-5 text-white/30" />
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Speed tier label */}
        <span className={`text-sm font-medium ${secondaryText}`}>
          {getSpeedLabel(currentCardIndex)}
        </span>
      </div>

      {/* ── Headline ── */}
      <h1 className="mt-4 shrink-0 text-center text-xl font-bold text-white">
        {headline}
      </h1>

      {/* ── Conveyor track ── */}
      <div className="relative mx-4 mt-4 flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10">
        {/* Feedback flash overlay */}
        <AnimatePresence>
          {feedbackState && (
            <motion.div
              key={`feedback-${feedbackKey}`}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`pointer-events-none absolute inset-0 z-10 rounded-3xl ${
                feedbackState === "correct"
                  ? "bg-green-400/40"
                  : feedbackState === "wrong"
                    ? "bg-red-400/40"
                    : "bg-amber-400/20"
              }`}
            />
          )}
        </AnimatePresence>

        {/* Missed banner */}
        <AnimatePresence>
          {feedbackState === "missed" && (
            <motion.div
              key={`missed-${feedbackKey}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={fade}
              className="pointer-events-none absolute top-4 z-20 rounded-full bg-amber-400/80 px-4 py-1 text-sm font-bold text-white shadow"
            >
              {t("noteSpeedCards.missedBanner")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sliding card */}
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={reduce ? { opacity: 0 } : cardEnter}
              animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { ...cardExit, opacity: 0 }}
              transition={snappy}
              className="flex h-full w-full max-w-[280px] items-center justify-center p-4"
            >
              <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 shadow-lg">
                {currentNoteObj && (
                  <NoteImageDisplay note={currentNoteObj} className="h-full w-full" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom area ── */}
      <div className="shrink-0 px-4 pb-6 pt-3">
        {/* Tap hint */}
        <p className={`mb-3 text-center text-base ${secondaryText}`}>
          {t("noteSpeedCards.tapHint", { noteName: t(`trail:noteNames.${targetNote.replace(/[0-9]/g, "")}`, { defaultValue: targetNote }) })}
        </p>

        {/* Speed progress bar */}
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-300"
            style={{
              width: `${Math.min(100, (currentCardIndex / totalCards) * 100)}%`,
            }}
          />
        </div>

        {/* Card progress counter */}
        <p className="text-right text-sm text-white/50">
          {t("noteSpeedCards.cardProgress", {
            current: Math.min(currentCardIndex + 1, totalCards),
            total: totalCards,
          })}
        </p>
      </div>
    </div>
  );
}
