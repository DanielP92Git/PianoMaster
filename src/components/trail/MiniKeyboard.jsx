/**
 * MiniKeyboard Component
 *
 * A static, purely visual CSS/Tailwind piano keyboard highlighting focus notes.
 * Used in TrailNodeModal to show which keys a student will learn in a Discovery node.
 *
 * Props:
 *   focusNotes  {string[]}  e.g. ['F#4', 'C4']
 *   clef        {string}    'treble' | 'bass'
 *   isHebrew    {boolean}   true → show Hebrew note names on highlighted keys
 */

// White key note names in one octave (index 0–6 = C, D, E, F, G, A, B)
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Hebrew solfege names for pitch classes
const HEBREW_NAMES = {
  C: 'דו', D: 'רה', E: 'מי', F: 'פה', G: 'סול', A: 'לה', B: 'סי',
  'C#': '♯דו', 'D#': '♯רה', 'F#': '♯פה', 'G#': '♯סול', 'A#': '♯לה',
};

// Black key pitch classes and their visual position between white keys.
// position 0.5 = between C(0) and D(1), 1.5 = D/E, 3.5 = F/G, 4.5 = G/A, 5.5 = A/B
const BLACK_KEYS = [
  { pitchClass: 'C#', gapIndex: 0.5 },
  { pitchClass: 'D#', gapIndex: 1.5 },
  { pitchClass: 'F#', gapIndex: 3.5 },
  { pitchClass: 'G#', gapIndex: 4.5 },
  { pitchClass: 'A#', gapIndex: 5.5 },
];

// Flat → sharp enharmonic equivalents so we can match by pitch class
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

/**
 * Parse a note string like 'F#4', 'Bb3', 'C4' into { pitchClass, octave }.
 * pitchClass is normalised to sharp form (e.g. 'Bb' → 'A#').
 */
function parseNote(note) {
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) return null;
  let pitchClass = m[1];
  const octave = parseInt(m[2], 10);
  if (FLAT_TO_SHARP[pitchClass]) pitchClass = FLAT_TO_SHARP[pitchClass];
  return { pitchClass, octave };
}

/**
 * Determine which octave to display based on focusNotes.
 * Uses the octave of the first parseable focusNote, defaulting to 4.
 */
function getDisplayOctave(focusNotes) {
  for (const n of focusNotes) {
    const parsed = parseNote(n);
    if (parsed) return parsed.octave;
  }
  return 4;
}

/**
 * Build a Set of pitch strings 'pitchClass+octave' that should be highlighted,
 * e.g. { 'F#4', 'C4' }.
 */
function buildHighlightSet(focusNotes) {
  const set = new Set();
  for (const n of focusNotes) {
    const parsed = parseNote(n);
    if (parsed) set.add(`${parsed.pitchClass}${parsed.octave}`);
  }
  return set;
}

const WHITE_KEY_WIDTH = 26; // px
const BLACK_KEY_WIDTH = 17; // px
const WHITE_KEY_HEIGHT = 80; // px
const BLACK_KEY_HEIGHT = 50; // px

// Total width: 8 white keys (C to next C) × 26px
const KEYBOARD_WIDTH = WHITE_KEY_WIDTH * 8;

const MiniKeyboard = ({ focusNotes = [], clef = 'treble', isHebrew = false }) => {
  const displayOctave = getDisplayOctave(focusNotes);
  const highlightSet = buildHighlightSet(focusNotes);

  // Category-specific highlight color
  const highlightColor = clef === 'bass' ? '#a855f7' : '#60a5fa'; // purple-500 / blue-400
  const highlightGlow =
    clef === 'bass'
      ? '0 0 8px rgba(168,85,247,0.6)'
      : '0 0 8px rgba(96,165,250,0.6)';
  const labelColor = clef === 'bass' ? '#d8b4fe' : '#93c5fd'; // purple-300 / blue-300

  // White keys: C D E F G A B + next C (octave+1)
  const whiteKeys = [
    ...WHITE_NOTES.map((name) => ({ name, octave: displayOctave })),
    { name: 'C', octave: displayOctave + 1 },
  ];

  return (
    // Force LTR so the keyboard layout is always left-to-right regardless of page dir
    <div dir="ltr" className="flex justify-center overflow-x-auto">
      <div
        style={{ position: 'relative', width: KEYBOARD_WIDTH, height: WHITE_KEY_HEIGHT + 16 }}
        aria-hidden="true"
      >
        {/* White keys */}
        {whiteKeys.map((key, i) => {
          const pitchStr = `${key.name}${key.octave}`;
          const isHighlighted = highlightSet.has(pitchStr);
          return (
            <div
              key={`w-${i}`}
              style={{
                position: 'absolute',
                left: i * WHITE_KEY_WIDTH,
                top: 0,
                width: WHITE_KEY_WIDTH - 2,
                height: WHITE_KEY_HEIGHT,
                backgroundColor: isHighlighted ? highlightColor : 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '0 0 4px 4px',
                boxShadow: isHighlighted ? highlightGlow : undefined,
              }}
            >
              {isHighlighted && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 8,
                    fontWeight: 700,
                    color: labelColor,
                    lineHeight: 1,
                  }}
                >
                  {isHebrew ? (HEBREW_NAMES[key.name] || key.name) : key.name}
                </span>
              )}
            </div>
          );
        })}

        {/* Black keys */}
        {BLACK_KEYS.map((bk, i) => {
          const pitchStr = `${bk.pitchClass}${displayOctave}`;
          const isHighlighted = highlightSet.has(pitchStr);
          // Left position: gapIndex × whiteKeyWidth + (whiteKeyWidth/2 - blackKeyWidth/2)
          const leftPx =
            bk.gapIndex * WHITE_KEY_WIDTH +
            (WHITE_KEY_WIDTH / 2 - BLACK_KEY_WIDTH / 2) -
            1;
          return (
            <div
              key={`b-${i}`}
              style={{
                position: 'absolute',
                left: leftPx,
                top: 0,
                width: BLACK_KEY_WIDTH,
                height: BLACK_KEY_HEIGHT,
                backgroundColor: isHighlighted ? highlightColor : '#0f172a',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0 0 3px 3px',
                zIndex: 1,
                boxShadow: isHighlighted ? highlightGlow : undefined,
              }}
            >
              {isHighlighted && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {isHebrew ? (HEBREW_NAMES[bk.pitchClass] || bk.pitchClass) : bk.pitchClass}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniKeyboard;
