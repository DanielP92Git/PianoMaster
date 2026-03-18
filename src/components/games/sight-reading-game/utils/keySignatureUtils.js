import { KEY_NOTE_LETTERS } from "../constants/keySignatureConfig";

/**
 * Filters a pitch array to only include notes that are in the given key signature.
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

  return currentNotes.filter((pitch) => {
    const match = String(pitch).match(/^([A-G][#b]?)\d/);
    return match && inKeyLetters.has(match[1]);
  });
}
