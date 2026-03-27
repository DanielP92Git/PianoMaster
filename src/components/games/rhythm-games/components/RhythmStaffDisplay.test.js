import { describe, it, expect, vi } from 'vitest';

// Mock vexflow before any component imports
vi.mock('vexflow', () => ({
  Renderer: vi.fn(() => ({
    resize: vi.fn(),
    getContext: vi.fn(() => ({
      setFillStyle: vi.fn(),
      setStrokeStyle: vi.fn(),
    })),
  })),
  Stave: vi.fn(() => ({
    addTimeSignature: vi.fn().mockReturnThis(),
    setContext: vi.fn().mockReturnThis(),
    draw: vi.fn().mockReturnThis(),
  })),
  StaveNote: vi.fn(() => ({
    getElem: vi.fn(() => null),
    setStemDirection: vi.fn().mockReturnThis(),
    addModifier: vi.fn().mockReturnThis(),
  })),
  Voice: vi.fn(() => ({
    setStrict: vi.fn().mockReturnThis(),
    addTickables: vi.fn().mockReturnThis(),
    draw: vi.fn().mockReturnThis(),
    getTickables: vi.fn(() => []),
  })),
  Formatter: vi.fn(() => ({
    joinVoices: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
  })),
  Beam: {
    generateBeams: vi.fn(() => []),
  },
  Stem: { UP: 1 },
  Dot: { buildAndAttach: vi.fn() },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

describe('RhythmStaffDisplay smoke tests', () => {
  it('can import RhythmStaffDisplay without errors', async () => {
    const mod = await import('./RhythmStaffDisplay.jsx');
    expect(mod.default).toBeDefined();
  });

  it('can import FloatingFeedback without errors', async () => {
    const mod = await import('./FloatingFeedback.jsx');
    expect(mod.default).toBeDefined();
  });

  it('can import CountdownOverlay without errors', async () => {
    const mod = await import('./CountdownOverlay.jsx');
    expect(mod.default).toBeDefined();
  });

  it('beatsToVexNotes returns an array', async () => {
    const { beatsToVexNotes } = await import('../utils/rhythmVexflowHelpers.js');
    const result = beatsToVexNotes([{ durationUnits: 4, isRest: false }]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});
