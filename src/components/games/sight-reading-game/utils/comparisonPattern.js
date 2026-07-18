import { NOTE_FREQUENCIES } from "../constants/staffPositions";

/**
 * Reconstruct the child's rendition ("yours") from an exercise's performanceResults, for the
 * played-vs-correct comparison playback (PRAC-02 / D-12/D-13). No raw audio is recorded anywhere;
 * this is a lossy reconstruction from note-name events already in memory.
 * @param {Array} patternNotes - the exercise pattern's notes ({type, startTime, endTime, pitch, ...})
 * @param {Array} performanceResults - per-note result records
 * @returns {Array} playback objects {type,startTime,endTime,frequency,noteIndex} for useRhythmPlayback
 */
export function buildPlayedRendition(patternNotes, performanceResults) {
  const byIndex = new Map(
    (performanceResults || []).map((r) => [r.noteIndex, r])
  );
  const rendition = [];
  (patternNotes || []).forEach((ev, i) => {
    if (ev.type !== "note") return; // rests: playback skips them anyway
    const r = byIndex.get(i);
    if (!r || r.timingStatus === "missed") return; // missed -> silence (the lesson)
    const pitch = r.isCorrect ? ev.pitch : r.detected; // wrong pitch -> what they played
    const frequency = NOTE_FREQUENCIES[pitch];
    if (!frequency) return;
    const offsetSec = (r.timeDiff || 0) / 1000; // wrong_pitch: 0 today (D-15 gap, not closed here)
    rendition.push({
      type: "note",
      startTime: Math.max(0, ev.startTime + offsetSec),
      endTime: Math.max(
        ev.startTime + offsetSec + 0.05,
        ev.endTime + offsetSec
      ),
      frequency,
      noteIndex: i, // ignored by play(); needed for staff-highlight mapping (Pitfall 6)
    });
  });
  return rendition;
}
