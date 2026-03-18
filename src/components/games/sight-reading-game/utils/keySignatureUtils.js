import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";

// Build a lookup: for each key signature, map base letter → in-key form.
// e.g. G major: { F: 'F#', C: 'C', D: 'D', ... }
const KEY_LETTER_MAP = Object.freeze(
  Object.fromEntries(
    Object.entries(KEY_NOTE_LETTERS).map(([key, letters]) => [
      key,
      Object.freeze(
        Object.fromEntries(letters.map((l) => [l[0], l]))
      ),
    ])
  )
);

/**
 * Maps a pitch string to its in-key equivalent for a given key signature.
 * Natural notes are transformed to the key's accidental form.
 * e.g. mapNoteToKey('F4', 'G') → 'F#4' (F is F# in G major)
 *      mapNoteToKey('C4', 'G') → 'C4'  (C is natural in G major)
 *      mapNoteToKey('F#4', 'G') → 'F#4' (already correct)
 *
 * @param {string} pitch - Pitch string (e.g. 'F4', 'Bb3')
 * @param {string|null} keySignature - VexFlow key string or null/'C'
 * @returns {string} The in-key pitch string
 */
export function mapNoteToKey(pitch, keySignature) {
  if (!keySignature || keySignature === "C") return pitch;

  const match = String(pitch).match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return pitch;

  const [, baseLetter, accidental, octave] = match;
  const letterMap = KEY_LETTER_MAP[keySignature];
  if (!letterMap) return pitch;

  // Only transform natural notes — accidental notes are already explicit
  if (accidental) return pitch;

  const inKeyForm = letterMap[baseLetter];
  if (!inKeyForm) return pitch;

  return inKeyForm + octave;
}

/**
 * Filters a pitch array to only include notes whose staff position exists
 * in the given key signature.
 *
 * Natural notes (e.g. F4) are kept if their base letter appears in the key
 * in any form (e.g. F# in G major means the F staff position is valid).
 * Accidental notes (e.g. F#4, Bb3) are kept only if they exactly match
 * the in-key accidental form.
 *
 * @param {string[]} currentNotes - Array of pitch strings (e.g. ['C4', 'F#4', 'Bb3'])
 * @param {string|null} keySignature - VexFlow key string ('G', 'D', 'A', 'F', 'Bb', 'Eb')
 *   or null/'C' for no filtering
 * @returns {string[]} Filtered array of pitches in the given key
 */
export function filterNotesToKey(currentNotes, keySignature) {
  if (!keySignature || keySignature === "C") {
    return currentNotes;
  }

  const inKeyLetters = new Set(KEY_NOTE_LETTERS[keySignature] || []);
  // Base letters that have any form in the key (e.g. 'F' from 'F#')
  const inKeyBaseLetters = new Set();
  for (const letter of inKeyLetters) {
    inKeyBaseLetters.add(letter[0]);
  }

  return currentNotes.filter((pitch) => {
    const match = String(pitch).match(/^([A-G])([#b]?)(\d)/);
    if (!match) return false;
    const [, baseLetter, accidental] = match;
    const fullLetter = baseLetter + accidental;

    // Exact match (e.g. F#4 in G major) → keep
    if (inKeyLetters.has(fullLetter)) return true;

    // Natural note whose staff position exists in the key → keep
    // (e.g. F4 in G major: the F line is F# via key signature)
    if (!accidental && inKeyBaseLetters.has(baseLetter)) return true;

    return false;
  });
}
