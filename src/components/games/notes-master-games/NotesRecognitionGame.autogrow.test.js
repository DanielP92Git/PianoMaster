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
});
