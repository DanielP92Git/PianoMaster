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
import { Trans, useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO, getSyllable } from "../utils/durationInfo";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";
import { binaryPatternToBeats } from "../utils/rhythmVexflowHelpers";
import { RhythmStaffDisplay } from "../components/RhythmStaffDisplay";
import BeamedSixteenthsIcon from "../../../../assets/musicSymbols/beamed-sixteenths.svg?react";

// Discovery intro shows the duration the way kids will encounter it in music.
// Sixteenths always appear beamed in beginner curricula, so override the
// single-flag glyph from SVG_COMPONENTS for the "16" focus.
const DISCOVERY_SVG_OVERRIDES = {
  16: BeamedSixteenthsIcon,
};

export default function DiscoveryIntroQuestion({
  question,
  isLandscape,
  onComplete,
  disabled,
}) {
  const { t, i18n } = useTranslation("common");
  // Single intro card always fits portrait — declare false (CORE-01).
  useDeclareNeedsLandscape(false);
  const syllableLanguage = i18n.language?.startsWith("he") ? "he" : "en";
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { reduce: reducedMotion } = useMotionTokens();
  const [isPlaying, setIsPlaying] = useState(false);
  const hasCompletedRef = useRef(false);

  // A discovery card teaches either a single duration (focusDuration) OR a
  // rhythmic figure (focusPattern). The pattern path renders a VexFlow staff
  // and plays back the figure as audio at the node tempo. Used by Unit 8 to
  // introduce q-h-q and the syncopated 8-q-8 family — both of which are
  // multi-note figures, not single durations the child hasn't seen.
  const focusPattern = question?.focusPattern;
  const focusDuration = question?.focusDuration;
  const info = DURATION_INFO[focusDuration];
  const SvgIcon =
    DISCOVERY_SVG_OVERRIDES[focusDuration] || SVG_COMPONENTS[focusDuration];
  const isWideGlyph = focusDuration === "16";

  // Override key resolves from focusPattern.id when in pattern mode, else
  // from focusDuration. e.g. "qhq" → game.discovery.titleOverride.qhq.
  const overrideKey = focusPattern?.id || focusDuration;
  const titleOverrideKey = `game.discovery.titleOverride.${overrideKey}`;
  const syllableOverrideKey = `game.discovery.syllableOverride.${overrideKey}`;
  const hasTitleOverride = i18n.exists(titleOverrideKey, { ns: "common" });
  const hasSyllableOverride = i18n.exists(syllableOverrideKey, {
    ns: "common",
  });
  const baseSyllable = getSyllable(focusDuration, syllableLanguage);
  const syllable = hasSyllableOverride ? t(syllableOverrideKey) : baseSyllable;
  const durationName = info
    ? t(`rhythm.duration.${info.i18nKey?.split(".").pop()}`, info.i18nKey)
    : "";

  // Beats for the pattern path — derived once from the binary array. Empty
  // array when in single-duration mode (the existing code path).
  const patternBeats = focusPattern
    ? binaryPatternToBeats(focusPattern.binary)
    : null;
  const patternTempo = focusPattern?.tempo || 80;
  const patternTimeSignature = focusPattern?.timeSignature || "4/4";

  // Use a moderate tempo for the audio demo (pattern mode uses node tempo
  // so the kid hears the figure at the speed they'll be tapping it).
  const audioEngine = useAudioEngine(patternTempo, {
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

    // Pattern path — play the figure (q-h-q, syn-syn, ...) at node tempo.
    if (patternBeats) {
      const { totalDuration } = schedulePatternPlayback(
        patternBeats,
        patternTempo,
        ctx,
        enginePlayNote
      );
      setTimeout(() => setIsPlaying(false), (totalDuration + 0.3) * 1000);
      return;
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
    patternBeats,
    patternTempo,
  ]);

  const handleGotIt = useCallback(() => {
    if (hasCompletedRef.current || disabled) return;
    hasCompletedRef.current = true;
    onComplete(1, 1);
  }, [onComplete, disabled]);

  // Need either a pattern to render via VexFlow or a single-duration SVG.
  if (!patternBeats && (!info || !SvgIcon)) return null;

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
    ? "text-start text-lg font-bold text-white"
    : "text-center text-xl font-bold text-white";
  // SVG bumps for tablet (D-07, CORE-01). Literal class strings for purge safety.
  // Wide glyphs (e.g. 4 beamed sixteenths, aspect ~1.6) need a horizontal box.
  const svgClass = isWideGlyph
    ? isLandscape
      ? "h-16 w-40 md:h-24 md:w-56 lg:h-28 lg:w-64"
      : "h-20 w-48 md:h-28 md:w-64 lg:h-32 lg:w-72"
    : isLandscape
      ? "h-24 w-16 md:h-40 md:w-28 lg:h-48 lg:w-32"
      : "h-40 w-28 md:h-56 md:w-40 lg:h-64 lg:w-44";
  const syllableClass = isLandscape
    ? "text-start text-base text-white/70"
    : "text-center text-lg text-white/70";
  const listenBtnPadding = isLandscape ? "px-4 py-2" : "px-5 py-3";
  const listenBtnAlign = isLandscape ? " self-start" : "";
  const gotItBtnSize = isLandscape
    ? "mt-1 w-full py-2.5 text-base"
    : "mt-2 w-full py-4 text-lg";

  // Title element — kept first in DOM order via the `title` variable so the
  // horizontal layout still renders the heading before the syllable for SR users.
  // The duration name inside the title is accent-colored via a <Trans> tag.
  const title = (
    <h2 className={titleClass}>
      {hasTitleOverride ? (
        <Trans
          t={t}
          i18nKey={titleOverrideKey}
          components={{ accent: <span className="text-indigo-300" /> }}
        />
      ) : (
        <Trans
          t={t}
          i18nKey="game.discovery.meetNew"
          defaults="Meet the <accent>{{name}}</accent>!"
          values={{ name: durationName }}
          components={{ accent: <span className="text-indigo-300" /> }}
        />
      )}
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
        {/* Figure preview (left column in landscape, top in portrait).
            Pattern mode renders a VexFlow staff; single-duration mode renders
            the existing SVG glyph. */}
        <div
          dir="ltr"
          className={`flex items-center justify-center text-white${!reducedMotion ? " animate-fadeIn" : ""}`}
        >
          {patternBeats ? (
            <div
              className={
                isLandscape ? "w-72 md:w-80 lg:w-96" : "w-72 md:w-80 lg:w-96"
              }
              aria-hidden="true"
            >
              <RhythmStaffDisplay
                beats={patternBeats}
                timeSignature={patternTimeSignature}
              />
            </div>
          ) : (
            <SvgIcon className={svgClass} aria-hidden="true" />
          )}
        </div>

        {/* Right column wrapper (landscape) — title + name + syllable + buttons.
            In portrait, `contents` makes this wrapper transparent so children
            participate in the parent flex column directly. */}
        <div className={rightColClass}>
          {/* Title */}
          {title}

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
