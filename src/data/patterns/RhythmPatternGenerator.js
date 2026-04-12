/**
 * RhythmPatternGenerator — Synchronous pattern resolution by tags/IDs.
 *
 * CRITICAL: This file must be Node-safe. No React, VexFlow, or browser imports.
 * Only import from ./rhythmPatterns.js (same directory).
 * Consumed by: validateTrail.mjs (build time), MixedLessonGame (runtime).
 */

import { RHYTHM_PATTERNS } from './rhythmPatterns.js';

// Slot sizes in sixteenth-note units
const DURATION_SLOTS = {
  w: 16, h: 8, q: 4, '8': 2, '16': 1,
  hd: 12, qd: 6,
  wr: 16, hr: 8, qr: 4, '8r': 2, '16r': 1,
};

// Map each note duration to its rest equivalent
const REST_EQUIVALENT = {
  w: 'wr', h: 'hr', q: 'qr', '8': '8r', '16': '16r',
  hd: 'hr', qd: 'qr', // Approximate rest equivalents for dotted notes
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
export function binaryToVexDurations(binary, durations, timeSignature = '4/4') {
  // Build sorted note candidates (descending by slot size)
  const noteCandidates = durations
    .filter(d => DURATION_SLOTS[d] !== undefined)
    .map(d => ({ code: d, slots: DURATION_SLOTS[d] }))
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
 * Resolve a random pattern matching ALL provided tags.
 *
 * @param {string[]} tags - Tags that the pattern must have (AND logic)
 * @param {string[]} durations - Allowed note duration codes for rendering
 * @param {Object} [options={}] - Optional filters
 * @param {string} [options.timeSignature] - Filter by time signature ('4/4' | '3/4' | '6/8')
 * @returns {{ patternId, binary, timeSignature, vexDurations, tags } | null}
 */
export function resolveByTags(tags, durations, options = {}) {
  let matching = RHYTHM_PATTERNS.filter(p =>
    tags.every(tag => p.tags.includes(tag))
  );

  if (options.timeSignature) {
    matching = matching.filter(p => p.timeSignature === options.timeSignature);
  }

  if (matching.length === 0) return null;

  const selected = matching[Math.floor(Math.random() * matching.length)];
  const vexDurations = binaryToVexDurations(selected.pattern, durations, selected.timeSignature);

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
 * @returns {{ patternId, binary, timeSignature, vexDurations, tags } | null}
 */
export function resolveByIds(ids, durations) {
  const selected = RHYTHM_PATTERNS.find(p => ids.includes(p.id));
  if (!selected) return null;

  const vexDurations = binaryToVexDurations(selected.pattern, durations, selected.timeSignature);

  return {
    patternId: selected.id,
    binary: selected.pattern,
    timeSignature: selected.timeSignature,
    vexDurations,
    tags: selected.tags,
  };
}
