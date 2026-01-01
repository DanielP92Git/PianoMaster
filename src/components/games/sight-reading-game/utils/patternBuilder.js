import {
  TREBLE_NOTE_DATA,
  BASS_NOTE_DATA,
} from "../constants/noteDefinitions.js";
import {
  NOTE_FREQUENCIES,
  getStaffPosition,
} from "../constants/staffPositions.js";
import {
  getDurationDefinition,
  resolveTimeSignature,
} from "../constants/durationConstants.js";

const isDebugEnabled =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_DEBUG_PATTERN === "true") ||
  (typeof globalThis !== "undefined" &&
    globalThis.process?.env?.VITE_DEBUG_PATTERN === "true");

const debugLog = (...args) => {
  if (isDebugEnabled) {
    console.debug("[PatternBuilder]", ...args);
  }
};

const inferClefForPitch = (pitch) => {
  if (!pitch) return "treble";
  const match = String(pitch).match(/^([A-G])(\d+)$/i);
  if (!match) return "treble";
  const octave = Number(match[2]);
  return octave >= 4 ? "treble" : "bass";
};

/**
 * Parse a clef-qualified ID (e.g., "treble:C4" or "bass:C4")
 * @param {string} raw - The raw selected note value
 * @returns {{ clef: string | null, pitch: string }} - Parsed clef and pitch, or null clef if not qualified
 */
const parseClefQualifiedId = (raw) => {
  if (typeof raw !== "string") return { clef: null, pitch: raw };
  if (raw.startsWith("treble:")) return { clef: "treble", pitch: raw.slice(7) };
  if (raw.startsWith("bass:")) return { clef: "bass", pitch: raw.slice(5) };
  return { clef: null, pitch: raw };
};

const toVexFlowNote = (obj) => {
  const durationInfo = getDurationDefinition(obj.notation);
  const vexDuration = durationInfo.vexflowCode;

  if (obj.type === "rest") {
    return {
      keys: ["b/4"],
      duration: `${vexDuration}r`,
    };
  }

  if (obj.pitch) {
    // Parse pitch (e.g., "C3", "D4", "C10") - handle both single and multi-digit octaves
    const pitchMatch = obj.pitch.match(/^([A-G])(\d+)$/);
    if (pitchMatch) {
      const [, note, octave] = pitchMatch;
      return {
        keys: [`${note.toLowerCase()}/${octave}`],
        duration: vexDuration,
      };
    }
    // Fallback for malformed pitches (shouldn't happen, but defensive)
    debugLog(`Warning: Invalid pitch format: ${obj.pitch}`);
    return { keys: ["c/4"], duration: vexDuration };
  }

  return { keys: ["c/4"], duration: vexDuration };
};

const buildCompleteEasyScore = (enrichedNotation) =>
  enrichedNotation
    .map((obj) => {
      const durationInfo = getDurationDefinition(obj.notation);
      const duration = durationInfo.vexflowCode;

      if (obj.type === "rest") {
        return `B4/${duration}/r`;
      }
      if (obj.pitch) {
        return `${obj.pitch}/${duration}`;
      }
      return `C4/${duration}`;
    })
    .join(", ");

export async function generatePatternData({
  difficulty,
  timeSignature,
  tempo = 80,
  selectedNotes = [],
  clef = "Treble",
  measuresPerPattern = 1,
}) {
  const clefKey = String(clef || "Treble").toLowerCase();
  const resolvedSignature = resolveTimeSignature(timeSignature);
  const beatsPerMeasure = resolvedSignature.beats;
  const totalBeats = beatsPerMeasure * (measuresPerPattern ?? 1);
  const beatDurationSeconds = 60 / Math.max(tempo, 1);
  const unitsPerBeat = resolvedSignature.unitsPerBeat;
  const quarterInfo = getDurationDefinition("quarter");

  const includeRest = Math.random() < 0.5;
  const restBeatIndex = includeRest
    ? Math.floor(Math.random() * totalBeats)
    : null;

  const notationObjects = [];
  for (let beatIndex = 0; beatIndex < totalBeats; beatIndex++) {
    const isRest = restBeatIndex === beatIndex;
    const startTime = beatIndex * beatDurationSeconds;
    const endTime = startTime + beatDurationSeconds;

    notationObjects.push({
      type: isRest ? "rest" : "note",
      notation: quarterInfo.id,
      duration: beatDurationSeconds,
      sixteenthUnits: quarterInfo.sixteenthUnits,
      startPosition: beatIndex * unitsPerBeat,
      startTime,
      endTime,
    });
  }

  const allNotes =
    clefKey === "bass"
      ? BASS_NOTE_DATA
      : clefKey === "both"
        ? [...TREBLE_NOTE_DATA, ...BASS_NOTE_DATA]
        : TREBLE_NOTE_DATA;

  debugLog("=== Note Selection Debug ===");
  debugLog("Clef:", clef);
  debugLog("Selected notes (input):", selectedNotes);
  debugLog(
    "All available notes for clef:",
    allNotes.map((n) => `${n.note} (${n.pitch})`)
  );

  // Create a Set of valid pitches for quick lookup
  const validPitches = new Set(allNotes.map((n) => n.pitch));
  debugLog("Valid pitches for clef:", Array.from(validPitches).sort());

  // Check if selectedNotes contains clef-qualified IDs (e.g., "treble:C4", "bass:C4")
  const hasClefQualifiedFormat =
    clefKey === "both" &&
    selectedNotes.some(
      (n) =>
        typeof n === "string" &&
        (n.startsWith("treble:") || n.startsWith("bass:"))
    );

  // Check if selectedNotes contains direct pitches (new format) or Hebrew names (old format)
  const hasPitchFormat = selectedNotes.some((n) => validPitches.has(n));

  // Process selectedNotes: convert to pitches and validate
  const availableNotes = selectedNotes
    .map((selectedNote) => {
      // Handle clef-qualified format when clef is "both"
      if (clefKey === "both" && typeof selectedNote === "string") {
        const parsed = parseClefQualifiedId(selectedNote);
        if (parsed.clef && parsed.pitch) {
          // Validate the extracted pitch exists in validPitches
          if (validPitches.has(parsed.pitch)) {
            debugLog(
              `✓ Extracted pitch from clef-qualified ID "${selectedNote}": ${parsed.pitch}`
            );
            return parsed.pitch;
          } else {
            debugLog(
              `✗ Invalid pitch in clef-qualified ID "${selectedNote}": ${parsed.pitch}`
            );
            return null;
          }
        }
        // If it doesn't match clef-qualified format, fall through to other checks
      }

      // Check if it's a direct pitch (works for both single clef and "both" clef with direct pitches)
      if (validPitches.has(selectedNote)) {
        debugLog(`✓ Using pitch directly: ${selectedNote}`);
        return selectedNote;
      }

      // If we detected pitch format but this note isn't a pitch, skip it (strict mode)
      if (hasPitchFormat) {
        debugLog(
          `✗ Ignoring non-pitch in pitch-format selection: ${selectedNote}`
        );
        return null;
      }

      // Otherwise, treat as Hebrew name (backward compatibility)
      const noteObj = allNotes.find((n) => n.note === selectedNote);
      if (noteObj) {
        debugLog(
          `✓ Converted Hebrew name "${selectedNote}" to pitch: ${noteObj.pitch}`
        );
        return noteObj.pitch;
      }
      debugLog(`✗ Could not find note: ${selectedNote}`);
      return null;
    })
    .filter(Boolean)
    .filter((pitch) => {
      const isValid = validPitches.has(pitch);
      if (!isValid) {
        debugLog(`✗ Filtered out invalid pitch: ${pitch}`);
      }
      return isValid;
    })
    .filter((pitch, index, self) => {
      const isDuplicate = self.indexOf(pitch) !== index;
      if (isDuplicate) {
        debugLog(`✗ Removed duplicate pitch: ${pitch}`);
      }
      return !isDuplicate;
    });

  if (availableNotes.length === 0) {
    const fallbackNotes = allNotes.slice(0, 5).map((n) => n.pitch);
    availableNotes.push(...fallbackNotes);
    debugLog("⚠ Using fallback notes:", fallbackNotes);
  }

  // Sort availableNotes by frequency to maintain musical order
  // This ensures beginner mode adjacent note selection works correctly
  availableNotes.sort((a, b) => {
    const freqA = NOTE_FREQUENCIES[a] || 0;
    const freqB = NOTE_FREQUENCIES[b] || 0;
    return freqA - freqB;
  });

  debugLog("Final available notes for pattern (sorted):", availableNotes);
  debugLog("Note count:", availableNotes.length);

  // Ensure we're only using the exact selected notes
  if (availableNotes.length === 0 && selectedNotes.length > 0) {
    debugLog(
      "⚠ Error: No valid notes found from selectedNotes, but fallback will be used"
    );
  }

  debugLog("============================");

  let previousNote = null;
  let noteIndex = 0;

  const enrichedNotation = notationObjects.map((obj) => {
    if (obj.type === "note") {
      let selectedNote;
      if (difficulty === "beginner" && previousNote) {
        const prevIndex = availableNotes.indexOf(previousNote);
        const candidates = [
          availableNotes[prevIndex - 1],
          availableNotes[prevIndex],
          availableNotes[prevIndex + 1],
        ].filter(Boolean);

        if (candidates.length > 0) {
          selectedNote =
            candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          selectedNote =
            availableNotes[Math.floor(Math.random() * availableNotes.length)];
        }
      } else {
        selectedNote =
          availableNotes[Math.floor(Math.random() * availableNotes.length)];
      }

      // Validate that the selected note is in availableNotes
      if (!availableNotes.includes(selectedNote)) {
        debugLog(
          `⚠ Warning: Selected note ${selectedNote} not in availableNotes! Using first available.`
        );
        selectedNote = availableNotes[0] || "C4";
      }

      previousNote = selectedNote;
      const eventClef =
        clefKey === "both" ? inferClefForPitch(selectedNote) : clefKey;

      const enrichedNote = {
        ...obj,
        pitch: selectedNote,
        frequency: NOTE_FREQUENCIES[selectedNote],
        clef: eventClef,
        position: getStaffPosition(selectedNote, eventClef),
        index: noteIndex++,
      };

      debugLog(
        `Note ${noteIndex - 1}: Assigned pitch ${selectedNote} (frequency: ${enrichedNote.frequency}Hz)`
      );

      return enrichedNote;
    }

    return {
      ...obj,
      clef: clefKey === "both" ? "treble" : clefKey,
      index: noteIndex++,
    };
  });

  const totalDuration = totalBeats;
  const easyscoreString = buildCompleteEasyScore(enrichedNotation);
  const vexflowNotes = enrichedNotation.map(toVexFlowNote);

  return {
    notes: enrichedNotation,
    rhythmPattern: notationObjects
      .map((obj) => Array(unitsPerBeat).fill(obj.type === "note" ? 1 : 0))
      .flat(),
    totalDuration,
    timeSignature: resolvedSignature.name,
    tempo,
    easyscoreString,
    vexflowNotes,
  };
}
