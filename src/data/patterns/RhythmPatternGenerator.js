/**
 * RhythmPatternGenerator — Synchronous pattern resolution by tags/IDs.
 *
 * CRITICAL: This file must be Node-safe. No React, VexFlow, or browser imports.
 * Only import from ./rhythmPatterns.js (same directory).
 * Consumed by: validateTrail.mjs (build time), MixedLessonGame (runtime).
 */

import { RHYTHM_PATTERNS } from "./rhythmPatterns.js";

// Slot sizes in sixteenth-note units
const DURATION_SLOTS = {
  w: 16,
  h: 8,
  q: 4,
  8: 2,
  16: 1,
  hd: 12,
  qd: 6,
  wr: 16,
  hr: 8,
  qr: 4,
  "8r": 2,
  "16r": 1,
};

// Map each note duration to its rest equivalent
const REST_EQUIVALENT = {
  w: "wr",
  h: "hr",
  q: "qr",
  8: "8r",
  16: "16r",
  hd: "hr",
  qd: "qr", // Approximate rest equivalents for dotted notes
};

/**
 * Convert a binary pattern array to an array of VexFlow duration codes.
 *
 * Algorithm: greedy longest-fit, prefer sustain over rest (D-06, D-07).
 *
 * @param {number[]} binary - Array of 0s and 1s (1 = onset, 0 = sustain/rest)
 * @param {string[]} durations - Allowed note duration codes (e.g. ['q', 'h'])
 * @param {string} [timeSignature='4/4'] - Time signature (unused in algorithm, reserved)
 * @returns {string[]} Array of VexFlow duration codes
 */
export function binaryToVexDurations(binary, durations, timeSignature = "4/4") {
  // Build sorted note candidates (descending by slot size)
  const noteCandidates = durations
    .filter((d) => DURATION_SLOTS[d] !== undefined)
    .map((d) => ({ code: d, slots: DURATION_SLOTS[d] }))
    .sort((a, b) => b.slots - a.slots);

  // Build sorted rest candidates (descending by slot size)
  // For each note candidate, get its rest equivalent; deduplicate by slot size
  const restCandidateMap = new Map();
  for (const nc of noteCandidates) {
    const restCode = REST_EQUIVALENT[nc.code];
    if (restCode && DURATION_SLOTS[restCode] !== undefined) {
      const restSlots = DURATION_SLOTS[restCode];
      if (!restCandidateMap.has(restSlots)) {
        restCandidateMap.set(restSlots, restCode);
      }
    }
  }
  const restCandidates = Array.from(restCandidateMap.entries())
    .map(([slots, code]) => ({ code, slots }))
    .sort((a, b) => b.slots - a.slots);

  const result = [];
  const len = binary.length;
  let pos = 0;

  // Find all onset positions
  const onsets = [];
  for (let i = 0; i < len; i++) {
    if (binary[i] === 1) onsets.push(i);
  }

  if (onsets.length === 0) {
    // No onsets: fill entire measure with rests
    fillRests(result, len, restCandidates);
    return result;
  }

  // Handle leading rest (before first onset)
  if (onsets[0] > 0) {
    fillRests(result, onsets[0], restCandidates);
    pos = onsets[0];
  }

  // Process each onset
  for (let i = 0; i < onsets.length; i++) {
    pos = onsets[i];
    const nextOnset = i + 1 < onsets.length ? onsets[i + 1] : len;
    const gap = nextOnset - pos;

    // Find the longest note candidate that fits within the gap
    let chosen = null;
    for (const nc of noteCandidates) {
      if (nc.slots <= gap) {
        chosen = nc;
        break;
      }
    }

    if (chosen === null) {
      // No note fits — use smallest available rest (edge case)
      const smallestRest = restCandidates[restCandidates.length - 1];
      if (smallestRest) {
        result.push(smallestRest.code);
        pos += smallestRest.slots;
      } else {
        // Fallback: advance by 1
        pos += 1;
      }
      continue;
    }

    result.push(chosen.code);
    pos += chosen.slots;

    // Fill any remaining gap before next onset with rests
    const remaining = nextOnset - pos;
    if (remaining > 0) {
      fillRests(result, remaining, restCandidates);
    }
  }

  return result;
}

/**
 * Fill `slots` worth of space with the largest fitting rest durations.
 *
 * @param {string[]} result - Output array to append to
 * @param {number} slots - Number of sixteenth-note slots to fill
 * @param {Array<{code: string, slots: number}>} restCandidates - Sorted descending by slots
 */
function fillRests(result, slots, restCandidates) {
  let remaining = slots;
  while (remaining > 0) {
    let placed = false;
    for (const rc of restCandidates) {
      if (rc.slots <= remaining) {
        result.push(rc.code);
        remaining -= rc.slots;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // No rest fits — this shouldn't happen with a well-formed pattern but
      // break to avoid infinite loop
      break;
    }
  }
}

/**
 * Check whether a binary pattern would require rest codes when rendered
 * with the given durations.
 *
 * Algorithm mirrors binaryToVexDurations: each onset gets exactly ONE note
 * (the longest that fits within the gap to the next onset). If the note
 * doesn't exactly fill the gap, the remainder becomes a rest. Therefore,
 * a pattern needs rests if:
 *   - There is a leading gap before the first onset, OR
 *   - Any gap (onset to next onset, or onset to measure end) is not exactly
 *     equal to one of the available note durations.
 *
 * @param {number[]} binary - Pattern array of 0s and 1s
 * @param {string[]} durations - Allowed duration codes (may include rest codes)
 * @returns {boolean}
 */
function patternNeedsRests(binary, durations) {
  // Note-only (non-rest) duration slot sizes, as a Set for O(1) lookup
  const noteSlotSet = new Set(
    durations
      .filter((d) => !d.endsWith("r") && DURATION_SLOTS[d] !== undefined)
      .map((d) => DURATION_SLOTS[d])
  );

  if (noteSlotSet.size === 0) return true; // No note durations available

  const onsets = [];
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1) onsets.push(i);
  }
  if (onsets.length === 0) return true; // No onsets = all rests

  // Check leading gap (before first onset) — needs a rest if onset doesn't start at 0
  if (onsets[0] > 0) return true;

  // For each onset, binaryToVexDurations places exactly ONE note (longest fit).
  // If that note doesn't exactly span the gap to the next onset, rests fill the remainder.
  // So: pattern is rest-free iff every gap exactly matches an available note duration.
  for (let i = 0; i < onsets.length; i++) {
    const nextOnset = i + 1 < onsets.length ? onsets[i + 1] : binary.length;
    const gap = nextOnset - onsets[i];

    // The gap must exactly equal one of the note durations
    if (!noteSlotSet.has(gap)) return true;
  }

  return false;
}

/**
 * Check if a durations array includes any rest codes.
 *
 * @param {string[]} durations - Duration codes to check
 * @returns {boolean}
 */
export function durationsIncludeRests(durations) {
  return durations.some((d) => d.endsWith("r"));
}

/**
 * Resolve a random pattern matching ALL provided tags.
 *
 * @param {string[]} tags - Tags that the pattern must have (AND logic)
 * @param {string[]} durations - Allowed note duration codes for rendering
 * @param {Object} [options={}] - Optional filters
 * @param {string} [options.timeSignature] - Filter by time signature ('4/4' | '3/4' | '6/8')
 * @param {boolean} [options.allowRests=false] - Whether to allow patterns that produce rest codes.
 *   Defaults to false (safe default). Pass true for nodes whose curriculum includes rests.
 * @returns {{ patternId, binary, timeSignature, vexDurations, tags } | null}
 */
export function resolveByTags(tags, durations, options = {}) {
  const { allowRests = false, timeSignature: tsFilter } = options;

  let matching = RHYTHM_PATTERNS.filter((p) =>
    tags.every((tag) => p.tags.includes(tag))
  );

  if (tsFilter) {
    matching = matching.filter((p) => p.timeSignature === tsFilter);
  }

  // When rests are not allowed, filter out patterns that would produce rest codes
  if (!allowRests) {
    matching = matching.filter((p) => !patternNeedsRests(p.pattern, durations));
  }

  // D-09 (Phase 33): require the resolved vex output to be a subset of `durations`.
  // This is the central duration filter — protects pulse, dictation, reading, and tap
  // simultaneously by catching tag-vs-duration drift at the resolution layer.
  // See .planning/phases/33-rhythm-issues-cleanup/33-PATTERNS.md §4.
  matching = matching.filter((p) => {
    const vex = binaryToVexDurations(p.pattern, durations, p.timeSignature);
    return vex.every((code) => durations.includes(code));
  });

  if (matching.length === 0) return null;

  const selected = matching[Math.floor(Math.random() * matching.length)];
  const vexDurations = binaryToVexDurations(
    selected.pattern,
    durations,
    selected.timeSignature
  );

  return {
    patternId: selected.id,
    binary: selected.pattern,
    timeSignature: selected.timeSignature,
    vexDurations,
    tags: selected.tags,
  };
}

/**
 * Resolve patterns matching ANY of the given tags (OR semantics).
 *
 * Used by boss nodes (D-06) where patternTags lists cumulative tags from
 * multiple prior units. Unlike resolveByTags (AND), this returns patterns
 * that match at least one tag, creating a wider pool.
 *
 * @param {string[]} tags - Array of tag strings (at least one must match)
 * @param {string[]} durations - Allowed VexFlow duration codes
 * @param {Object} [options] - Same options as resolveByTags
 * @param {boolean} [options.allowRests=false] - Include patterns needing rests
 * @param {string} [options.timeSignature] - Filter by time signature
 * @returns {{ patternId, binary, timeSignature, vexDurations, tags } | null}
 */
export function resolveByAnyTag(tags, durations, options = {}) {
  const { allowRests = false, timeSignature: tsFilter } = options;

  let matching = RHYTHM_PATTERNS.filter((p) =>
    tags.some((tag) => p.tags.includes(tag))
  );

  if (tsFilter) {
    matching = matching.filter((p) => p.timeSignature === tsFilter);
  }

  if (!allowRests) {
    matching = matching.filter((p) => !patternNeedsRests(p.pattern, durations));
  }

  // D-09 (Phase 33): require the resolved vex output to be a subset of `durations`.
  // Mirrors the filter in resolveByTags — applied here for OR-mode (cumulative
  // boss/speed pools) to ensure tag-vs-duration drift is caught at the resolution
  // layer regardless of which resolver is used.
  // See .planning/phases/33-rhythm-issues-cleanup/33-PATTERNS.md §4.
  matching = matching.filter((p) => {
    const vex = binaryToVexDurations(p.pattern, durations, p.timeSignature);
    return vex.every((code) => durations.includes(code));
  });

  if (matching.length === 0) return null;

  const selected = matching[Math.floor(Math.random() * matching.length)];
  const vexDurations = binaryToVexDurations(
    selected.pattern,
    durations,
    selected.timeSignature
  );

  return {
    patternId: selected.id,
    binary: selected.pattern,
    timeSignature: selected.timeSignature,
    vexDurations,
    tags: selected.tags,
  };
}

/**
 * Resolve the first pattern matching any of the provided IDs.
 *
 * @param {string[]} ids - Pattern IDs to search for
 * @param {string[]} durations - Allowed note duration codes for rendering
 * @param {Object} [options={}] - Optional filters
 * @param {boolean} [options.allowRests=false] - Whether to allow patterns that produce rest codes
 * @returns {{ patternId, binary, timeSignature, vexDurations, tags } | null}
 */
export function resolveByIds(ids, durations, options = {}) {
  const { allowRests = false } = options;

  let candidates = RHYTHM_PATTERNS.filter((p) => ids.includes(p.id));

  if (!allowRests) {
    candidates = candidates.filter(
      (p) => !patternNeedsRests(p.pattern, durations)
    );
  }

  const selected = candidates[0];
  if (!selected) return null;

  const vexDurations = binaryToVexDurations(
    selected.pattern,
    durations,
    selected.timeSignature
  );

  return {
    patternId: selected.id,
    binary: selected.pattern,
    timeSignature: selected.timeSignature,
    vexDurations,
    tags: selected.tags,
  };
}
