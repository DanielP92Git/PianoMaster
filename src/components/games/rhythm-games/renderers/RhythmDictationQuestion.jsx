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
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { useSounds } from "../../../../features/games/hooks/useSounds";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { DictationChoiceCard } from "../components/DictationChoiceCard";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";
import { needsLandscape as computeNeedsLandscape } from "../utils/needsLandscape";

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

  // Content-driven landscape declaration (CORE-04). Long patterns trigger the
  // rotate prompt; short ones stay in portrait via NeedsLandscapeContext.
  const declaredNeedsLandscape = correctBeats
    ? computeNeedsLandscape(correctBeats, config?.timeSignature || "4/4")
    : false;
  useDeclareNeedsLandscape(declaredNeedsLandscape);

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
      // Schedule against the SAME context the engine plays on. createPianoSound
      // (via enginePlayNote) plays on audioEngine's internal context, so note
      // start times must be computed from THAT context's clock. The provider's
      // shared context can diverge from the engine's context (e.g. the engine
      // fell back to its own owned context), and scheduling against the wrong
      // clock places notes in the past → silent first playback.
      let ctx =
        audioEngine?.audioContextRef?.current || audioContextRef.current;
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
      audioEngine,
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

      {/* Choice cards — 3-card 2x2 grid; last odd card spans both columns
          (D-05/D-06; tablet widths bumped via TABLET-01). Wrapper <div>
          carries the col-span because DictationChoiceCard does not accept
          a passthrough className (Plan 05 owns the card component). */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:gap-4 lg:max-w-4xl lg:gap-6">
        {choices.map((choiceBeats, idx) => {
          const isOddLast =
            idx === choices.length - 1 && choices.length % 2 === 1;
          return (
            <div key={idx} className={isOddLast ? "col-span-2" : undefined}>
              <DictationChoiceCard
                beats={choiceBeats}
                timeSignature={config.timeSignature || "4/4"}
                cardIndex={idx}
                state={cardStates[idx]}
                onSelect={handleCardSelect}
                disabled={phase !== PHASES.CHOOSING}
                showSyllables={false}
                language={syllableLanguage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
