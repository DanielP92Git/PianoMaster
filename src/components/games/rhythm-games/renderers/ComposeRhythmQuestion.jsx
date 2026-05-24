/**
 * ComposeRhythmQuestion.jsx
 *
 * Creative milestone renderer for MixedLessonGame — used by Rhythm Unit 8
 * Node 5 "Build a Syncopation."
 *
 * The child taps tiles from a palette (each tile is a 1-bar rhythm shape)
 * into a configurable number of slots (default 2 → a 2-bar phrase). When
 * all slots are filled they can press Play to hear the assembled phrase,
 * and Done to advance.
 *
 * Tile-tap interactions only (no drag-and-drop) — keeps interaction simple
 * for 8-year-old learners on touch devices. Tapping a filled slot empties
 * it so children can correct mistakes.
 *
 * Always reports onComplete(slotCount, slotCount) — informational success,
 * mirrors DiscoveryIntroQuestion. The pedagogical grading happens in the
 * follow-up rhythm_tap + rhythm_reading verification questions in Node 5.
 *
 * Authored by quick task 260524-l3r.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, Check } from "lucide-react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import RhythmStaffDisplay from "../components/RhythmStaffDisplay";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";
import { binaryPatternToBeats } from "../utils/rhythmVexflowHelpers";

export default function ComposeRhythmQuestion({
  question,
  isLandscape,
  onComplete,
  disabled,
}) {
  const { t } = useTranslation("common");
  useDeclareNeedsLandscape(false);
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { reduce: reducedMotion } = useMotionTokens();

  const tiles = Array.isArray(question?.tiles) ? question.tiles : [];
  const slotCount = Number.isInteger(question?.slotCount)
    ? question.slotCount
    : 2;
  const tempo = question?.tempo ?? 75;

  // Slots store tile IDs or null. Initialized once.
  const [slots, setSlots] = useState(() =>
    Array.from({ length: slotCount }, () => null)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const hasCompletedRef = useRef(false);

  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  const allSlotsFilled = useMemo(
    () => slots.every((id) => id !== null),
    [slots]
  );

  // Pre-compute beats per tile (memoized to avoid re-derivation on every render).
  const tilesById = useMemo(() => {
    const map = new Map();
    tiles.forEach((tile) => {
      map.set(tile.id, {
        ...tile,
        beats: binaryPatternToBeats(tile.binary || []),
      });
    });
    return map;
  }, [tiles]);

  const enginePlayNote = useCallback(
    (_note, opts) => {
      if (audioEngine?.createPianoSound) {
        audioEngine.createPianoSound(
          opts?.startTime,
          0.8,
          opts?.duration ?? 0.4
        );
      }
    },
    [audioEngine]
  );

  // Click handler — fill first empty slot, or no-op if full.
  const handleTileClick = useCallback(
    (tileId) => {
      if (disabled) return;
      setSlots((prev) => {
        const firstEmpty = prev.findIndex((id) => id === null);
        if (firstEmpty === -1) return prev;
        const next = prev.slice();
        next[firstEmpty] = tileId;
        return next;
      });
    },
    [disabled]
  );

  // Click on a filled slot empties it (lets the child correct mistakes).
  const handleSlotClick = useCallback(
    (slotIdx) => {
      if (disabled) return;
      setSlots((prev) => {
        if (prev[slotIdx] === null) return prev;
        const next = prev.slice();
        next[slotIdx] = null;
        return next;
      });
    },
    [disabled]
  );

  // Concatenate beats across filled slots and schedule audio playback.
  const handlePlay = useCallback(async () => {
    if (disabled || !allSlotsFilled || isPlaying) return;
    setIsPlaying(true);

    try {
      await audioEngine.initializeAudioContext?.();
      await audioEngine.resumeAudioContext?.();
    } catch {
      getOrCreateAudioContext();
    }

    let ctx = audioContextRef.current;
    if (!ctx) ctx = getOrCreateAudioContext();
    if (!ctx) {
      setIsPlaying(false);
      return;
    }

    const concatenatedBeats = slots.flatMap((id) => {
      const tile = tilesById.get(id);
      return tile ? tile.beats : [];
    });

    const { totalDuration } = schedulePatternPlayback(
      concatenatedBeats,
      tempo,
      ctx,
      enginePlayNote
    );
    setTimeout(
      () => setIsPlaying(false),
      Math.max(300, (totalDuration + 0.3) * 1000)
    );
  }, [
    disabled,
    allSlotsFilled,
    isPlaying,
    audioEngine,
    audioContextRef,
    getOrCreateAudioContext,
    slots,
    tilesById,
    tempo,
    enginePlayNote,
  ]);

  // "I'm done" → report informational success exactly once.
  const handleDone = useCallback(() => {
    if (disabled || !allSlotsFilled || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete(slotCount, slotCount);
  }, [disabled, allSlotsFilled, slotCount, onComplete]);

  // ─── Layout ─────────────────────────────────────────────────────────
  const wrapperClass = isLandscape
    ? "flex w-full flex-col items-center gap-3"
    : "flex w-full flex-col items-center gap-5";
  const cardClass =
    "flex w-full max-w-3xl flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-6 shadow-lg backdrop-blur-md";
  const slotsRowClass =
    "flex w-full flex-wrap items-center justify-center gap-3";
  const paletteRowClass =
    "flex w-full flex-wrap items-center justify-center gap-3";

  // Slot block — pulsing border when empty (unless reducedMotion).
  const renderSlot = (slotIdx) => {
    const tileId = slots[slotIdx];
    const tile = tileId ? tilesById.get(tileId) : null;
    const filled = Boolean(tile);
    const ariaLabel = filled
      ? `${t("compose.slot.filled", "Tap to remove")} — ${tile?.label ?? tileId}`
      : t("compose.slot.empty", "Tap a tile");
    const baseClass =
      "flex min-h-[88px] min-w-[140px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-2 transition-colors";
    const fillClass = filled
      ? "border-indigo-300 bg-white/15 cursor-pointer"
      : `border-dashed border-white/40 bg-white/5 ${reducedMotion ? "" : "animate-pulse"}`;
    return (
      <button
        key={`slot-${slotIdx}`}
        type="button"
        data-testid={`slot-${slotIdx}`}
        data-tile-id={tileId ?? ""}
        aria-label={ariaLabel}
        onClick={() => handleSlotClick(slotIdx)}
        disabled={disabled || !filled}
        className={`${baseClass} ${fillClass}`}
      >
        {filled ? (
          <>
            <RhythmStaffDisplay
              beats={tile.beats}
              timeSignature="4/4"
              measures={1}
            />
            <span className="text-xs font-medium text-white/70">
              {tile.label ?? tile.id}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-white/60">
            {t("compose.slot.empty", "Tap a tile")}
          </span>
        )}
      </button>
    );
  };

  // Tile preview — minimum 44px tap target per design system.
  const renderTile = (tile) => (
    <button
      key={tile.id}
      type="button"
      data-testid={`tile-${tile.id}`}
      aria-label={`${t("compose.palette", "Your tiles")}: ${tile.label ?? tile.id}`}
      onClick={() => handleTileClick(tile.id)}
      disabled={disabled}
      className="flex min-h-[88px] min-w-[140px] flex-col items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white shadow-sm transition hover:bg-white/15 disabled:opacity-50"
    >
      <RhythmStaffDisplay
        beats={tile.beats || binaryPatternToBeats(tile.binary || [])}
        timeSignature="4/4"
        measures={1}
      />
      <span className="text-xs font-medium text-white/80">
        {tile.label ?? tile.id}
      </span>
    </button>
  );

  return (
    <div
      className={wrapperClass}
      role="main"
      aria-label={t("compose.instruction", "Pick 2 tiles to build your rhythm")}
    >
      <div className={cardClass}>
        {/* Instruction */}
        <p className="text-center text-base font-medium text-white">
          {t("compose.instruction", "Pick 2 tiles to build your rhythm")}
        </p>

        {/* Slots row (the phrase being composed) */}
        <div
          className={slotsRowClass}
          aria-label={t("compose.slot.empty", "Tap a tile")}
        >
          {Array.from({ length: slotCount }, (_, idx) => renderSlot(idx))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePlay}
            disabled={disabled || !allSlotsFilled || isPlaying}
            aria-label={t("compose.play", "Play your rhythm")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {t("compose.play", "Play your rhythm")}
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={disabled || !allSlotsFilled}
            aria-label={t("compose.done", "I'm done!")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-green-300/40 bg-green-500/20 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("compose.done", "I'm done!")}
          </button>
        </div>

        {/* Palette of available tiles */}
        <div className="flex w-full flex-col items-center gap-2 pt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">
            {t("compose.palette", "Your tiles")}
          </p>
          <div className={paletteRowClass}>{tiles.map(renderTile)}</div>
        </div>
      </div>
    </div>
  );
}
