import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";

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
