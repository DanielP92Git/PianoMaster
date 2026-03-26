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

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MiniKeyboard from './MiniKeyboard';

const NotePreview = ({ node }) => {
  const { t } = useTranslation('trail');
  const [noteComponents, setNoteComponents] = useState(null);

  const focusNotes = node?.noteConfig?.focusNotes;
  const clef = node?.noteConfig?.clef || 'treble';

  // Only load for Discovery nodes that have focusNotes
  useEffect(() => {
    if (!focusNotes?.length) return;

    let cancelled = false;

    import(
      /* webpackChunkName: "game-settings" */
      '../games/sight-reading-game/constants/gameSettings'
    )
      .then((mod) => {
        if (cancelled) return;
        const notes = clef === 'bass' ? mod.BASS_NOTES : mod.TREBLE_NOTES;
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5">
      {/* Staff preview heading */}
      <p className="text-xs font-semibold text-white/60 text-center mb-2 uppercase tracking-wide">
        {t('modal.notePreview', { defaultValue: 'On the Staff' })}
      </p>

      {/* Staff SVG images */}
      <div className="flex justify-center gap-4 mb-3">
        {svgItems === null ? (
          // Loading placeholder — matches the size of a note SVG
          focusNotes.map((pitch) => (
            <div
              key={pitch}
              className="w-20 h-28 rounded-lg bg-white/5 animate-pulse"
              aria-hidden="true"
            />
          ))
        ) : (
          svgItems.map(({ pitch, ImageComponent }) =>
            ImageComponent ? (
              <div
                key={pitch}
                className="w-20 h-28 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full"
              >
                <ImageComponent aria-hidden="true" />
              </div>
            ) : (
              // No image for this pitch — render a labelled placeholder
              <div
                key={pitch}
                className="w-20 h-28 flex items-center justify-center rounded-lg bg-white/5"
              >
                <span className="text-white/40 text-xs font-medium">{pitch}</span>
              </div>
            )
          )
        )}
      </div>

      {/* Keyboard preview heading */}
      <p className="text-xs font-semibold text-white/60 text-center mb-2 uppercase tracking-wide">
        {t('modal.keyboardPreview', { defaultValue: 'On the Piano' })}
      </p>

      {/* Mini keyboard */}
      <MiniKeyboard focusNotes={focusNotes} clef={clef} />
    </div>
  );
};

export default NotePreview;
