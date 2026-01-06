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
import { generateRhythmEvents } from "./rhythmGenerator.js";

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
  rhythmSettings,
  rhythmComplexity = "simple",
}) {
  const clefKey = String(clef || "Treble").toLowerCase();
  const resolvedSignature = resolveTimeSignature(timeSignature);
  const beatsPerMeasure = resolvedSignature.beats;
  const totalBeats = beatsPerMeasure * (measuresPerPattern ?? 1);
  const unitsPerBeat = resolvedSignature.unitsPerBeat || 4;
  const beatDurationSeconds = 60 / Math.max(tempo, 1);
  const secondsPerSixteenth = beatDurationSeconds / 4;

  const activeRhythmSettings = rhythmSettings || {};
  const allowedNoteDurations = Array.isArray(
    activeRhythmSettings.allowedNoteDurations
  )
    ? activeRhythmSettings.allowedNoteDurations
    : ["q", "8"];
  const allowRests = !!activeRhythmSettings.allowRests;
  const allowedRestDurations = Array.isArray(
    activeRhythmSettings.allowedRestDurations
  )
    ? activeRhythmSettings.allowedRestDurations
    : ["q", "8"];
  // For complex mode, only allow patterns that are enabled (default: all)
  const enabledComplexPatterns = Array.isArray(
    activeRhythmSettings.enabledComplexPatterns
  )
    ? activeRhythmSettings.enabledComplexPatterns
    : null; // null means "use all" in rhythmGenerator

  const rhythmEvents = generateRhythmEvents({
    timeSignature: resolvedSignature,
    measuresPerPattern,
    allowedNoteDurations,
    allowRests,
    allowedRestDurations,
    rhythmComplexity,
    enabledComplexPatterns,
  });

  // Convert rhythm events into the notationObjects format used by the rest of the game.
  const notationObjects = [];
  let currentSixteenth = 0;
  for (const evt of rhythmEvents) {
    const durationInfo = getDurationDefinition(evt.notation);
    // Use the generator's sixteenthUnits as the source of truth, with fallback to durationInfo
    // This ensures consistency even if notation lookup has edge cases
    const eventUnits = evt.sixteenthUnits ?? durationInfo.sixteenthUnits;
    const startTime = currentSixteenth * secondsPerSixteenth;
    const endTime = (currentSixteenth + eventUnits) * secondsPerSixteenth;

    notationObjects.push({
      type: evt.type,
      notation: durationInfo.id,
      duration: endTime - startTime,
      sixteenthUnits: eventUnits,
      startPosition: currentSixteenth,
      startTime,
      endTime,
      patternId: evt.patternId, // Preserve patternId from rhythm generator
      beatIndex: evt.beatIndex, // Beat where this pattern starts
      beatSpan: evt.beatSpan, // Number of beats this pattern spans
      isDotted: evt.isDotted, // Whether this is a dotted duration
    });

    currentSixteenth += eventUnits;
  }
  
  // Sanity check: verify no events overlap (development-time assertion)
  if (isDebugEnabled) {
    const occupiedSlots = new Set();
    for (const obj of notationObjects) {
      for (let slot = obj.startPosition; slot < obj.startPosition + obj.sixteenthUnits; slot++) {
        if (occupiedSlots.has(slot)) {
          console.error("[PatternBuilder] OVERLAP DETECTED at slot", slot, "in", obj);
        }
        occupiedSlots.add(slot);
      }
    }
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

  // Group events by patternId for grand staff mode
  // All events with the same patternId belong to the same rhythmic group and should share a staff
  const eventsByPattern = new Map();
  notationObjects.forEach((obj, idx) => {
    const patternId = obj.patternId ?? idx; // fallback to index if no patternId
    if (!eventsByPattern.has(patternId)) {
      eventsByPattern.set(patternId, []);
    }
    eventsByPattern.get(patternId).push(idx);
  });

  // Beaming hint: dotted-quarter + eighth (6 + 2) should NOT beam the eighth to anything else.
  // We mark the trailing eighth as noBeam so the renderer can force it to be flagged.
  // This avoids cases where Beam.generateBeams() incorrectly connects it to a later sixteenth
  // (because we generate beams from a notes-only array that may skip rests/spacers).
  for (const [, eventIndices] of eventsByPattern) {
    if (eventIndices.length !== 2) continue;
    const first = notationObjects[eventIndices[0]];
    const second = notationObjects[eventIndices[1]];

    if (
      first?.notation === "dotted-quarter" &&
      first?.sixteenthUnits === 6 &&
      second?.notation === "eighth" &&
      second?.sixteenthUnits === 2
    ) {
      // Mutate in place; `enrichedNotation` spreads `obj` so this propagates.
      second.noBeam = true;
    }
  }

  // Determine staff for each beat (only used in grand staff mode)
  // Staff is chosen per beat boundary; all patterns starting on the same beat get the same staff
  const staffPerBeat = new Map();
  if (clefKey === "both") {
    for (let beat = 0; beat < totalBeats; beat++) {
      staffPerBeat.set(beat, Math.random() < 0.5 ? "treble" : "bass");
    }
  }

  // Pre-compute staff for each pattern based on its beatIndex
  // This ensures all events in a pattern share the same staff
  const staffPerPattern = new Map();
  if (clefKey === "both") {
    for (const [patternId, eventIndices] of eventsByPattern) {
      // Use the beatIndex from the first event in the pattern
      const firstEvent = notationObjects[eventIndices[0]];
      const beatIndex = firstEvent.beatIndex ?? Math.floor(firstEvent.startPosition / unitsPerBeat);
      const targetStaff = staffPerBeat.get(beatIndex) || "treble";
      staffPerPattern.set(patternId, targetStaff);
    }
  }

  let previousNote = null;
  let noteIndex = 0;
  // Track previous note per pattern for better beginner mode behavior
  const previousNotePerPattern = new Map();

  const enrichedNotation = notationObjects.map((obj, idx) => {
    const patternId = obj.patternId ?? idx;

    if (obj.type === "note") {
      let selectedNote;
      let notePool = availableNotes;

      // In grand staff mode, filter notes by target staff based on pattern
      // All events in the same pattern share the same staff (determined by beatIndex)
      if (clefKey === "both") {
        const targetStaff = staffPerPattern.get(patternId) || "treble";

        // Filter available notes to target clef
        const clefNotes = availableNotes.filter((pitch) => {
          const inferredClef = inferClefForPitch(pitch);
          return inferredClef === targetStaff;
        });

        // Use clefNotes if available, fallback to all notes
        notePool = clefNotes.length > 0 ? clefNotes : availableNotes;
      }

      // For beginner mode, use previous note from the same pattern if available
      const patternPreviousNote = previousNotePerPattern.get(patternId) || previousNote;
      
      if (difficulty === "beginner" && patternPreviousNote && notePool.includes(patternPreviousNote)) {
        const prevIndex = notePool.indexOf(patternPreviousNote);
        const candidates = [
          notePool[prevIndex - 1],
          notePool[prevIndex],
          notePool[prevIndex + 1],
        ].filter(Boolean);

        if (candidates.length > 0) {
          selectedNote =
            candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          selectedNote =
            notePool[Math.floor(Math.random() * notePool.length)];
        }
      } else {
        selectedNote =
          notePool[Math.floor(Math.random() * notePool.length)];
      }

      // Validate that the selected note is in availableNotes
      if (!availableNotes.includes(selectedNote)) {
        debugLog(
          `⚠ Warning: Selected note ${selectedNote} not in availableNotes! Using first available.`
        );
        selectedNote = availableNotes[0] || "C4";
      }

      previousNote = selectedNote;
      previousNotePerPattern.set(patternId, selectedNote);
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

    // Handle rests - assign to staff based on pattern in grand staff mode
    // All events in the same pattern share the same staff
    if (clefKey === "both" && obj.type === "rest") {
      const targetStaff = staffPerPattern.get(patternId) || "treble";

      return {
        ...obj,
        clef: targetStaff,
        index: noteIndex++,
      };
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
      .map((obj) => Array(obj.sixteenthUnits).fill(obj.type === "note" ? 1 : 0))
      .flat(),
    totalDuration,
    timeSignature: resolvedSignature.name,
    tempo,
    easyscoreString,
    vexflowNotes,
  };
}
