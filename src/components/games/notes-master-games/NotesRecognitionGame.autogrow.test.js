/**
 * Unit tests for filterAutoGrowCandidates — the auto-grow boundary guard.
 *
 * Rule: Natural-only sessions (currentPoolHasAccidentals=false) cannot receive
 * accidental notes from subsequent trail nodes via auto-grow.
 * Accidental sessions (currentPoolHasAccidentals=true) can receive any note.
 */
import { describe, it, expect } from 'vitest';
import { filterAutoGrowCandidates } from './NotesRecognitionGame.jsx';

describe('filterAutoGrowCandidates — auto-grow boundary guard', () => {
  // --- Natural session (currentPoolHasAccidentals = false) ---

  it('filters out F#4 from a mixed pool when session is natural-only', () => {
    const result = filterAutoGrowCandidates(['C4', 'D4', 'F#4'], false);
    expect(result).toEqual(['C4', 'D4']);
  });

  it('returns empty array when all candidates are accidentals in a natural session', () => {
    const result = filterAutoGrowCandidates(['F#4', 'C#4'], false);
    expect(result).toEqual([]);
  });

  it('returns all notes unchanged when pool has no accidentals in a natural session', () => {
    const result = filterAutoGrowCandidates(['C4', 'D4', 'E4'], false);
    expect(result).toEqual(['C4', 'D4', 'E4']);
  });

  it('filters out flat notes (Bb4) in a natural session', () => {
    const result = filterAutoGrowCandidates(['Bb4', 'C4'], false);
    expect(result).toEqual(['C4']);
  });

  it('filters out both sharps and flats in a natural session', () => {
    const result = filterAutoGrowCandidates(['F#4', 'Bb4', 'C4'], false);
    expect(result).toEqual(['C4']);
  });

  // --- Accidental session (currentPoolHasAccidentals = true) ---

  it('keeps all candidates (including accidentals) when session has accidentals', () => {
    const result = filterAutoGrowCandidates(['F#4', 'C#4'], true);
    expect(result).toEqual(['F#4', 'C#4']);
  });

  it('keeps natural notes when session has accidentals', () => {
    const result = filterAutoGrowCandidates(['C4', 'D4'], true);
    expect(result).toEqual(['C4', 'D4']);
  });

  it('keeps mixed pool (flats + naturals) when session has accidentals', () => {
    const result = filterAutoGrowCandidates(['Bb4', 'Eb4', 'C4'], true);
    expect(result).toEqual(['Bb4', 'Eb4', 'C4']);
  });

  // --- Edge cases ---

  it('returns empty array unchanged when input is empty', () => {
    expect(filterAutoGrowCandidates([], false)).toEqual([]);
    expect(filterAutoGrowCandidates([], true)).toEqual([]);
  });

  // --- B3/B4 regression: natural note B must not be treated as a flat ---

  it('keeps B3 in natural session — not a flat despite containing letter b', () => {
    const result = filterAutoGrowCandidates(['B3', 'C4'], false);
    expect(result).toEqual(['B3', 'C4']);
  });

  it('keeps B4 in natural session — not a flat despite containing letter b', () => {
    const result = filterAutoGrowCandidates(['B4', 'D4'], false);
    expect(result).toEqual(['B4', 'D4']);
  });
});

describe('enableFlats derivation — anchored flat detection', () => {
  // Tests the anchored regex pattern /^[A-G]b\d/ used in TrailNodeModal.
  // This regex matches true flats (Bb3, Eb4, Ab3, Db3) but NOT the natural note B3 or B4.

  const deriveEnableFlats = (notePool) => notePool.some(n => /^[A-G]b\d/.test(n));

  const FULL_SHARP_POOL = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'F#3', 'C#3', 'G#3'];

  it('FULL_SHARP_POOL (contains B3 and sharps) yields enableFlats=false', () => {
    expect(deriveEnableFlats(FULL_SHARP_POOL)).toBe(false);
  });

  it('flat pool [Bb3, Eb3, C3] yields enableFlats=true', () => {
    expect(deriveEnableFlats(['Bb3', 'Eb3', 'C3'])).toBe(true);
  });

  it('single natural B: [B4] yields enableFlats=false', () => {
    expect(deriveEnableFlats(['B4'])).toBe(false);
  });

  it('single flat [Db3] yields enableFlats=true', () => {
    expect(deriveEnableFlats(['Db3'])).toBe(true);
  });
});
