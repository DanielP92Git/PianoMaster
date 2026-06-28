import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * FloatingFeedback
 *
 * Animated floating feedback text per D-04 and UI-SPEC.
 * Renders PERFECT/GOOD/MISS text that floats upward and fades out on each tap.
 *
 * Robustness (why a queue, not a single keyed instance):
 * The previous single-instance design revealed itself in two phases — it
 * mounted with `visible=false` (rendered null), then a post-paint effect flipped
 * it visible and a 16ms timer started the float. In the arcade game (RAF tile
 * loop + Web Audio scheduling), the next tap's `key`-remount frequently landed
 * before the prior instance's post-paint render committed, so that tap's text
 * never painted — intermittent dropped feedback, worse on slower phones.
 *
 * This version keeps a QUEUE of independent, self-removing CSS-animated toasts.
 * Each toast is visible on its very first paint, animates declaratively (no JS
 * timing), and new taps add SIBLINGS that never unmount existing ones — removing
 * the remount race entirely. The public prop contract is unchanged, so callers
 * drive it exactly as before (and no longer need a `key={feedbackKey}` wrapper).
 *
 * Props:
 * - quality: 'PERFECT' | 'GOOD' | 'MISS' | null
 * - feedbackKey: increments on each tap/miss; a change appends a new toast
 * - reducedMotion: boolean from AccessibilityContext (fade only, no travel)
 */

const COLOR_CLASS = {
  PERFECT: "text-green-400",
  GOOD: "text-yellow-400",
  MISS: "text-red-400",
};

// Self-removal fallback if `animationend` never fires (a little longer than the
// 800ms CSS animation). Keeps the queue from leaking items.
const REMOVE_FALLBACK_MS = 1000;

// Bound the queue so a burst of rapid taps can't grow it without limit.
const MAX_ITEMS = 5;

/**
 * A single floating feedback toast. Visible on first paint; animates via a pure
 * CSS keyframe (floatUpFade / fadeOnly) and removes itself on animation end,
 * with a setTimeout fallback.
 */
function FeedbackToast({ quality, reducedMotion, label, onDone }) {
  const doneRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, REMOVE_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [onDone]);

  const handleAnimationEnd = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  };

  const colorClass = COLOR_CLASS[quality] || "text-red-400";
  const animationName = reducedMotion ? "fadeOnly" : "floatUpFade";

  return (
    <span
      className={`text-3xl font-bold md:text-4xl ${colorClass}`}
      onAnimationEnd={handleAnimationEnd}
      style={{
        position: "absolute",
        left: "50%",
        bottom: "100%",
        marginBottom: "8px",
        pointerEvents: "none",
        // transform's translateX(-50%) is carried inside the keyframes so the
        // horizontal centering holds across every frame.
        animation: `${animationName} 800ms ease-out forwards`,
      }}
    >
      {label}
    </span>
  );
}

export function FloatingFeedback({
  quality,
  feedbackKey,
  reducedMotion = false,
}) {
  const { t } = useTranslation("common");
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const lastKeyRef = useRef(feedbackKey);

  const labelMap = {
    PERFECT: t("games.rhythmReading.tapArea.accuracy.perfect"),
    GOOD: t("games.rhythmReading.tapArea.accuracy.good"),
    MISS: t("games.rhythmReading.tapArea.accuracy.miss"),
  };

  // Append a new toast whenever feedbackKey changes (i.e. a new tap/miss). Skip
  // the initial render and any no-quality state so nothing pops on mount.
  useEffect(() => {
    if (feedbackKey === lastKeyRef.current) return; // initial mount / no change
    lastKeyRef.current = feedbackKey;
    if (!quality) return;

    const id = idRef.current++;
    setItems((prev) => {
      const next = [...prev, { id, quality }];
      return next.length > MAX_ITEMS
        ? next.slice(next.length - MAX_ITEMS)
        : next;
    });
  }, [feedbackKey, quality]);

  const removeItem = (id) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    // aria-live region so screen readers announce the latest tap result.
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {items.map((item) => (
        <FeedbackToast
          key={item.id}
          quality={item.quality}
          reducedMotion={reducedMotion}
          label={labelMap[item.quality] || item.quality}
          onDone={() => removeItem(item.id)}
        />
      ))}
    </div>
  );
}

export default FloatingFeedback;
