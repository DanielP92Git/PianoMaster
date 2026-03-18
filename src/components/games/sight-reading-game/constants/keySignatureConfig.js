/**
 * Key signature configuration for the sight-reading game.
 *
 * KEY_NOTE_LETTERS: maps VexFlow key strings to arrays of in-key note letter names
 * (including accidentals). Used to filter note pools to in-key pitches and for
 * display purposes.
 *
 * KEY_SIGNATURE_OPTIONS: the 7 selectable key signatures shown in PreGameSetup.
 * Values use VexFlow key string format directly ('G', 'Bb', etc.) or null for C major.
 */

export const KEY_NOTE_LETTERS = Object.freeze({
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  A: ["A", "B", "C#", "D", "E", "F#", "G#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
});

export const KEY_SIGNATURE_OPTIONS = Object.freeze([
  {
    value: null,
    labelKey: "gameSettings.keySignature.cMajor",
    badgeKey: "gameSettings.keySignature.noAccidentals",
  },
  {
    value: "G",
    labelKey: "gameSettings.keySignature.gMajor",
    badgeKey: "gameSettings.keySignature.oneSharp",
  },
  {
    value: "D",
    labelKey: "gameSettings.keySignature.dMajor",
    badgeKey: "gameSettings.keySignature.twoSharps",
  },
  {
    value: "A",
    labelKey: "gameSettings.keySignature.aMajor",
    badgeKey: "gameSettings.keySignature.threeSharps",
  },
  {
    value: "F",
    labelKey: "gameSettings.keySignature.fMajor",
    badgeKey: "gameSettings.keySignature.oneFlat",
  },
  {
    value: "Bb",
    labelKey: "gameSettings.keySignature.bbMajor",
    badgeKey: "gameSettings.keySignature.twoFlats",
  },
  {
    value: "Eb",
    labelKey: "gameSettings.keySignature.ebMajor",
    badgeKey: "gameSettings.keySignature.threeFlats",
  },
]);
