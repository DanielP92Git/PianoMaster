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
import { Zap } from "lucide-react";
import flameIcon from "../../../assets/icons/flame.png";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
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
  if (cardIndex < 5) return 2000;
  if (cardIndex < 10) return 1500;
  if (cardIndex < 15) return 1200;
  return 1000;
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
  const totalCards = nodeConfig?.totalCards || 20;
  const totalTargets = nodeConfig?.targetCount || 5;
  const clef = nodeConfig?.clef || "treble";

  // ── Game state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState("idle"); // 'idle' | 'in-progress' | 'complete'
  const [cardSequence, setCardSequence] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [correctCatches, setCorrectCatches] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'wrong' | 'missed' | null
  const [feedbackKey, setFeedbackKey] = useState(0); // force re-mount to re-animate

  // ── Refs (avoid stale closures in setTimeout) ─────────────────────────────
  const isGameActiveRef = useRef(false);
  const currentCardIndexRef = useRef(0);
  const comboRef = useRef(0);
  const correctCatchesRef = useRef(0);
  const currentSpeedRef = useRef(2000);
  const tappedThisCard = useRef(false);
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
      if (cardIndex < 5) return t("noteSpeedCards.speedLabel.learning");
      if (cardIndex < 10) return t("noteSpeedCards.speedLabel.warmingUp");
      if (cardIndex < 15) return t("noteSpeedCards.speedLabel.challenge");
      return t("noteSpeedCards.speedLabel.fast");
    },
    [t],
  );

  // ── Target headline (from i18n or node name) ──────────────────────────────
  const headline = t("noteSpeedCards.headline");
  const subheadline = t("noteSpeedCards.subheadline");

  // ── Start game ────────────────────────────────────────────────────────────
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
    setGameState("in-progress");
  }, [totalCards, totalTargets, targetNote, distractorNotes]);

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

    // Calculate speed with bonus reduction (-100ms per correct catch, floor 700ms)
    const baseSpeed = getSpeedForCard(currentCardIndex);
    const adjustedSpeed = Math.max(700, baseSpeed - correctCatchesRef.current * 100);
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

    return () => clearTimeout(id);
  }, [currentCardIndex, gameState, cardSequence, handleMissedTarget]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleTap = useCallback(
    (e) => {
      // Prevent default touch behaviour to avoid 300ms click delay on mobile
      if (e?.cancelable) e.preventDefault();

      if (gameState !== "in-progress") return;
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
        // Wrong tap — no lives lost, just combo reset
        playWrongSound();
        setCombo(0);
        comboRef.current = 0;
        setWrongTaps((prev) => prev + 1);
        setFeedbackState("wrong");
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
          {t("noteSpeedCards.tapHint")}
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
