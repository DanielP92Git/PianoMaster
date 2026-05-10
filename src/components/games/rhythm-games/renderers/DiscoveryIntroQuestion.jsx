/**
 * DiscoveryIntroQuestion.jsx
 *
 * Informational intro card renderer for MixedLessonGame discovery nodes.
 * Shows the new duration concept with its SVG icon, name, Kodaly syllable,
 * and an audio demo button. Child taps "Got it!" to proceed.
 *
 * Always reports onComplete(1, 1) — informational, always "correct."
 */

import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO, getSyllable } from "../utils/durationInfo";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";

export default function DiscoveryIntroQuestion({
  question,
  isLandscape,
  onComplete,
  disabled,
}) {
  const { t } = useTranslation("common");
  // Single intro card always fits portrait — declare false (CORE-01).
  useDeclareNeedsLandscape(false);
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { reduce: reducedMotion } = useMotionTokens();
  const [isPlaying, setIsPlaying] = useState(false);
  const hasCompletedRef = useRef(false);

  const focusDuration = question?.focusDuration;
  const info = DURATION_INFO[focusDuration];
  const SvgIcon = SVG_COMPONENTS[focusDuration];
  const syllable = getSyllable(focusDuration);
  const durationName = info
    ? t(`rhythm.duration.${info.i18nKey?.split(".").pop()}`, info.i18nKey)
    : "";

  // Use a moderate tempo for the audio demo
  const audioEngine = useAudioEngine(80, {
    sharedAudioContext: audioContextRef.current,
  });

  // Piano sound wrapper for schedulePatternPlayback
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

  // Play a demo sound for the duration using real piano samples
  const playDemo = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      await audioEngine.initializeAudioContext();
      await audioEngine.resumeAudioContext();
    } catch {
      getOrCreateAudioContext();
    }

    let ctx = audioContextRef.current;
    if (!ctx) ctx = getOrCreateAudioContext();
    if (!ctx) {
      setIsPlaying(false);
      return;
    }

    // Defensive: ensure context is running
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }

    const units = info?.durationUnits || 4;
    const isBeamedPair = focusDuration === "8_pair";
    const isRest = info?.isRest;

    if (isRest) {
      // For rests, play a short click then silence for the duration
      const masterGain = audioEngine.gainNodeRef?.current;
      if (masterGain) {
        const now = ctx.currentTime + 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(700, now);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.02);
      }
      const beatDur = 60 / 80;
      const demoLength = (units / 4) * beatDur;
      setTimeout(() => setIsPlaying(false), demoLength * 1000 + 200);
    } else {
      // Build beats array based on the focus duration
      let beats;
      if (isBeamedPair) {
        beats = Array.from({ length: 8 }, () => ({
          durationUnits: 2,
          isRest: false,
        }));
      } else if (units === 4) {
        // Quarter: play 4 quarter notes
        beats = Array.from({ length: 4 }, () => ({
          durationUnits: 4,
          isRest: false,
        }));
      } else if (units === 2) {
        // Single eighth: play 4 eighth notes
        beats = Array.from({ length: 4 }, () => ({
          durationUnits: 2,
          isRest: false,
        }));
      } else {
        // Half, whole, dotted: play 1 note of that duration
        beats = [{ durationUnits: units, isRest: false }];
      }

      // Choose playNote function: pitch-alternating for 8_pair, standard for others (D-07)
      let playNoteFn = enginePlayNote;
      if (isBeamedPair) {
        // D-06: high (pitchShift 0) → low (pitchShift -7) alternating pattern
        const noteIndexRef = { current: 0 };
        playNoteFn = (_note, opts) => {
          if (audioEngine?.createPianoSound) {
            const pitchShift = noteIndexRef.current % 2 === 0 ? 0 : -7;
            audioEngine.createPianoSound(
              opts?.startTime,
              0.8,
              opts?.duration ?? 0.3,
              pitchShift
            );
            noteIndexRef.current++;
          }
        };
      }

      const { totalDuration } = schedulePatternPlayback(
        beats,
        80,
        ctx,
        playNoteFn
      );
      setTimeout(() => setIsPlaying(false), (totalDuration + 0.3) * 1000);
    }
  }, [
    isPlaying,
    audioEngine,
    audioContextRef,
    getOrCreateAudioContext,
    focusDuration,
    info,
    enginePlayNote,
  ]);

  const handleGotIt = useCallback(() => {
    if (hasCompletedRef.current || disabled) return;
    hasCompletedRef.current = true;
    onComplete(1, 1);
  }, [onComplete, disabled]);

  if (!info || !SvgIcon) return null;

  // Landscape-aware class sets — landscape compresses paddings/gaps and switches
  // to a horizontal split so the card fits ≤420px-tall mobile-landscape viewports.
  const wrapperClass = isLandscape
    ? "flex w-full flex-col items-center gap-2"
    : "flex w-full flex-col items-center gap-6";
  const cardClass = isLandscape
    ? "flex w-full max-w-2xl flex-row items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg backdrop-blur-md md:max-w-3xl lg:max-w-4xl"
    : "flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/20 bg-white/10 px-8 py-10 shadow-lg backdrop-blur-md md:max-w-md lg:max-w-lg";
  const rightColClass = isLandscape ? "flex flex-1 flex-col gap-2" : "contents";
  const titleClass = isLandscape
    ? "text-left text-lg font-bold text-white"
    : "text-center text-xl font-bold text-white";
  // SVG bumps for tablet (D-07, CORE-01). Literal class strings for purge safety.
  const svgClass = isLandscape
    ? "h-24 w-16 md:h-40 md:w-28 lg:h-48 lg:w-32"
    : "h-40 w-28 md:h-56 md:w-40 lg:h-64 lg:w-44";
  const nameClass = isLandscape
    ? "text-left text-xl font-semibold text-indigo-300"
    : "text-center text-2xl font-semibold text-indigo-300";
  const syllableClass = isLandscape
    ? "text-left text-base text-white/70"
    : "text-center text-lg text-white/70";
  const listenBtnPadding = isLandscape ? "px-4 py-2" : "px-5 py-3";
  const listenBtnAlign = isLandscape ? " self-start" : "";
  const gotItBtnSize = isLandscape
    ? "mt-1 w-full py-2.5 text-base"
    : "mt-2 w-full py-4 text-lg";

  // Title element — kept first in DOM order via the `title` variable so the
  // horizontal layout still renders the heading before name/syllable for SR users.
  const title = (
    <h2 className={titleClass}>
      {t("game.discovery.meetNew", "Meet the {{name}}!", {
        name: durationName,
      })}
    </h2>
  );

  return (
    <div
      className={wrapperClass}
      role="main"
      aria-label={t("game.discovery.ariaLabel", "Meet a new rhythm")}
    >
      {/* Glass card */}
      <div className={cardClass}>
        {/* Large SVG icon (left column in landscape, top in portrait) */}
        <div
          dir="ltr"
          className={`flex items-center justify-center text-white${!reducedMotion ? " animate-fadeIn" : ""}`}
        >
          <SvgIcon className={svgClass} aria-hidden="true" />
        </div>

        {/* Right column wrapper (landscape) — title + name + syllable + buttons.
            In portrait, `contents` makes this wrapper transparent so children
            participate in the parent flex column directly. */}
        <div className={rightColClass}>
          {/* Title */}
          {title}

          {/* Duration name */}
          <p className={nameClass}>{durationName}</p>

          {/* Kodaly syllable */}
          <p className={syllableClass}>
            {t("game.discovery.syllable", 'Say: "{{syllable}}"', { syllable })}
          </p>

          {/* Audio demo button */}
          <button
            onClick={playDemo}
            disabled={isPlaying}
            className={[
              "flex items-center gap-2 rounded-lg border border-white/20 bg-white/10",
              listenBtnPadding,
              "text-white transition-colors duration-150",
              isPlaying
                ? "cursor-default opacity-60"
                : "cursor-pointer hover:border-white/40 hover:bg-white/20",
              listenBtnAlign.trim(),
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={t("game.discovery.listenButton", "Listen to the sound")}
          >
            <Volume2 className="h-5 w-5" />
            <span className="font-medium">
              {isPlaying
                ? t("game.discovery.playing", "Playing...")
                : t("game.discovery.listen", "Listen")}
            </span>
          </button>

          {/* Got it button */}
          <button
            onClick={handleGotIt}
            disabled={disabled}
            className={[
              gotItBtnSize,
              "rounded-xl font-bold text-white",
              "bg-gradient-to-r from-green-500 to-emerald-500",
              "shadow-lg shadow-green-500/30",
              "transition-all duration-150",
              disabled
                ? "cursor-default opacity-50"
                : "cursor-pointer hover:brightness-110 active:scale-[0.97]",
            ].join(" ")}
          >
            {t("game.discovery.gotIt", "Got it!")}
          </button>
        </div>
      </div>
    </div>
  );
}
