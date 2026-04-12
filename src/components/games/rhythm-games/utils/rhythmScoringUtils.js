import { calculateTimingThresholds } from "./rhythmTimingUtils";

/**
 * Score a single tap against the scheduled beat times.
 *
 * Pure function — no side effects. Exported for unit testing so the
 * scoring logic can be tested without rendering the full component.
 *
 * @param {number} tapTime - AudioContext.currentTime when tap occurred
 * @param {number[]} scheduledBeatTimes - Array of AudioContext times for each beat onset
 * @param {number} nextBeatIndex - Index from which to search (prevents double-scoring)
 * @param {number} tempo - Current tempo in BPM
 * @returns {{ quality: 'PERFECT'|'GOOD'|'MISS', noteIdx: number, deltaMs: number, newNextBeatIndex: number }}
 */
export function scoreTap(
  tapTime,
  scheduledBeatTimes,
  nextBeatIndex,
  tempo,
  nodeType = null
) {
  const thresholds = calculateTimingThresholds(tempo, nodeType);

  if (!scheduledBeatTimes || scheduledBeatTimes.length === 0) {
    return {
      quality: "MISS",
      noteIdx: -1,
      deltaMs: Infinity,
      newNextBeatIndex: nextBeatIndex,
    };
  }

  // Search from nextBeatIndex onward — find the nearest beat (look at up to 3 candidates)
  let bestDelta = Infinity;
  let bestIdx = nextBeatIndex;

  const searchStart = Math.max(0, nextBeatIndex);
  const searchEnd = Math.min(scheduledBeatTimes.length - 1, nextBeatIndex + 2);

  for (let i = searchStart; i <= searchEnd; i++) {
    const delta = Math.abs((tapTime - scheduledBeatTimes[i]) * 1000); // convert to ms
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = i;
    }
  }

  let quality;
  if (bestDelta <= thresholds.PERFECT) {
    quality = "PERFECT";
  } else if (bestDelta <= thresholds.GOOD) {
    quality = "GOOD";
  } else {
    quality = "MISS";
  }

  // Advance next beat index past the scored beat (prevent double-scoring same beat)
  const newNextBeatIndex = bestIdx + 1;

  return {
    quality,
    noteIdx: bestIdx,
    deltaMs: bestDelta,
    newNextBeatIndex,
  };
}
