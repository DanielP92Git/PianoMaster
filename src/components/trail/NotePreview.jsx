/**
 * NotePreview Component
 *
 * Displays a visual preview section for Discovery trail nodes:
 *   - Staff SVG images showing where each focus note lives on the staff
 *   - A mini piano keyboard highlighting the corresponding keys
 *
 * Only renders when node.noteConfig.focusNotes is non-empty.
 * Staff images are loaded lazily via dynamic import() to avoid bundling
 * gameSettings.js into the trail chunk on initial load.
 *
 * Props:
 *   node {object}  Full trail node object (may be any nodeType; component self-gates)
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MiniKeyboard from "./MiniKeyboard";

const NotePreview = ({ node }) => {
  const { t, i18n } = useTranslation("trail");
  const [noteComponents, setNoteComponents] = useState(null);
  const isHebrew = i18n.language?.startsWith("he");

  const focusNotes = node?.noteConfig?.focusNotes;
  const clef = node?.noteConfig?.clef || "treble";

  // Only load for Discovery nodes that have focusNotes
  useEffect(() => {
    if (!focusNotes?.length) return;

    let cancelled = false;

    import(
      /* webpackChunkName: "game-settings" */
      "../games/sight-reading-game/constants/gameSettings"
    )
      .then((mod) => {
        if (cancelled) return;
        const notes = clef === "bass" ? mod.BASS_NOTES : mod.TREBLE_NOTES;
        setNoteComponents(notes);
      })
      .catch(() => {
        // Silently ignore load failures — preview is non-critical
        if (!cancelled) setNoteComponents([]);
      });

    return () => {
      cancelled = true;
    };
  }, [focusNotes, clef]);

  // Self-gate: don't render for non-Discovery nodes or nodes without focusNotes
  if (!focusNotes?.length) return null;

  // Build the list of SVG components for the focus notes
  const svgItems = noteComponents
    ? focusNotes.map((pitch) => {
        const found = noteComponents.find((n) => n.pitch === pitch);
        return { pitch, ImageComponent: found?.ImageComponent || null };
      })
    : null;

  return (
    <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3">
      {/* Staff preview heading */}
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-white/60">
        {t("modal.notePreview", { defaultValue: "On the Staff" })}
      </p>

      {/* Staff SVG images */}
      <div className="mb-3 flex justify-center gap-4">
        {svgItems === null
          ? // Loading placeholder — matches the size of a note SVG
            focusNotes.map((pitch) => (
              <div
                key={pitch}
                className="h-28 w-20 animate-pulse rounded-lg bg-white/5"
                aria-hidden="true"
              />
            ))
          : svgItems.map(({ pitch, ImageComponent }) =>
              ImageComponent ? (
                <div
                  key={pitch}
                  className="flex h-28 w-20 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                >
                  <ImageComponent aria-hidden="true" />
                </div>
              ) : (
                // No image for this pitch — render a labelled placeholder
                <div
                  key={pitch}
                  className="flex h-28 w-20 items-center justify-center rounded-lg bg-white/5"
                >
                  <span className="text-xs font-medium text-white/40">
                    {pitch}
                  </span>
                </div>
              )
            )}
      </div>

      {/* Keyboard preview heading */}
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-white/60">
        {t("modal.keyboardPreview", { defaultValue: "On the Piano" })}
      </p>

      {/* Mini keyboard */}
      <MiniKeyboard focusNotes={focusNotes} clef={clef} isHebrew={isHebrew} />
    </div>
  );
};

export default NotePreview;
