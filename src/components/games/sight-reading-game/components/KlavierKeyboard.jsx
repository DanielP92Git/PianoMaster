import React from "react";
import { Klavier } from "klavier";

const { useMemo, useCallback, useEffect, useRef } = React;
Klavier.displayName = Klavier.displayName || "Klavier";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const noteNameToMidi = (note) => {
  const match = note.match(/^([A-G])(#?)(\d)$/i);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  const semitone = NOTE_NAMES.findIndex(
    (name) => name === `${letter.toUpperCase()}${accidental ? "#" : ""}`
  );
  const octave = parseInt(octaveStr, 10);
  if (semitone === -1 || Number.isNaN(octave)) return null;
  return (octave + 1) * 12 + semitone;
};

const midiToNoteName = (midi) => {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
};

const DEFAULT_KEYBOARD_RANGE = [noteNameToMidi("C3"), noteNameToMidi("D5")];

/**
 * Parse a clef-qualified ID (e.g., "treble:F5" or "bass:A2")
 * @param {string} raw - The raw selected note value
 * @returns {{ clef: string | null, pitch: string }} - Parsed clef and pitch, or null clef if not qualified
 */
const parseClefQualifiedId = (raw) => {
  if (typeof raw !== "string") return { clef: null, pitch: raw };
  if (raw.startsWith("treble:")) return { clef: "treble", pitch: raw.slice(7) };
  if (raw.startsWith("bass:")) return { clef: "bass", pitch: raw.slice(5) };
  return { clef: null, pitch: raw };
};

/**
 * Get the C that starts the octave containing a given MIDI note
 * @param {number} midi - MIDI note number
 * @returns {number} - MIDI number of the C that starts the octave
 */
const getOctaveStartC = (midi) => {
  return midi - (midi % 12);
};

/**
 * Get the C that ends the octave containing a given MIDI note (the next C)
 * @param {number} midi - MIDI note number
 * @returns {number} - MIDI number of the C that ends the octave (next C)
 */
const getOctaveEndC = (midi) => {
  return getOctaveStartC(midi) + 12;
};

/**
 * Calculate keyboard range from selected notes
 * Returns [minMidi, maxMidi] covering complete C-to-C octaves containing selected notes
 * Always includes reference octaves: C3-C4 for treble, C2-C3 for bass
 */
const calculateKeyboardRange = (selectedNotes = []) => {
  if (!selectedNotes || selectedNotes.length === 0) {
    return DEFAULT_KEYBOARD_RANGE;
  }

  // Parse notes and extract pitches and clef information
  const parsedNotes = selectedNotes
    .map((note) => {
      const parsed = parseClefQualifiedId(note);
      const pitch = parsed.pitch;

      // Try to convert pitch to MIDI
      const match = pitch.match(/^([A-G])(#?)(\d+)$/i);
      if (match) {
        const midi = noteNameToMidi(pitch);
        if (midi !== null) {
          return {
            pitch,
            midi,
            clef: parsed.clef,
          };
        }
      }
      return null;
    })
    .filter((note) => note !== null);

  if (parsedNotes.length === 0) {
    return DEFAULT_KEYBOARD_RANGE;
  }

  // Determine which clefs are involved
  const hasTreble = parsedNotes.some(
    (note) => note.clef === "treble" || note.clef === null
  );
  const hasBass = parsedNotes.some((note) => note.clef === "bass");

  // Calculate octave boundaries for selected notes
  // Each note belongs to a C-to-C octave (e.g., F5 belongs to C5-C6)
  const octaveStarts = parsedNotes.map((note) => getOctaveStartC(note.midi));
  const octaveEnds = parsedNotes.map((note) => getOctaveEndC(note.midi));

  // Find the lowest and highest octave boundaries needed
  let minOctaveStart = Math.min(...octaveStarts);
  let maxOctaveEnd = Math.max(...octaveEnds);

  // Always include reference octaves based on clef context
  const c3Midi = noteNameToMidi("C3");
  const c4Midi = noteNameToMidi("C4");
  const c2Midi = noteNameToMidi("C2");

  // If treble notes exist, include C3-C4 octave for reference
  // This means showing from C3 to C4 (inclusive), which covers the C3-C4 octave
  if (hasTreble) {
    if (c3Midi < minOctaveStart) {
      minOctaveStart = c3Midi;
    }
    // Ensure we show at least up to C4 for the C3-C4 reference octave
    // If selected notes go higher, we'll already have a higher maxOctaveEnd
    if (c4Midi > maxOctaveEnd) {
      maxOctaveEnd = c4Midi;
    }
  }

  // If bass notes exist, include C2-C3 octave for reference
  // This means showing from C2 to C3 (inclusive), which covers the C2-C3 octave
  if (hasBass) {
    if (c2Midi < minOctaveStart) {
      minOctaveStart = c2Midi;
    }
    // Ensure we show at least up to C3 for the C2-C3 reference octave
    // If selected notes go higher, we'll already have a higher maxOctaveEnd
    if (c3Midi > maxOctaveEnd) {
      maxOctaveEnd = c3Midi;
    }
  }

  // Ensure we show complete octaves (C-to-C)
  // The range should start at a C and end at a C
  return [minOctaveStart, maxOctaveEnd];
};

const PC_SHORTCUT_KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"];

/**
 * Generate PC shortcut notes based on keyboard range
 * Maps keys to white keys within the visible range, starting from the lowest C
 */
const generatePCShortcutNotes = (keyRange) => {
  const [startMidi, endMidi] = keyRange;
  const notes = [];

  // Find the first C in the range (or start from startMidi if it's already a C)
  let currentMidi = startMidi;
  if (currentMidi % 12 !== 0) {
    // Round up to next C
    currentMidi = currentMidi - (currentMidi % 12) + 12;
  }

  // Collect white keys (C, D, E, F, G, A, B) within range
  const whiteKeyOffsets = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

  for (
    let midi = currentMidi;
    midi <= endMidi && notes.length < PC_SHORTCUT_KEYS.length;
    midi++
  ) {
    const noteInOctave = midi % 12;
    if (whiteKeyOffsets.includes(noteInOctave)) {
      notes.push(midi);
    }
  }

  // If we don't have enough notes, pad with the last note repeated
  while (notes.length < PC_SHORTCUT_KEYS.length && notes.length > 0) {
    notes.push(notes[notes.length - 1] + 1);
  }

  // Fallback: if still no notes, use default range
  if (notes.length === 0) {
    return [
      noteNameToMidi("C3"),
      noteNameToMidi("C4"),
      noteNameToMidi("D4"),
      noteNameToMidi("E4"),
      noteNameToMidi("F4"),
      noteNameToMidi("G4"),
      noteNameToMidi("A4"),
      noteNameToMidi("B4"),
      noteNameToMidi("C5"),
      noteNameToMidi("D5"),
    ];
  }

  return notes;
};

/**
 * Custom white key component with purple active state styling
 */
const extractMidiFromKeyProp = (value) => {
  if (value == null) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const fromName = noteNameToMidi(value);
    if (fromName !== null) return fromName;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value) && value.length > 0) {
    return extractMidiFromKeyProp(value[0]);
  }

  if (typeof value === "object") {
    if (typeof value.midiNumber === "number") {
      return value.midiNumber;
    }
    if ("note" in value) {
      return extractMidiFromKeyProp(value.note);
    }
    if ("value" in value) {
      return extractMidiFromKeyProp(value.value);
    }
    if ("label" in value) {
      return extractMidiFromKeyProp(value.label);
    }
    if ("id" in value) {
      return extractMidiFromKeyProp(value.id);
    }
  }

  return null;
};

const CustomWhiteKey = ({ active, note }) => {
  const midiNumber = extractMidiFromKeyProp(note);
  const noteName = midiNumber !== null ? midiToNoteName(midiNumber) : "?";
  const isMiddleC = noteName === "C4";

  return (
    <div
      className={`relative flex cursor-pointer flex-col items-center justify-end rounded-b-lg border-2 transition-all hover:brightness-110 ${
        active
          ? "scale-95 border-purple-600 bg-purple-500 shadow-inner"
          : isMiddleC
            ? "border-amber-400 bg-amber-100 shadow-xl"
            : "border-gray-300 bg-white shadow-lg"
      } `}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* For future use: display the English note name and Middle C label */}
      {/* <div className="flex flex-col items-center mb-1 space-y-1">
        <span
          className={`text-[10px] sm:text-xs font-semibold ${
            isMiddleC
              ? "text-gray-800"
              : active
                ? "text-white"
                : "text-gray-700"
          }`}
        >
          {midiNumber !== null ? noteName : ""}
        </span>
        {isMiddleC ? (
          <span className="text-[9px] sm:text-[10px] font-semibold text-amber-700 origin-center whitespace-nowrap">
            דו אמצעי
          </span>
        ) : null}
      </div>  */}
    </div>
  );
};

/**
 * Custom black key component (minimal styling since we're not using black keys yet)
 */
const CustomBlackKey = ({ active }) => {
  return (
    <div
      className={`rounded-b-lg transition-all ${active ? "scale-95 bg-purple-700" : "bg-gray-900"} `}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

/**
 * Custom label component (disabled - no keyboard shortcuts shown)
 */
const CustomLabel = () => {
  // Return null to hide keyboard shortcuts
  return null;
};

/**
 * Interactive piano keyboard with dynamic range based on selected notes.
 * Shows relevant octaves while keeping C4 (middle C) highlighted for orientation.
 */
export function KlavierKeyboard({
  visible = true,
  onNotePlayed,
  selectedNotes = [],
}) {
  const containerRef = useRef(null);

  const keyRange = useMemo(
    () => calculateKeyboardRange(selectedNotes),
    [selectedNotes]
  );

  const keymap = useMemo(() => {
    const shortcutNotes = generatePCShortcutNotes(keyRange);
    return PC_SHORTCUT_KEYS.map((keyChar, idx) => ({
      key: keyChar,
      midiNumber: shortcutNotes[idx] || shortcutNotes[shortcutNotes.length - 1],
    }));
  }, [keyRange]);

  // Handle key press from Klavier - convert MIDI number to note name
  const handleKeyPress = useCallback(
    (midiNumber) => {
      const noteName = midiToNoteName(midiNumber);
      if (noteName && onNotePlayed) {
        onNotePlayed(noteName);
      }
    },
    [onNotePlayed]
  );

  // Apply CSS touch-action optimization for better scroll performance.
  // Note: The klavier library (v2.0.1) internally adds non-passive touchstart listeners,
  // which triggers a browser warning. This is a limitation of the third-party library.
  // The CSS touch-action property helps the browser optimize touch handling.
  // To fully resolve the warning, the klavier library would need to be updated to use
  // passive listeners, or we would need to fork and patch the library.
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const container = containerRef.current;

    const applyTouchAction = () => {
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        if (el instanceof HTMLElement && !el.style.touchAction) {
          el.style.touchAction = "manipulation";
        }
      });
    };

    // Apply immediately and after klavier renders
    applyTouchAction();
    const timeoutId = setTimeout(applyTouchAction, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [visible, keyRange]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="bg-gray-800/50 flex h-full w-full flex-col rounded-lg p-2 backdrop-blur-sm"
      style={{ minHeight: "140px", touchAction: "manipulation" }}
      dir="ltr" // Force LTR for piano keyboard - prevents RTL inheritance issues
    >
      <div className="mx-auto flex h-full w-full max-w-full flex-1 items-center justify-center sm:max-w-4xl">
        <Klavier
          keyRange={keyRange}
          keymap={keymap}
          onKeyPress={handleKeyPress}
          width="100%"
          height="100%"
          blackKeyHeight="60%"
          interactive={true}
          components={{
            whiteKey: CustomWhiteKey,
            blackKey: CustomBlackKey,
            label: CustomLabel,
          }}
        />
      </div>
    </div>
  );
}
