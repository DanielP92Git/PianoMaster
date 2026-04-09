import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock VexFlow before importing the module under test
vi.mock('vexflow', () => {
  const MockStaveNote = vi.fn().mockImplementation((opts) => ({
    _opts: opts,
    keys: opts.keys,
    duration: opts.duration,
    stem_direction: opts.stem_direction,
    addModifier: vi.fn(),
  }));

  const MockDot = {
    buildAndAttach: vi.fn(),
  };

  const MockStem = {
    UP: 1,
    DOWN: -1,
  };

  return {
    StaveNote: MockStaveNote,
    Dot: MockDot,
    Stem: MockStem,
  };
});

import {
  binaryPatternToBeats,
  beatsToVexNotes,
  DURATION_TO_VEX,
} from './rhythmVexflowHelpers';

import { StaveNote, Dot } from 'vexflow';

describe('DURATION_TO_VEX', () => {
  it('Test 4: DURATION_TO_VEX maps 16->w, 8->h, 4->q, 2->8, 1->16', () => {
    expect(DURATION_TO_VEX[16]).toBe('w');
    expect(DURATION_TO_VEX[8]).toBe('h');
    expect(DURATION_TO_VEX[4]).toBe('q');
    expect(DURATION_TO_VEX[2]).toBe('8');
    expect(DURATION_TO_VEX[1]).toBe('16');
  });
});

describe('binaryPatternToBeats', () => {
  it('Test 1: four quarter notes [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] returns 4 beats each with durationUnits=4', () => {
    const pattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const beats = binaryPatternToBeats(pattern);
    expect(beats).toHaveLength(4);
    beats.forEach((beat) => {
      expect(beat.durationUnits).toBe(4);
      expect(beat.isRest).toBe(false);
    });
  });

  it('Test 2: half + two quarters [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0] returns beat 1 with durationUnits=8', () => {
    const pattern = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const beats = binaryPatternToBeats(pattern);
    expect(beats[0].durationUnits).toBe(8);
    expect(beats[0].isRest).toBe(false);
    expect(beats[1].durationUnits).toBe(4);
    expect(beats[2].durationUnits).toBe(4);
  });

  it('Test 3: pattern starting with rest [0,0,0,0,...] returns first beat as rest with durationUnits=4', () => {
    const pattern = [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const beats = binaryPatternToBeats(pattern);
    expect(beats[0].isRest).toBe(true);
    expect(beats[0].durationUnits).toBe(4);
  });
});

describe('beatsToVexNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Test 5: beatsToVexNotes creates StaveNote objects with keys=["b/4"] and stem_direction UP', () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    const notes = beatsToVexNotes(beats);
    expect(notes).toHaveLength(2);
    expect(StaveNote).toHaveBeenCalledTimes(2);

    // Both notes should use keys b/4
    const firstCall = StaveNote.mock.calls[0][0];
    expect(firstCall.keys).toEqual(['b/4']);
    // stem_direction = Stem.UP = 1
    expect(firstCall.stem_direction).toBe(1);
  });

  it('creates rest notes with "r" suffix in duration', () => {
    const beats = [{ durationUnits: 4, isRest: true }];
    beatsToVexNotes(beats);
    const call = StaveNote.mock.calls[0][0];
    expect(call.duration).toMatch(/r$/);
  });

  it('attaches dots for dotted notes (e.g. dotted quarter, durationUnits=6)', () => {
    const beats = [{ durationUnits: 6, isRest: false }];
    beatsToVexNotes(beats);
    expect(Dot.buildAndAttach).toHaveBeenCalled();
  });
});
