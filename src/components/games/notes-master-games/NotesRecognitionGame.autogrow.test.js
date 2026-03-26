/**
 * Unit tests for buildInitialTrailPool — within-node auto-grow setup.
 *
 * Discovery nodes start with contextNotes visible, focusNotes hidden.
 * Practice nodes and first-ever nodes use full notePool with nothing hidden.
 */
import { describe, it, expect } from 'vitest';
import { buildInitialTrailPool } from './NotesRecognitionGame.jsx';

describe('buildInitialTrailPool — within-node auto-grow setup', () => {
  // --- Discovery nodes: start with contextNotes, hide focusNotes ---

  it('treble_1_2 (C4,D4; focus D4, context C4): starts C4, hides D4', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('treble_1_2');
    expect(initialNotes).toEqual(['C4']);
    expect(hiddenNotes).toEqual(['D4']);
  });

  it('treble_1_5 (C4,D4,E4; focus E4, context C4,D4): starts C4,D4, hides E4', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('treble_1_5');
    expect(initialNotes).toEqual(['C4', 'D4']);
    expect(hiddenNotes).toEqual(['E4']);
  });

  it('bass_1_2 (C4,B3; focus B3, context C4): starts C4, hides B3', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('bass_1_2');
    expect(initialNotes).toEqual(['C4']);
    expect(hiddenNotes).toEqual(['B3']);
  });

  // --- First-ever node: contextNotes is empty, use full pool ---

  it('treble_1_1 (pool C4; focus C4, no context): full pool, nothing hidden', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('treble_1_1');
    expect(initialNotes).toEqual(['C4']);
    expect(hiddenNotes).toEqual([]);
  });

  // --- Practice nodes: focusNotes is empty, use full pool ---

  it('treble_1_3 (pool C4,D4; no focus, all context): full pool, nothing hidden', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('treble_1_3');
    expect(initialNotes).toEqual(['C4', 'D4']);
    expect(hiddenNotes).toEqual([]);
  });

  // --- Edge cases ---

  it('returns empty arrays for null nodeId', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool(null);
    expect(initialNotes).toEqual([]);
    expect(hiddenNotes).toEqual([]);
  });

  it('returns empty arrays for unknown nodeId', () => {
    const { initialNotes, hiddenNotes } = buildInitialTrailPool('nonexistent');
    expect(initialNotes).toEqual([]);
    expect(hiddenNotes).toEqual([]);
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
