import React from "react";
import { Klavier } from "klavier";

const { useMemo, useCallback } = React;
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
 * Calculate keyboard range from selected notes
 * Returns [minMidi, maxMidi] covering all selected notes
 * Always includes C4 (middle C) if possible for orientation
 */
const calculateKeyboardRange = (selectedNotes = []) => {
  if (!selectedNotes || selectedNotes.length === 0) {
    return DEFAULT_KEYBOARD_RANGE;
  }

  // Convert selected notes to MIDI numbers
  const midiNumbers = selectedNotes
    .map((note) => {
      // Handle pitch format (e.g., "C3", "D4")
      const match = note.match(/^([A-G])(#?)(\d+)$/i);
      if (match) {
        return noteNameToMidi(note);
      }
      return null;
    })
    .filter((midi) => midi !== null);

  if (midiNumbers.length === 0) {
    return DEFAULT_KEYBOARD_RANGE;
  }

  const minMidi = Math.min(...midiNumbers);
  const maxMidi = Math.max(...midiNumbers);

  // Always include C4 (middle C) for orientation if it's within reasonable range
  const c4Midi = noteNameToMidi("C4");
  const shouldIncludeC4 = c4Midi >= minMidi - 12 && c4Midi <= maxMidi + 12;

  // Find the lowest C in the range (round down to nearest C)
  // MIDI note % 12 gives the semitone within the octave (0=C, 2=D, 4=E, etc.)
  const minMidiNoteInOctave = minMidi % 12;
  const rangeStartMidi = minMidi - minMidiNoteInOctave; // Round down to C

  // Find the highest note and extend to next D for padding
  const maxMidiNoteInOctave = maxMidi % 12;
  const maxMidiOctaveStart = maxMidi - maxMidiNoteInOctave;
  const rangeEndMidi = maxMidiOctaveStart + 12 + 2; // Next octave's D

  // Adjust to include C4 if needed and within reasonable range
  let finalStart = rangeStartMidi;
  let finalEnd = rangeEndMidi;

  if (shouldIncludeC4) {
    // Ensure C4 is visible - extend range if needed
    const c4OctaveStart = c4Midi - (c4Midi % 12); // C of C4's octave

    if (c4OctaveStart < finalStart) {
      finalStart = c4OctaveStart;
    }
    if (c4Midi + 2 > finalEnd) {
      finalEnd = c4Midi + 2; // At least to D4
    }
  }

  // Ensure minimum range of at least 1 octave
  if (finalEnd - finalStart < 12) {
    finalEnd = finalStart + 12 + 2; // At least 1 octave + 2 semitones
  }

  return [finalStart, finalEnd];
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
      className={`
        relative flex flex-col items-center justify-end
        rounded-b-lg border-2 transition-all
        cursor-pointer hover:brightness-110
        ${
          active
            ? "bg-purple-500 border-purple-600 scale-95 shadow-inner"
            : isMiddleC
              ? "bg-amber-100 border-amber-400 shadow-xl"
              : "bg-white border-gray-300 shadow-lg"
        }
      `}
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
      className={`
        rounded-b-lg transition-all
        ${active ? "bg-purple-700 scale-95" : "bg-gray-900"}
      `}
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

  if (!visible) return null;

  return (
    <div
      className="w-full h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-lg p-2"
      style={{ minHeight: "140px" }}
    >
      <div className="flex-1 w-full max-w-full sm:max-w-4xl mx-auto flex items-center justify-center h-full">
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
