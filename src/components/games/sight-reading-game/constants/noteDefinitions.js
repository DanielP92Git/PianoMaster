const withAccidentals = (naturalNotes) => {
  // Generate accidentals for all seven note letters so the games can display
  // a complete set of ♭ and ♯ answers whenever those toggles are enabled.
  const flatLetters = new Set(["C", "D", "E", "F", "G", "A", "B"]);
  const sharpLetters = new Set(["C", "D", "E", "F", "G", "A", "B"]);

  const result = [...naturalNotes];

  for (const note of naturalNotes) {
    const pitch = note?.pitch;
    const match = pitch ? String(pitch).match(/^([A-G])(\d)$/) : null;
    if (!match) continue;

    const [, letter, octave] = match;

    if (flatLetters.has(letter)) {
      result.push({
        note: `${note.note}♭`,
        englishName: `${letter}b${octave}`,
        pitch: `${letter}b${octave}`,
      });
    }

    if (sharpLetters.has(letter)) {
      result.push({
        note: `${note.note}♯`,
        englishName: `${letter}#${octave}`,
        pitch: `${letter}#${octave}`,
      });
    }
  }

  return result;
};

const TREBLE_NATURAL_NOTES = [
  { note: "סול", englishName: "G3", pitch: "G3" },
  { note: "לה", englishName: "A3", pitch: "A3" },
  { note: "סי", englishName: "B3", pitch: "B3" },
  { note: "דו", englishName: "C4", pitch: "C4" },
  { note: "רה", englishName: "D4", pitch: "D4" },
  { note: "מי", englishName: "E4", pitch: "E4" },
  { note: "פה", englishName: "F4", pitch: "F4" },
  { note: "סול", englishName: "G4", pitch: "G4" },
  { note: "לה", englishName: "A4", pitch: "A4" },
  { note: "סי", englishName: "B4", pitch: "B4" },
  { note: "דו", englishName: "C5", pitch: "C5" },
  { note: "רה", englishName: "D5", pitch: "D5" },
  { note: "מי", englishName: "E5", pitch: "E5" },
  { note: "פה", englishName: "F5", pitch: "F5" },
  { note: "סול", englishName: "G5", pitch: "G5" },
  { note: "לה", englishName: "A5", pitch: "A5" },
  { note: "סי", englishName: "B5", pitch: "B5" },
  { note: "דו", englishName: "C6", pitch: "C6" },
];

const BASS_NATURAL_NOTES = [
  { note: "סי", englishName: "B1", pitch: "B1" },
  { note: "דו", englishName: "C2", pitch: "C2" },
  { note: "רה", englishName: "D2", pitch: "D2" },
  { note: "מי", englishName: "E2", pitch: "E2" },
  { note: "פה", englishName: "F2", pitch: "F2" },
  { note: "סול", englishName: "G2", pitch: "G2" },
  { note: "לה", englishName: "A2", pitch: "A2" },
  { note: "סי", englishName: "B2", pitch: "B2" },
  { note: "דו", englishName: "C3", pitch: "C3" },
  { note: "רה", englishName: "D3", pitch: "D3" },
  { note: "מי", englishName: "E3", pitch: "E3" },
  { note: "פה", englishName: "F3", pitch: "F3" },
  { note: "סול", englishName: "G3", pitch: "G3" },
  { note: "לה", englishName: "A3", pitch: "A3" },
  { note: "סי", englishName: "B3", pitch: "B3" },
  { note: "דו", englishName: "C4", pitch: "C4" },
  { note: "רה", englishName: "D4", pitch: "D4" },
  { note: "מי", englishName: "E4", pitch: "E4" },
  { note: "פה", englishName: "F4", pitch: "F4" },
];

export const TREBLE_NOTE_DATA = withAccidentals(TREBLE_NATURAL_NOTES);
export const BASS_NOTE_DATA = withAccidentals(BASS_NATURAL_NOTES);
