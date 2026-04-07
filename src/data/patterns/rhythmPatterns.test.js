import { describe, it, expect } from 'vitest';
import {
  RHYTHM_PATTERNS,
  PATTERN_TAGS,
  getPatternsByTag,
  getPatternById,
  getPatternsByTagAndDifficulty,
} from './rhythmPatterns.js';

// Sixteenth-unit values matching the validator and pattern library spec
const SIXTEENTH_UNITS = {
  q: 4,
  h: 8,
  w: 16,
  '8': 2,
  '16': 1,
  qd: 6,
  hd: 12,
  qr: 4,
  hr: 8,
  wr: 16,
};

const MEASURE_LENGTHS = { '4/4': 16, '3/4': 12, '6/8': 12 };
const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_TIME_SIGS = new Set(['4/4', '3/4', '6/8']);
const VALID_TAG_SET = new Set(PATTERN_TAGS);
const NO_REST_TAGS = new Set([
  'quarter-only',
  'quarter-half',
  'quarter-half-whole',
  'quarter-eighth',
]);
const REST_DURATIONS = new Set(['qr', 'hr', 'wr']);

// ─────────────────────────────────────────────────────────────────────────────
// RHYTHM_PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

describe('RHYTHM_PATTERNS', () => {
  it('has at least 120 patterns', () => {
    expect(RHYTHM_PATTERNS.length).toBeGreaterThanOrEqual(120);
  });

  it('every pattern has all required fields with correct types', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(typeof p.id, `id missing in pattern ${p.id}`).toBe('string');
      expect(typeof p.description, `description missing in "${p.id}"`).toBe('string');
      expect(Array.isArray(p.beats), `beats not array in "${p.id}"`).toBe(true);
      expect(Array.isArray(p.durationSet), `durationSet not array in "${p.id}"`).toBe(true);
      expect(Array.isArray(p.tags), `tags not array in "${p.id}"`).toBe(true);
      expect(typeof p.timeSignature, `timeSignature missing in "${p.id}"`).toBe('string');
      expect(typeof p.difficulty, `difficulty missing in "${p.id}"`).toBe('string');
      expect(typeof p.measureCount, `measureCount missing in "${p.id}"`).toBe('number');
    }
  });

  it('every pattern beats is an array of arrays', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(Array.isArray(p.beats), `beats not array in "${p.id}"`).toBe(true);
      for (let i = 0; i < p.beats.length; i++) {
        expect(
          Array.isArray(p.beats[i]),
          `beats[${i}] not array in "${p.id}"`
        ).toBe(true);
      }
    }
  });

  it('every pattern measureCount equals beats.length', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(p.measureCount, `measureCount mismatch in "${p.id}"`).toBe(
        p.beats.length
      );
    }
  });

  it('every pattern has valid difficulty', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(
        VALID_DIFFICULTIES.has(p.difficulty),
        `Invalid difficulty "${p.difficulty}" in "${p.id}"`
      ).toBe(true);
    }
  });

  it('every pattern has valid timeSignature', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(
        VALID_TIME_SIGS.has(p.timeSignature),
        `Invalid timeSignature "${p.timeSignature}" in "${p.id}"`
      ).toBe(true);
    }
  });

  it('all pattern IDs are unique', () => {
    const ids = RHYTHM_PATTERNS.map((p) => p.id);
    const idSet = new Set(ids);
    expect(idSet.size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN_TAGS
// ─────────────────────────────────────────────────────────────────────────────

describe('PATTERN_TAGS', () => {
  it('has exactly 15 tags', () => {
    expect(PATTERN_TAGS).toHaveLength(15);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(PATTERN_TAGS)).toBe(true);
  });

  it('contains all expected tag names', () => {
    const expected = [
      'quarter-only',
      'quarter-half',
      'quarter-half-whole',
      'quarter-eighth',
      'with-quarter-rest',
      'with-half-rest',
      'with-whole-rest',
      'dotted-half',
      'dotted-quarter',
      'with-sixteenth',
      'compound-basic',
      'compound-mixed',
      'syncopation-basic',
      'syncopation-dotted',
      'three-four',
    ];
    for (const tag of expected) {
      expect(PATTERN_TAGS, `Missing tag "${tag}"`).toContain(tag);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tag coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('tag coverage', () => {
  it('every pattern has at least one valid tag', () => {
    for (const p of RHYTHM_PATTERNS) {
      expect(
        p.tags.length,
        `Pattern "${p.id}" has empty tags array`
      ).toBeGreaterThanOrEqual(1);
      for (const tag of p.tags) {
        expect(
          VALID_TAG_SET.has(tag),
          `Pattern "${p.id}" has unknown tag "${tag}"`
        ).toBe(true);
      }
    }
  });

  it('each tag has at least 8 patterns', () => {
    const tagCounts = {};
    for (const tag of PATTERN_TAGS) tagCounts[tag] = 0;
    for (const p of RHYTHM_PATTERNS) {
      for (const tag of p.tags) {
        if (tagCounts[tag] !== undefined) tagCounts[tag]++;
      }
    }
    for (const tag of PATTERN_TAGS) {
      expect(
        tagCounts[tag],
        `Tag "${tag}" has only ${tagCounts[tag]} patterns (minimum 8)`
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it('each tag has all three difficulty levels with at least 2 each', () => {
    const tagDifficultyCounts = {};
    for (const tag of PATTERN_TAGS) {
      tagDifficultyCounts[tag] = { beginner: 0, intermediate: 0, advanced: 0 };
    }
    for (const p of RHYTHM_PATTERNS) {
      for (const tag of p.tags) {
        if (tagDifficultyCounts[tag]) {
          tagDifficultyCounts[tag][p.difficulty] =
            (tagDifficultyCounts[tag][p.difficulty] || 0) + 1;
        }
      }
    }
    for (const tag of PATTERN_TAGS) {
      for (const diff of ['beginner', 'intermediate', 'advanced']) {
        expect(
          tagDifficultyCounts[tag][diff],
          `Tag "${tag}" has fewer than 2 "${diff}" patterns`
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('each tag has 1-bar, 2-bar, and 4-bar patterns', () => {
    const tagMeasureCounts = {};
    for (const tag of PATTERN_TAGS) {
      tagMeasureCounts[tag] = { 1: 0, 2: 0, 4: 0 };
    }
    for (const p of RHYTHM_PATTERNS) {
      for (const tag of p.tags) {
        if (tagMeasureCounts[tag] && p.measureCount in tagMeasureCounts[tag]) {
          tagMeasureCounts[tag][p.measureCount]++;
        }
      }
    }
    for (const tag of PATTERN_TAGS) {
      for (const len of [1, 2, 4]) {
        expect(
          tagMeasureCounts[tag][len],
          `Tag "${tag}" has no ${len}-bar patterns`
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('three-four tagged patterns have 3/4 time signature', () => {
    const threeFourPatterns = RHYTHM_PATTERNS.filter((p) =>
      p.tags.includes('three-four')
    );
    expect(threeFourPatterns.length).toBeGreaterThan(0);
    for (const p of threeFourPatterns) {
      expect(
        p.timeSignature,
        `Pattern "${p.id}" tagged "three-four" but has timeSignature "${p.timeSignature}"`
      ).toBe('3/4');
    }
  });

  it('compound tagged patterns have 6/8 time signature', () => {
    const compoundPatterns = RHYTHM_PATTERNS.filter(
      (p) =>
        p.tags.includes('compound-basic') || p.tags.includes('compound-mixed')
    );
    expect(compoundPatterns.length).toBeGreaterThan(0);
    for (const p of compoundPatterns) {
      expect(
        p.timeSignature,
        `Pattern "${p.id}" tagged compound but has timeSignature "${p.timeSignature}"`
      ).toBe('6/8');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Content rules
// ─────────────────────────────────────────────────────────────────────────────

describe('content rules', () => {
  it('pre-Unit-4 tags have no rests (D-23)', () => {
    for (const p of RHYTHM_PATTERNS) {
      const hasNoRestTag = p.tags.some((t) => NO_REST_TAGS.has(t));
      if (hasNoRestTag) {
        const allDurs = p.beats.flat();
        for (const dur of allDurs) {
          expect(
            REST_DURATIONS.has(dur),
            `Rest "${dur}" found in pre-Unit-4 pattern "${p.id}" (D-23 violation)`
          ).toBe(false);
        }
      }
    }
  });

  it('no pure-rest measures except single whole-measure rest (D-24)', () => {
    for (const p of RHYTHM_PATTERNS) {
      for (let i = 0; i < p.beats.length; i++) {
        const measure = p.beats[i];
        if (!Array.isArray(measure) || measure.length === 0) continue;
        // Allow ['wr'] — canonical whole-measure rest notation
        const isWholeMeasureRest = measure.length === 1 && measure[0] === 'wr';
        if (!isWholeMeasureRest) {
          const allRests = measure.every((dur) => REST_DURATIONS.has(dur));
          expect(
            allRests,
            `Pure-rest measure ${i + 1} in "${p.id}" (D-24 violation): [${measure.join(', ')}]`
          ).toBe(false);
        }
      }
    }
  });

  it('every measure sums to the correct sixteenth-note total for its time signature', () => {
    for (const p of RHYTHM_PATTERNS) {
      const expectedLength = MEASURE_LENGTHS[p.timeSignature];
      if (expectedLength === undefined) continue;
      for (let i = 0; i < p.beats.length; i++) {
        const measure = p.beats[i];
        if (!Array.isArray(measure)) continue;
        const sum = measure.reduce(
          (acc, dur) => acc + (SIXTEENTH_UNITS[dur] ?? 0),
          0
        );
        expect(
          sum,
          `Measure ${i + 1} of "${p.id}" sums to ${sum}, expected ${expectedLength} (${p.timeSignature})`
        ).toBe(expectedLength);
      }
    }
  });

  it('durationSet matches actual beats durations bidirectionally', () => {
    for (const p of RHYTHM_PATTERNS) {
      const actualDurs = new Set(p.beats.flat());
      const claimedDurs = new Set(p.durationSet);

      for (const dur of actualDurs) {
        expect(
          claimedDurs.has(dur),
          `Duration "${dur}" in beats but not in durationSet for "${p.id}"`
        ).toBe(true);
      }
      for (const dur of claimedDurs) {
        expect(
          actualDurs.has(dur),
          `Duration "${dur}" in durationSet but not in beats for "${p.id}"`
        ).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

describe('helper functions', () => {
  it('getPatternsByTag returns only matching patterns', () => {
    const results = getPatternsByTag('quarter-only');
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.tags).toContain('quarter-only');
    }
  });

  it('getPatternsByTag returns empty array for unknown tag', () => {
    expect(getPatternsByTag('nonexistent')).toEqual([]);
  });

  it('getPatternById returns correct pattern for valid ID', () => {
    const first = RHYTHM_PATTERNS[0];
    const result = getPatternById(first.id);
    expect(result).not.toBeNull();
    expect(result.id).toBe(first.id);
    expect(result.description).toBe(first.description);
  });

  it('getPatternById returns null for unknown ID', () => {
    expect(getPatternById('does_not_exist')).toBeNull();
  });

  it('getPatternsByTagAndDifficulty filters by both tag and difficulty', () => {
    const results = getPatternsByTagAndDifficulty('quarter-only', 'beginner');
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.tags).toContain('quarter-only');
      expect(p.difficulty).toBe('beginner');
    }
  });

  it('getPatternsByTagAndDifficulty returns empty for unmatched combination', () => {
    // 'compound-basic' uses 6/8 — verify it returns results for valid combo
    const valid = getPatternsByTagAndDifficulty('compound-basic', 'beginner');
    expect(valid.length).toBeGreaterThan(0);
    // Completely bogus tag returns empty
    const empty = getPatternsByTagAndDifficulty('nonexistent', 'beginner');
    expect(empty).toEqual([]);
  });
});
