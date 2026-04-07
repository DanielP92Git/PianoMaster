import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock VexFlow before importing the module under test
vi.mock('vexflow', () => {
  const MockAnnotation = vi.fn().mockImplementation((text) => ({
    text,
    setVerticalJustification: vi.fn().mockReturnThis(),
    setFont: vi.fn().mockReturnThis(),
  }));

  const MockAnnotationVerticalJustify = {
    BOTTOM: 'BOTTOM',
    TOP: 'TOP',
  };

  const MockStaveNote = vi.fn().mockImplementation((opts) => {
    const modifiers = [];
    return {
      _opts: opts,
      keys: opts.keys,
      duration: opts.duration,
      stem_direction: opts.stem_direction,
      addModifier: vi.fn().mockImplementation((modifier) => {
        modifiers.push(modifier);
      }),
      getModifiers: vi.fn().mockImplementation(() => modifiers),
    };
  });

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
    Annotation: MockAnnotation,
    AnnotationVerticalJustify: MockAnnotationVerticalJustify,
  };
});

import {
  binaryPatternToBeats,
  beatsToVexNotes,
  DURATION_TO_VEX,
  SYLLABLE_MAP_EN,
  SYLLABLE_MAP_HE,
  REST_SYLLABLE_EN,
  REST_SYLLABLE_HE,
} from './rhythmVexflowHelpers';

import { StaveNote, Dot, Annotation } from 'vexflow';

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

  it('returns StaveNote objects without annotations by default (no showSyllables arg)', () => {
    const beats = [{ durationUnits: 4, isRest: false }];
    const notes = beatsToVexNotes(beats);
    expect(notes).toHaveLength(1);
    expect(notes[0].getModifiers()).toHaveLength(0);
  });

  it('does not attach annotations when showSyllables is false', () => {
    const beats = [{ durationUnits: 4, isRest: false }];
    const notes = beatsToVexNotes(beats, { showSyllables: false });
    expect(notes[0].getModifiers()).toHaveLength(0);
  });

  it('attaches Annotation modifier when showSyllables is true', () => {
    const beats = [{ durationUnits: 4, isRest: false }];
    const notes = beatsToVexNotes(beats, { showSyllables: true, language: 'en' });
    expect(notes).toHaveLength(1);
    expect(Annotation).toHaveBeenCalled();
    expect(notes[0].getModifiers()).toHaveLength(1);
  });

  it('uses English quarter note syllable "ta" when language is en', () => {
    const beats = [{ durationUnits: 4, isRest: false }];
    beatsToVexNotes(beats, { showSyllables: true, language: 'en' });
    expect(Annotation).toHaveBeenCalledWith('ta');
  });

  it('uses Hebrew quarter note syllable "טָה" when language is he', () => {
    const beats = [{ durationUnits: 4, isRest: false }];
    beatsToVexNotes(beats, { showSyllables: true, language: 'he' });
    expect(Annotation).toHaveBeenCalledWith('טָה');
  });

  it('uses English rest syllable "sh" for rest beats', () => {
    const beats = [{ durationUnits: 4, isRest: true }];
    beatsToVexNotes(beats, { showSyllables: true, language: 'en' });
    expect(Annotation).toHaveBeenCalledWith(REST_SYLLABLE_EN);
  });

  it('uses Hebrew rest syllable "הָס" for rest beats in Hebrew', () => {
    const beats = [{ durationUnits: 4, isRest: true }];
    beatsToVexNotes(beats, { showSyllables: true, language: 'he' });
    expect(Annotation).toHaveBeenCalledWith(REST_SYLLABLE_HE);
  });

  it('preserves note count when syllables enabled', () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 8, isRest: false },
    ];
    const withoutSyllables = beatsToVexNotes(beats);
    vi.clearAllMocks();
    const withSyllables = beatsToVexNotes(beats, { showSyllables: true, language: 'en' });
    expect(withSyllables).toHaveLength(withoutSyllables.length);
  });
});

describe('SYLLABLE_MAP_EN', () => {
  it('maps quarter note (4) to ta', () => {
    expect(SYLLABLE_MAP_EN[4]).toBe('ta');
  });
  it('maps eighth note (2) to ti', () => {
    expect(SYLLABLE_MAP_EN[2]).toBe('ti');
  });
  it('maps sixteenth note (1) to ti', () => {
    expect(SYLLABLE_MAP_EN[1]).toBe('ti');
  });
  it('maps half note (8) to ta-a', () => {
    expect(SYLLABLE_MAP_EN[8]).toBe('ta-a');
  });
  it('maps whole note (16) to ta-a-a-a', () => {
    expect(SYLLABLE_MAP_EN[16]).toBe('ta-a-a-a');
  });
  it('maps dotted half (12) to ta-a-a', () => {
    expect(SYLLABLE_MAP_EN[12]).toBe('ta-a-a');
  });
  it('maps dotted quarter (6) to ta-a', () => {
    expect(SYLLABLE_MAP_EN[6]).toBe('ta-a');
  });
  it('maps dotted eighth (3) to ta', () => {
    expect(SYLLABLE_MAP_EN[3]).toBe('ta');
  });
});

describe('SYLLABLE_MAP_HE', () => {
  it('maps quarter note (4) to Hebrew syllable טָה', () => {
    expect(SYLLABLE_MAP_HE[4]).toBe('טָה');
  });
  it('maps eighth note (2) to Hebrew syllable טָה-טֶה (corrected ta-te)', () => {
    expect(SYLLABLE_MAP_HE[2]).toBe('טָה-טֶה');
  });
  it('maps sixteenth (1) to Hebrew syllable טָה-טֶה (corrected ta-te)', () => {
    expect(SYLLABLE_MAP_HE[1]).toBe('טָה-טֶה');
  });
  it('maps half note (8) to Hebrew syllable טָה-אָה', () => {
    expect(SYLLABLE_MAP_HE[8]).toBe('טָה-אָה');
  });
  it('maps whole note (16) to Hebrew syllable טָה-אָה-אָה-אָה', () => {
    expect(SYLLABLE_MAP_HE[16]).toBe('טָה-אָה-אָה-אָה');
  });
  it('has a defined value for all DURATION_TO_VEX keys', () => {
    const keys = Object.keys(DURATION_TO_VEX).map(Number);
    keys.forEach((k) => {
      expect(SYLLABLE_MAP_HE[k]).toBeDefined();
      expect(typeof SYLLABLE_MAP_HE[k]).toBe('string');
    });
  });
});

describe('REST_SYLLABLE', () => {
  it('EN rest syllable is sh', () => {
    expect(REST_SYLLABLE_EN).toBe('sh');
  });
  it('HE rest syllable is הָס (Kamatz under heh)', () => {
    expect(REST_SYLLABLE_HE).toBe('הָס');
  });
});
