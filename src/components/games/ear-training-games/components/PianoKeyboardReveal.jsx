/**
 * PianoKeyboardReveal.jsx
 *
 * Shared SVG piano keyboard component used by both NoteComparisonGame and IntervalGame.
 * Renders a 1-octave keyboard (7 white keys + 5 black keys) centered around two notes.
 *
 * Design spec: 09-UI-SPEC.md, CONTEXT.md D-01, D-02, D-03, D-08
 */

import { useMemo } from 'react';
import { NOTE_ORDER, getNotesInBetween, getDisplayOctaveRoot } from '../earTrainingUtils';

// Key dimensions (from 09-UI-SPEC.md)
const WHITE_KEY_WIDTH = 28;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 14;
const BLACK_KEY_HEIGHT = 72;
const SVG_WIDTH = 7 * WHITE_KEY_WIDTH; // 196
const SVG_HEIGHT = WHITE_KEY_HEIGHT + 20; // 140 (120 keys + 20 label area)

// Note fill colors per state (from 09-UI-SPEC.md)
const FILL_COLORS = {
  white: {
    default: '#ffffff',
    note1: '#60a5fa',
    note2: '#fb923c',
    between: 'rgba(255,255,255,0.2)',
  },
  black: {
    default: '#1e1b4b',
    note1: '#3b82f6',
    note2: '#ea580c',
    between: 'rgba(255,255,255,0.15)',
  },
};

// Label colors
const LABEL_COLORS = {
  note1: '#93c5fd', // blue-300
  note2: '#fdba74', // orange-300
};

/**
 * Notes in a standard one-octave keyboard (starting from C).
 * Used for key layout positioning.
 */
const WHITE_NOTES_IN_OCTAVE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_NOTES_IN_OCTAVE = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]; // null = no black key between E-F and B-C

// Black key x-offsets within an octave (centered between adjacent white keys)
// White key positions: C=0, D=28, E=56, F=84, G=112, A=140, B=168
// C# is between C(0) and D(28): 0 + 28 - 7 = 21 ... but centered: (0 + 28)/2 - 7 = 7
// Standard piano proportions: black keys are positioned at:
const BLACK_KEY_X_OFFSETS = [
  19, // C# (between C at 0 and D at 28)
  47, // D# (between D at 28 and E at 56)
  -1, // no black key between E and F
  103, // F# (between F at 84 and G at 112)
  131, // G# (between G at 112 and A at 140)
  159, // A# (between A at 140 and B at 168)
  -1, // no black key between B and C
];

/**
 * Get the note name for a key given the octave root and key name.
 * E.g. octaveRoot='C4', keyName='E' → 'E4'
 * E.g. octaveRoot='C4', keyName='C#' → 'C#4'
 */
function getNoteForKey(octaveRoot, keyName) {
  // octaveRoot is like 'C3' or 'C4'
  const octaveNum = octaveRoot.slice(-1);
  return `${keyName}${octaveNum}`;
}

/**
 * PianoKeyboardReveal
 *
 * @param {Object} props
 * @param {string} props.note1 - First note (e.g. 'C4') — highlighted blue
 * @param {string} props.note2 - Second note (e.g. 'E4') — highlighted orange
 * @param {boolean} props.showInBetween - Show dim highlight for notes between note1 and note2
 * @param {string|null} props.intervalLabel - Interval label (e.g. 'SKIP — C4 to E4')
 * @param {string|null} props.subLabel - Sub-label (e.g. 'Jumped over D4')
 * @param {boolean} props.visible - Controls slide-in animation
 * @param {boolean} props.reducedMotion - Skip translate, use opacity only
 */
export function PianoKeyboardReveal({
  note1,
  note2,
  showInBetween = false,
  intervalLabel = null,
  subLabel = null,
  visible = false,
  reducedMotion = false,
}) {
  // Determine the octave to display
  const octaveRoot = useMemo(() => getDisplayOctaveRoot(note1, note2), [note1, note2]);

  // Build note state map: note name → 'note1' | 'note2' | 'between' | 'default'
  const noteStateMap = useMemo(() => {
    const map = new Map();
    const betweenNotes = showInBetween ? getNotesInBetween(note1, note2) : [];

    // Mark all NOTE_ORDER notes as default first
    NOTE_ORDER.forEach((n) => map.set(n, 'default'));

    // Mark between notes (lower priority — overridden by note1/note2 below)
    betweenNotes.forEach((n) => map.set(n, 'between'));

    // note1 and note2 take highest priority
    if (note1) map.set(note1, 'note1');
    if (note2) map.set(note2, 'note2');

    return map;
  }, [note1, note2, showInBetween]);

  // Animation style
  const containerStyle = useMemo(() => {
    if (!visible) {
      return reducedMotion
        ? { opacity: 0 }
        : { transform: 'translateY(100%)', opacity: 0 };
    }
    return reducedMotion
      ? { opacity: 1, transition: 'opacity 300ms ease-out' }
      : { transform: 'translateY(0)', opacity: 1, transition: 'transform 300ms ease-out, opacity 300ms ease-out' };
  }, [visible, reducedMotion]);

  // Compute which keys need labels (note1 and note2 only)
  const labelKeys = useMemo(() => {
    const labels = [];
    // Check all 7 white key positions
    WHITE_NOTES_IN_OCTAVE.forEach((keyBaseName, i) => {
      const noteName = getNoteForKey(octaveRoot, keyBaseName);
      const state = noteStateMap.get(noteName);
      if (state === 'note1' || state === 'note2') {
        labels.push({
          noteName,
          state,
          x: i * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2,
          y: WHITE_KEY_HEIGHT + 15,
          isBlack: false,
        });
      }
    });
    // Check all 5 black key positions
    BLACK_NOTES_IN_OCTAVE.forEach((keyBaseName, i) => {
      if (!keyBaseName) return;
      const noteName = getNoteForKey(octaveRoot, keyBaseName);
      const state = noteStateMap.get(noteName);
      if (state === 'note1' || state === 'note2') {
        labels.push({
          noteName,
          state,
          x: BLACK_KEY_X_OFFSETS[i] + BLACK_KEY_WIDTH / 2,
          y: WHITE_KEY_HEIGHT + 15,
          isBlack: true,
        });
      }
    });
    return labels;
  }, [octaveRoot, noteStateMap]);

  return (
    <div dir="ltr" className="flex flex-col items-center" style={containerStyle}>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          aria-hidden="true"
          role="presentation"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* White keys */}
          {WHITE_NOTES_IN_OCTAVE.map((keyBaseName, i) => {
            const noteName = getNoteForKey(octaveRoot, keyBaseName);
            const state = noteStateMap.get(noteName) ?? 'default';
            const fill = FILL_COLORS.white[state] ?? FILL_COLORS.white.default;
            const x = i * WHITE_KEY_WIDTH;
            return (
              <rect
                key={noteName}
                x={x}
                y={0}
                width={WHITE_KEY_WIDTH - 1}
                height={WHITE_KEY_HEIGHT}
                fill={fill}
                stroke="rgba(255,255,255,0.3)"
                rx="3"
                data-note={noteName}
                data-state={state}
              />
            );
          })}

          {/* Black keys (rendered on top of white keys) */}
          {BLACK_NOTES_IN_OCTAVE.map((keyBaseName, i) => {
            if (!keyBaseName) return null;
            const noteName = getNoteForKey(octaveRoot, keyBaseName);
            const state = noteStateMap.get(noteName) ?? 'default';
            const fill = FILL_COLORS.black[state] ?? FILL_COLORS.black.default;
            const x = BLACK_KEY_X_OFFSETS[i];
            if (x < 0) return null;
            return (
              <rect
                key={noteName}
                x={x}
                y={0}
                width={BLACK_KEY_WIDTH}
                height={BLACK_KEY_HEIGHT}
                fill={fill}
                stroke="rgba(255,255,255,0.3)"
                rx="2"
                data-note={noteName}
                data-state={state}
              />
            );
          })}

          {/* Note name labels below highlighted keys */}
          {labelKeys.map(({ noteName, state, x, y }) => (
            <text
              key={`label-${noteName}`}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="12"
              fill={state === 'note1' ? LABEL_COLORS.note1 : LABEL_COLORS.note2}
              fontFamily="sans-serif"
            >
              {noteName}
            </text>
          ))}
        </svg>

        {/* Interval label area (IntervalGame only) */}
        {intervalLabel && (
          <div className="mt-3 text-center">
            <p className="text-xl font-bold text-white">{intervalLabel}</p>
            {subLabel && (
              <p className="text-base text-white/70 mt-1">{subLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PianoKeyboardReveal;
