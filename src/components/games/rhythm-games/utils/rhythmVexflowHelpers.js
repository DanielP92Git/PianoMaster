import {
  StaveNote,
  Stem,
  Dot,
  Annotation,
  AnnotationVerticalJustify,
} from "vexflow";

/**
 * Kodaly syllable mappings by durationUnits (English).
 * Per D-18: quarter=ta, eighth=ti, half=ta-a, whole=ta-a-a-a
 * Each individual eighth note gets "ti" per RESEARCH A1.
 */
export const SYLLABLE_MAP_EN = {
  16: "ta-a-a-a", // whole
  12: "ta-a-a", // dotted half
  8: "ta-a", // half
  6: "ta-a", // dotted quarter (sustained)
  4: "ta", // quarter
  3: "ta", // dotted eighth (sustained)
  2: "ti", // eighth
  1: "ti", // sixteenth
};

/**
 * Kodaly syllable mappings by durationUnits (Hebrew with Nikud).
 * Corrected per user review:
 *   - Eighth/sixteenth: "טָה-טֶה" (ta-te, NOT "טִי")
 *   - Rest: "הָס" (Kamatz under heh)
 */
export const SYLLABLE_MAP_HE = {
  16: "טָה-אָה-אָה-אָה",
  12: "טָה-אָה-אָה",
  8: "טָה-אָה",
  6: "טָה-אָה",
  4: "טָה",
  3: "טָה",
  2: "טָה", // First eighth in pair = ta; second gets "טֶה" (te) via alternation
  1: "טָה", // First sixteenth = ta; alternates get "טֶה" (te)
};

// Hebrew eighth/sixteenth alternation: 2nd note in a consecutive sub-beat pair gets "te"
export const SYLLABLE_HE_TE = "טֶה";

export const REST_SYLLABLE_EN = "sh";
export const REST_SYLLABLE_HE = "הָס"; // Kamatz under heh (confirmed by user)

/**
 * Map from sixteenth-note duration units to VexFlow duration code strings.
 *
 * Covers all standard durations used by RhythmPatternGenerator:
 *   16 → whole ('w')
 *   12 → dotted half ('hd')
 *    8 → half ('h')
 *    6 → dotted quarter ('qd')
 *    4 → quarter ('q')
 *    3 → dotted eighth ('8d')
 *    2 → eighth ('8')
 *    1 → sixteenth ('16')
 */
export const DURATION_TO_VEX = {
  16: "w",
  12: "hd",
  8: "h",
  6: "qd",
  4: "q",
  3: "8d",
  2: "8",
  1: "16",
};

/**
 * Convert a binary pattern array from RhythmPatternGenerator into beat objects.
 *
 * Binary format: [1,0,0,0,1,0,...] where:
 *   1 = note onset (attack)
 *   0 = sustain/rest continuation
 * Each position represents one sixteenth note unit.
 *
 * Returns an array of { durationUnits: number, isRest: boolean } objects
 * where durationUnits is how many sixteenth-note positions this beat spans.
 *
 * @param {number[]} binaryPattern - Binary array from RhythmPatternGenerator.getPattern()
 * @returns {{ durationUnits: number, isRest: boolean }[]}
 */
export function binaryPatternToBeats(binaryPattern) {
  const beats = [];
  let i = 0;

  while (i < binaryPattern.length) {
    const isNote = binaryPattern[i] === 1;
    let duration = 1;

    // Count consecutive 0s following this position — they extend this beat
    let j = i + 1;
    while (j < binaryPattern.length && binaryPattern[j] === 0) {
      duration++;
      j++;
    }

    beats.push({ durationUnits: duration, isRest: !isNote });
    i = j;
  }

  return beats;
}

/**
 * Convert beat objects into VexFlow StaveNote objects for rhythm-only display.
 *
 * All notes use pitch 'b/4' (mid-staff treble position) and Stem.UP per D-01
 * and the rhythm-only rendering convention in this codebase.
 *
 * Dotted notes (e.g. durationUnits=6 → 'qd') have a VexFlow Dot attached
 * via Dot.buildAndAttach().
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} beats
 * @returns {StaveNote[]}
 */
export function beatsToVexNotes(
  beats,
  { showSyllables = false, language = "en" } = {}
) {
  let eighthPairIndex = 0; // tracks position within consecutive eighth/sixteenth groups

  return beats.map((beat) => {
    const vexDur = DURATION_TO_VEX[beat.durationUnits];

    // Fallback to quarter note if duration not in map
    if (!vexDur) {
      const note = new StaveNote({
        keys: ["b/4"],
        duration: beat.isRest ? "qr" : "q",
        stem_direction: Stem.UP,
      });
      return note;
    }

    const isDotted = vexDur.endsWith("d");
    // Strip the 'd' suffix for VexFlow — dots are added separately via Dot.buildAndAttach
    const baseDur = isDotted ? vexDur.slice(0, -1) : vexDur;

    const note = new StaveNote({
      keys: ["b/4"],
      duration: beat.isRest ? baseDur + "r" : baseDur,
      stem_direction: Stem.UP,
    });

    if (isDotted) {
      Dot.buildAndAttach([note], { all: true });
    }

    if (showSyllables) {
      const syllableMap = language === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
      const restSyllable =
        language === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
      let syllableText;

      if (beat.isRest) {
        syllableText = restSyllable;
        eighthPairIndex = 0;
      } else if (!beat.isRest && beat.durationUnits > 4) {
        // Sustained notes: annotate first syllable part only (e.g., "טָה" from "טָה-אָה-אָה-אָה")
        // Remaining parts are cloned in renderSpreadSyllables() post-render
        const parts = (syllableMap[beat.durationUnits] ?? "?").split("-");
        syllableText = parts[0];
        eighthPairIndex = 0;
      } else if (language === "he" && beat.durationUnits <= 2) {
        syllableText =
          eighthPairIndex % 2 === 0
            ? syllableMap[beat.durationUnits]
            : SYLLABLE_HE_TE;
        eighthPairIndex++;
      } else {
        syllableText = syllableMap[beat.durationUnits] ?? "?";
        eighthPairIndex = 0;
      }

      const annotation = new Annotation(syllableText);
      annotation.setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
      annotation.setFont({ family: "sans-serif", size: 10, weight: "normal" });
      note.addModifier(annotation, 0);
    }

    return note;
  });
}

/**
 * Render spread syllables for sustained notes (half, dotted half, whole) as SVG text.
 * Called after VexFlow renders — places each syllable part at evenly-spaced beat positions.
 *
 * @param {HTMLElement} container - The container element with the rendered SVG
 * @param {StaveNote[]} allNotes - Flat array of rendered VexFlow StaveNote objects
 * @param {{ durationUnits: number, isRest: boolean }[]} beats - Beat objects
 * @param {{ noteEndX: number, language?: string }} options
 */
export function renderSpreadSyllables(
  container,
  allNotes,
  beats,
  { noteEndX, language = "en" } = {}
) {
  const svgEl = container.querySelector("svg");
  if (!svgEl) return;

  const syllableMap = language === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    if (beat.isRest || beat.durationUnits <= 4) continue;

    const fullSyllable = syllableMap[beat.durationUnits];
    if (!fullSyllable) continue;

    const parts = fullSyllable.split("-");
    if (parts.length <= 1) continue;

    // Find the VexFlow-rendered annotation text for this note (first syllable part)
    // by matching content and proximity to the note's X position
    let noteX;
    try {
      noteX = allNotes[i].getAbsoluteX();
    } catch {
      continue;
    }

    let sourceTextEl = null;
    let bestDist = Infinity;
    const textEls = svgEl.querySelectorAll("text");
    for (const el of textEls) {
      if (el.textContent.trim() === parts[0]) {
        const elX = parseFloat(el.getAttribute("x"));
        const dist = Math.abs(elX - noteX);
        if (dist < bestDist) {
          bestDist = dist;
          sourceTextEl = el;
        }
      }
    }
    if (!sourceTextEl) continue;

    // Get span: from this note to next note (or stave end)
    let endX;
    if (i + 1 < allNotes.length) {
      try {
        endX = allNotes[i + 1].getAbsoluteX();
      } catch {
        endX = noteEndX;
      }
    } else {
      endX = noteEndX;
    }
    const span = endX - noteX;

    // Clone the VexFlow annotation for remaining syllable parts (skip p=0, it's the original)
    for (let p = 1; p < parts.length; p++) {
      const clone = sourceTextEl.cloneNode(true);
      const x = noteX + (p / parts.length) * span;
      clone.setAttribute("x", String(x));
      clone.textContent = parts[p];
      svgEl.appendChild(clone);
    }
  }
}
