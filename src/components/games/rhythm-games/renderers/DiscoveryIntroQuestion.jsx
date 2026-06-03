/**
 * DiscoveryIntroQuestion.jsx
 *
 * Informational intro card renderer for MixedLessonGame discovery nodes.
 *
 * Uniform 3-step flow (one card per step) for EVERY rhythm intro instance —
 * single durations, rests, meters (3/4, 6/8), and pattern figures (q-h-q,
 * syncopation). The three steps, in order:
 *   1. notation — see the new value the way it looks in music (glyph or staff)
 *   2. syllable — say it out loud (Kodaly syllable / count)
 *   3. playback — hear it (Listen) and confirm (Got it!)
 *
 * Always reports onComplete(1, 1) on the final card — informational, always
 * "correct."
 */

import { useState, useCallback, useEffect, useRef } from "react";
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

// Every rhythm intro walks the same three steps so the experience is identical
// across units (D-07 / user-confirmed restructure). One card per step.
const STEPS = ["notation", "syllable", "playback"];

// Meter concepts (3/4, 6/8) are not single durations — they have no glyph and
// no DURATION_INFO entry. Render them as a representative one-bar figure on a
// staff so the notation card has something to show, and play that bar on the
// playback card. The staff also carries the time signature, which IS the new
// thing the child is meeting.
const METER_FIGURES = {
  "3_4": { units: [4, 4, 4], timeSignature: "3/4", tempo: 96 }, // three quarters
  "6_8": { units: [2, 2, 2, 2, 2, 2], timeSignature: "6/8", tempo: 112 }, // six eighths (2 groups of 3)
};

// A rest is silent, so playing it alone teaches nothing. On the playback card we
// put each rest in a tiny musical context and play it against a steady metronome
// so the child hears the pulse continue through the silence while the rest symbol
// is highlighted. Beats are { durationUnits, isRest }: q=4, qr=4(rest), h=8,
// hr=8(rest), wr=16(rest). Each figure fills whole 4/4 measure(s).
const N = (durationUnits) => ({ durationUnits, isRest: false });
const R = (durationUnits) => ({ durationUnits, isRest: true });
const REST_CONTEXT_FIGURES = {
  qr: { beats: [N(4), R(4), N(4), N(4)], timeSignature: "4/4", measures: 1 }, // ♩ 𝄽 ♩ ♩
  hr: { beats: [N(4), N(4), R(8)], timeSignature: "4/4", measures: 1 }, // ♩ ♩ 𝄼
  wr: {
    beats: [N(4), N(4), N(4), N(4), R(16)],
    timeSignature: "4/4",
    measures: 2,
  }, // ♩♩♩♩ | 𝄻
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
  // Index of the symbol currently sounding during rest-context playback (recolor).
  const [activeNoteIndex, setActiveNoteIndex] = useState(null);
  const hasCompletedRef = useRef(false);
  // Pending setTimeout ids for rest-context highlight stepping + end cleanup.
  const restTimersRef = useRef([]);

  // A discovery card teaches either a single duration (focusDuration), a meter
  // concept (3/4, 6/8 via METER_FIGURES), or a rhythmic figure (focusPattern).
  // Meters and patterns render a VexFlow staff; single durations render a glyph.
  const focusPattern = question?.focusPattern;
  const focusDuration = question?.focusDuration;
  const focusPatternId = focusPattern?.id ?? null;
  const info = DURATION_INFO[focusDuration];
  // Rests get a metronome-backed context figure on the playback card (only).
  const restFigure = info?.isRest ? REST_CONTEXT_FIGURES[focusDuration] : null;

  // Multi-card pagination state — every instance walks the same 3 steps.
  const cardKinds = STEPS;
  const [cardIndex, setCardIndex] = useState(0);
  // Clear any pending rest-context highlight timers and reset the highlight.
  const clearRestTimers = useCallback(() => {
    restTimersRef.current.forEach(clearTimeout);
    restTimersRef.current = [];
    setActiveNoteIndex(null);
  }, []);

  // Reset pagination when the question prop changes — avoids stale cardIndex
  // across MixedLessonGame re-renders within the same renderer.
  useEffect(() => {
    setCardIndex(0);
    hasCompletedRef.current = false;
    clearRestTimers();
  }, [focusDuration, focusPatternId, clearRestTimers]);

  // Leaving a card mid-playback should cancel the highlight stepping.
  useEffect(() => {
    clearRestTimers();
  }, [cardIndex, clearRestTimers]);

  // Cancel timers on unmount.
  useEffect(() => () => restTimersRef.current.forEach(clearTimeout), []);

  const isLastCard = cardIndex >= cardKinds.length - 1;
  const currentKind = cardKinds[cardIndex] ?? "notation";
  const SvgIcon =
    DISCOVERY_SVG_OVERRIDES[focusDuration] || SVG_COMPONENTS[focusDuration];
  const isWideGlyph = focusDuration === "16";

  // --- Figure (staff) derivation: pattern OR meter both render on a staff ---
  const patternBeats = focusPattern
    ? binaryPatternToBeats(focusPattern.binary)
    : null;
  const meterFigure = METER_FIGURES[focusDuration] || null;
  const meterBeats = meterFigure
    ? meterFigure.units.map((d) => ({ durationUnits: d, isRest: false }))
    : null;
  const figureBeats = patternBeats || meterBeats;
  const figureTimeSignature = patternBeats
    ? focusPattern?.timeSignature || "4/4"
    : meterFigure?.timeSignature || "4/4";
  // Pattern mode uses node tempo so the kid hears the figure at tapping speed;
  // meters use a child-friendly default; single durations use a moderate 80.
  const figureTempo = focusPattern?.tempo || meterFigure?.tempo || 80;

  // --- Title / syllable resolution (per-concept copy where it exists) ---
  // titleOverride wins (preserves 16/qhq/synsyn wording); else the per-concept
  // "meet" card title (covers all single durations, rests, and meters); else
  // the generic "Meet the {{name}}!".
  const overrideKey = focusPatternId || focusDuration;
  const titleOverrideKey = `game.discovery.titleOverride.${overrideKey}`;
  const syllableOverrideKey = `game.discovery.syllableOverride.${overrideKey}`;
  const meetTitleKey = `game.discovery.cards.${focusDuration}.meet.title`;
  const meetBodyKey = `game.discovery.cards.${focusDuration}.meet.body`;
  const hasTitleOverride = i18n.exists(titleOverrideKey, { ns: "common" });
  const hasSyllableOverride = i18n.exists(syllableOverrideKey, {
    ns: "common",
  });
  const hasMeetTitle =
    !focusPatternId && i18n.exists(meetTitleKey, { ns: "common" });
  const hasMeetBody =
    !focusPatternId && i18n.exists(meetBodyKey, { ns: "common" });

  const baseSyllable = getSyllable(focusDuration, syllableLanguage);
  const syllable = hasSyllableOverride ? t(syllableOverrideKey) : baseSyllable;
  const durationName = info
    ? t(`rhythm.duration.${info.i18nKey?.split(".").pop()}`, info.i18nKey)
    : "";

  // Use figureTempo so the demo plays patterns/meters at the right speed.
  const audioEngine = useAudioEngine(figureTempo, {
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

  // Play a demo sound for the value using real piano samples
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

    // Figure path — play the bar (q-h-q, syn-syn, 3/4, 6/8, ...) at its tempo.
    if (figureBeats) {
      const { totalDuration } = schedulePatternPlayback(
        figureBeats,
        figureTempo,
        ctx,
        enginePlayNote
      );
      setTimeout(() => setIsPlaying(false), (totalDuration + 0.3) * 1000);
      return;
    }

    const units = info?.durationUnits || 4;
    const isBeamedPair = focusDuration === "8_pair";
    const isRest = info?.isRest;

    if (isRest && restFigure) {
      // Rests are silent, so play a short context figure against a steady
      // metronome — the child hears the pulse continue through the silence while
      // the rest symbol is highlighted. Notes sound; rests are silent offsets.
      clearRestTimers();
      const LEAD = 0.15;
      const startTime = ctx.currentTime + LEAD;
      const beatDur = 60 / figureTempo;

      const { totalDuration } = schedulePatternPlayback(
        restFigure.beats,
        figureTempo,
        ctx,
        enginePlayNote,
        startTime
      );

      // Steady metronome click on every quarter-beat (incl. silent rest beats).
      const numerator =
        parseInt(restFigure.timeSignature.split("/")[0], 10) || 4;
      const totalUnits = restFigure.beats.reduce(
        (s, b) => s + b.durationUnits,
        0
      );
      const quarterBeats = Math.round(totalUnits / 4);
      for (let b = 0; b < quarterBeats; b++) {
        audioEngine.createMetronomeClick?.(
          startTime + b * beatDur,
          b % numerator === 0
        );
      }

      // Step the symbol highlight at each beat-symbol onset (aligned to LEAD).
      let acc = 0;
      restFigure.beats.forEach((beat, i) => {
        const onsetSec = (acc / 4) * beatDur;
        const id = setTimeout(
          () => setActiveNoteIndex(i),
          (LEAD + onsetSec) * 1000
        );
        restTimersRef.current.push(id);
        acc += beat.durationUnits;
      });

      const endId = setTimeout(
        () => {
          setActiveNoteIndex(null);
          setIsPlaying(false);
        },
        (LEAD + totalDuration) * 1000 + 300
      );
      restTimersRef.current.push(endId);
      return;
    } else if (isRest) {
      // Fallback (rest code without a context figure): short click then silence.
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
    figureBeats,
    figureTempo,
    restFigure,
    clearRestTimers,
  ]);

  // Unified primary handler — advances cardIndex on non-final cards, completes
  // the question on the final card. hasCompletedRef guards re-entry.
  const handleNext = useCallback(() => {
    if (disabled) return;
    if (hasCompletedRef.current) return;
    if (isLastCard) {
      hasCompletedRef.current = true;
      onComplete(1, 1);
    } else {
      setCardIndex((i) => i + 1);
    }
  }, [isLastCard, onComplete, disabled]);

  // Need either a figure (pattern/meter staff) or a single-duration glyph.
  if (!figureBeats && (!info || !SvgIcon)) return null;

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
  const bodyClass = isLandscape
    ? "text-start text-sm text-white/70"
    : "text-center text-base text-white/70";
  // SVG bumps for tablet (D-07, CORE-01). Literal class strings for purge safety.
  // Wide glyphs (e.g. 4 beamed sixteenths, aspect ~1.6) need a horizontal box.
  const svgClass = isWideGlyph
    ? isLandscape
      ? "h-16 w-40 md:h-24 md:w-56 lg:h-28 lg:w-64"
      : "h-20 w-48 md:h-28 md:w-64 lg:h-32 lg:w-72"
    : isLandscape
      ? "h-24 w-16 md:h-40 md:w-28 lg:h-48 lg:w-32"
      : "h-40 w-28 md:h-56 md:w-40 lg:h-64 lg:w-44";
  // Syllable is the hero of the syllable card — render it large and bold.
  const syllableClass = isLandscape
    ? "text-start text-xl font-bold text-white"
    : "text-center text-2xl font-bold text-white";
  const listenBtnPadding = isLandscape ? "px-4 py-2" : "px-5 py-3";
  const listenBtnAlign = isLandscape ? " self-start" : "";
  const gotItBtnSize = isLandscape
    ? "mt-1 w-full py-2.5 text-base"
    : "mt-2 w-full py-4 text-lg";
  // Staff figure wrapper. Portrait must be fluid (w-full) so the staff shrinks to
  // the card's content width on narrow phones — fixed widths (w-72 = 288px) overflow
  // the card's right edge once the content area drops below that. Landscape keeps
  // fixed sizing since the horizontal split has room and avoids stretching.
  const figureWrapperClass = isLandscape
    ? "w-72 md:w-80 lg:w-96"
    : "w-full max-w-sm";

  // Notation card title — titleOverride > per-concept meet.title > generic.
  // Kept first in DOM order so the horizontal layout reads heading-first for SR.
  const notationTitle = (
    <h2 className={titleClass}>
      {hasTitleOverride ? (
        <Trans
          t={t}
          i18nKey={titleOverrideKey}
          components={{ accent: <span className="text-indigo-300" /> }}
        />
      ) : hasMeetTitle ? (
        <Trans
          t={t}
          i18nKey={meetTitleKey}
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

  // Per-step heading + supporting copy.
  let cardTitle;
  let cardBody;
  if (currentKind === "notation") {
    cardTitle = notationTitle;
    cardBody = hasMeetBody ? (
      <p className={bodyClass}>
        <Trans
          t={t}
          i18nKey={meetBodyKey}
          components={{ accent: <span className="text-indigo-300" /> }}
        />
      </p>
    ) : null;
  } else if (currentKind === "syllable") {
    cardTitle = (
      <h2 className={titleClass}>
        {t("game.discovery.steps.syllable.title", "How to say it")}
      </h2>
    );
    cardBody = (
      <p className={bodyClass}>
        {t(
          "game.discovery.steps.syllable.body",
          "Say it out loud with the beat — saying the rhythm helps you feel it!"
        )}
      </p>
    );
  } else {
    cardTitle = (
      <h2 className={titleClass}>
        {t("game.discovery.steps.playback.title", "How it sounds")}
      </h2>
    );
    cardBody = (
      <p className={bodyClass}>
        {info?.isRest
          ? t(
              "game.discovery.steps.playback.restBody",
              "This beat is silent — listen to the clicks keep the beat going, and watch the rest light up!"
            )
          : t(
              "game.discovery.steps.playback.body",
              "Tap the Listen button to hear it, then try to feel the beat."
            )}
      </p>
    );
  }

  return (
    <div
      className={wrapperClass}
      role="main"
      aria-label={t("game.discovery.ariaLabel", "Meet a new rhythm")}
    >
      {/* Glass card */}
      <div className={cardClass}>
        {/* Figure preview (left column in landscape, top in portrait).
            Meter/pattern modes render a VexFlow staff; single-duration mode
            renders the SVG glyph. Rests show their context figure on the
            playback card only (cards 1-2 keep the big standalone glyph). */}
        <div
          dir="ltr"
          className={`flex items-center justify-center text-white${!reducedMotion ? " animate-fadeIn" : ""}`}
        >
          {restFigure && currentKind === "playback" ? (
            <div className={figureWrapperClass} aria-hidden="true">
              <RhythmStaffDisplay
                beats={restFigure.beats}
                timeSignature={restFigure.timeSignature}
                measures={restFigure.measures}
                activeNoteIndex={activeNoteIndex}
                reducedMotion={reducedMotion}
              />
            </div>
          ) : figureBeats ? (
            <div className={figureWrapperClass} aria-hidden="true">
              <RhythmStaffDisplay
                beats={figureBeats}
                timeSignature={figureTimeSignature}
              />
            </div>
          ) : (
            <SvgIcon className={svgClass} aria-hidden="true" />
          )}
        </div>

        {/* Right column wrapper (landscape) — title + body + step content.
            In portrait, `contents` makes this wrapper transparent so children
            participate in the parent flex column directly. */}
        <div className={rightColClass}>
          {/* Per-step heading */}
          {cardTitle}

          {/* Per-step supporting copy */}
          {cardBody}

          {/* Step 2: Kodaly syllable / count — the hero of the syllable card. */}
          {currentKind === "syllable" && (
            <p className={syllableClass}>
              {t("game.discovery.syllable", 'Say: "{{syllable}}"', {
                syllable,
              })}
            </p>
          )}

          {/* Step 3: audio demo button. */}
          {currentKind === "playback" && (
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
              aria-label={t(
                "game.discovery.listenButton",
                "Listen to the sound"
              )}
            >
              <Volume2 className="h-5 w-5" />
              <span className="font-medium">
                {isPlaying
                  ? t("game.discovery.playing", "Playing...")
                  : t("game.discovery.listen", "Listen")}
              </span>
            </button>
          )}

          {/* Primary CTA — advances cardIndex on non-final cards, completes on
              final card. Label switches Next → Got it! on the final step. */}
          <button
            onClick={handleNext}
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
            {isLastCard
              ? t("game.discovery.gotIt", "Got it!")
              : t("game.discovery.cards.nextButton", { defaultValue: "Next" })}
          </button>

          {/* Card progress indicator. Pill highlights the current step. */}
          {cardKinds.length > 1 && (
            <div
              className="mt-2 flex justify-center gap-2"
              aria-label={t("game.discovery.cards.ariaProgress", {
                defaultValue: "Card {{current}} of {{total}}",
                current: cardIndex + 1,
                total: cardKinds.length,
              })}
            >
              {cardKinds.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === cardIndex
                      ? "h-2 w-6 rounded-full bg-indigo-400"
                      : "h-2 w-2 rounded-full bg-white/30"
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
