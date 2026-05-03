/**
 * RhythmDictationQuestion.jsx
 *
 * Stateful renderer for rhythm dictation questions within MixedLessonGame.
 * Plays an audio pattern, then shows 3 DictationChoiceCard options.
 * User selects the matching notation. Simplified single-question version
 * of RhythmDictationGame.
 *
 * Sub-FSM: LISTEN_PROMPT → LISTENING → CHOOSING → FEEDBACK → DONE
 * Reports onComplete(isCorrect ? 1 : 0, 1).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, RotateCcw } from "lucide-react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useEnsureAudioReady } from "../../../../hooks/useEnsureAudioReady";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useSounds } from "../../../../features/games/hooks/useSounds";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { DictationChoiceCard } from "../components/DictationChoiceCard";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";

const PHASES = {
  LISTEN_PROMPT: "listen-prompt",
  LISTENING: "listening",
  CHOOSING: "choosing",
  FEEDBACK: "feedback",
  DONE: "done",
};

export default function RhythmDictationQuestion({
  question,
  isLandscape: _isLandscape,
  onComplete,
  disabled,
}) {
  const { t, i18n } = useTranslation("common");
  const syllableLanguage = i18n.language?.startsWith("he") ? "he" : "en";
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { playCorrectSound, playWrongSound } = useSounds();
  const { reduce: reducedMotion } = useMotionTokens();

  const config = question?.rhythmConfig || {};
  const tempo = config.tempo || 80;
  const correctBeats = question?.correctBeats;
  const choices = question?.choices || [];
  const correctIndex = question?.correctIndex ?? -1;

  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  // D-13: shared audio prewarm — replaces inline initializeAudioContext+resumeAudioContext
  // (was insufficient: didn't await loadPianoSound or run warmup oscillator,
  // causing UAT issue 7 — first Listen click silent inside MixedLessonGame).
  const ensureAudioReady = useEnsureAudioReady(
    audioEngine,
    getOrCreateAudioContext
  );

  // enginePlayNote wrapper for schedulePatternPlayback
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

  // State
  const [phase, setPhase] = useState(PHASES.LISTEN_PROMPT);
  const [cardStates, setCardStates] = useState([
    "default",
    "default",
    "default",
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasCompletedRef = useRef(false);
  const feedbackTimerRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Play the correct pattern audio
  const playPattern = useCallback(
    async (onDone) => {
      let ctx = audioContextRef.current;
      if (!ctx) ctx = getOrCreateAudioContext();
      if (!ctx || !correctBeats || correctBeats.length === 0) {
        onDone?.();
        return;
      }

      // Defensive: ensure context is running before scheduling
      if (ctx.state !== "running") {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      const { totalDuration } = schedulePatternPlayback(
        correctBeats,
        tempo,
        ctx,
        enginePlayNote
      );

      feedbackTimerRef.current = setTimeout(
        () => {
          isPlayingRef.current = false;
          setIsPlaying(false);
          onDone?.();
        },
        (totalDuration + 0.3) * 1000
      );
    },
    [
      audioContextRef,
      getOrCreateAudioContext,
      correctBeats,
      tempo,
      enginePlayNote,
    ]
  );

  // Handle "Listen" button tap
  const handleListen = useCallback(async () => {
    // D-13: single source of truth for audio prewarm (await resume + loadPianoSound + warmup).
    const ready = await ensureAudioReady();
    if (!ready) {
      // Audio pipeline not ready (e.g., iOS interrupted state). Surface silently;
      // the user can tap Listen again or rely on existing AudioInterruptedOverlay
      // recovery flow.
      return;
    }
    setPhase(PHASES.LISTENING);
    await playPattern(() => {
      setPhase(PHASES.CHOOSING);
    });
  }, [ensureAudioReady, playPattern]);

  // Handle replay during choosing
  const handleReplay = useCallback(() => {
    if (isPlayingRef.current || phase !== PHASES.CHOOSING) return;
    playPattern(() => {});
  }, [phase, playPattern]);

  // Handle card selection
  const handleCardSelect = useCallback(
    (cardIdx) => {
      if (phase !== PHASES.CHOOSING || hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setPhase(PHASES.FEEDBACK);

      const isCorrect = cardIdx === correctIndex;

      if (isCorrect) {
        playCorrectSound();
        const newStates = ["dimmed", "dimmed", "dimmed"];
        newStates[correctIndex] = "correct";
        setCardStates(newStates);

        feedbackTimerRef.current = setTimeout(() => {
          setPhase(PHASES.DONE);
          onComplete(1, 1);
        }, 800);
      } else {
        playWrongSound();
        const newStates = ["dimmed", "dimmed", "dimmed"];
        newStates[cardIdx] = "wrong";
        newStates[correctIndex] = "correct";
        setCardStates(newStates);

        feedbackTimerRef.current = setTimeout(() => {
          setPhase(PHASES.DONE);
          onComplete(0, 1);
        }, 1200);
      }
    },
    [phase, correctIndex, playCorrectSound, playWrongSound, onComplete]
  );

  // No data guard
  if (!correctBeats || choices.length === 0) return null;

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      role="main"
      aria-label={t(
        "game.rhythmDictation.ariaLabel",
        "Rhythm dictation exercise"
      )}
    >
      {/* Instruction text */}
      <p className="text-center text-lg font-semibold text-white">
        {phase === PHASES.LISTEN_PROMPT &&
          t(
            "game.rhythmDictation.listenPrompt",
            "Listen to the pattern, then pick the matching notation"
          )}
        {phase === PHASES.LISTENING &&
          t("game.rhythmDictation.listening", "Listening...")}
        {phase === PHASES.CHOOSING &&
          t("game.rhythmDictation.choosePrompt", "Which pattern did you hear?")}
        {phase === PHASES.FEEDBACK && ""}
      </p>

      {/* Listen / Replay button */}
      {(phase === PHASES.LISTEN_PROMPT || phase === PHASES.CHOOSING) && (
        <button
          onClick={phase === PHASES.LISTEN_PROMPT ? handleListen : handleReplay}
          disabled={isPlaying}
          className={[
            "flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3",
            "text-white transition-colors duration-150",
            isPlaying
              ? "cursor-default opacity-60"
              : "cursor-pointer hover:border-white/40 hover:bg-white/20",
          ].join(" ")}
          aria-label={
            phase === PHASES.LISTEN_PROMPT
              ? t("game.rhythmDictation.listenButton", "Listen to the pattern")
              : t("game.rhythmDictation.replayButton", "Replay pattern")
          }
        >
          {phase === PHASES.LISTEN_PROMPT ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <RotateCcw className="h-5 w-5" />
          )}
          <span className="font-medium">
            {isPlaying
              ? t("game.rhythmDictation.playingLabel", "Playing...")
              : phase === PHASES.LISTEN_PROMPT
                ? t("game.rhythmDictation.listenLabel", "Listen")
                : t("game.rhythmDictation.replayLabel", "Replay")}
          </span>
        </button>
      )}

      {/* Choice cards — always visible so user sees what they're picking */}
      <div className="flex w-full max-w-md flex-col gap-3">
        {choices.map((choiceBeats, idx) => (
          <DictationChoiceCard
            key={idx}
            beats={choiceBeats}
            timeSignature={config.timeSignature || "4/4"}
            cardIndex={idx}
            state={cardStates[idx]}
            onSelect={handleCardSelect}
            disabled={phase !== PHASES.CHOOSING}
            showSyllables={false}
            language={syllableLanguage}
          />
        ))}
      </div>
    </div>
  );
}
