import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePianoSampler, NOTE_FREQS, noteNameToHz } from './usePianoSampler';

// --- Mock setup ---

const mockOscillator = {
  start: vi.fn(),
  stop: vi.fn(),
  connect: vi.fn(),
  type: '',
  frequency: { setValueAtTime: vi.fn() },
};

const mockGain = {
  connect: vi.fn(),
  gain: {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};

const mockAudioContext = {
  state: 'running',
  currentTime: 0.5,
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator, frequency: { ...mockOscillator.frequency } })),
  createGain: vi.fn(() => ({ ...mockGain, gain: { ...mockGain.gain } })),
  resume: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../contexts/AudioContextProvider', () => ({
  useAudioContext: () => ({
    audioContextRef: { current: mockAudioContext },
  }),
}));

describe('NOTE_FREQS', () => {
  it('Test 10: NOTE_FREQS map contains 24 entries (C3 through B4)', () => {
    expect(Object.keys(NOTE_FREQS)).toHaveLength(24);
    expect(NOTE_FREQS['C3']).toBeDefined();
    expect(NOTE_FREQS['B4']).toBeDefined();
    expect(NOTE_FREQS['C4']).toBeCloseTo(261.63, 1);
    expect(NOTE_FREQS['A4']).toBeCloseTo(440.0, 1);
  });
});

describe('noteNameToHz', () => {
  it('returns the correct frequency for C4', () => {
    expect(noteNameToHz('C4')).toBeCloseTo(261.63, 1);
  });

  it('returns the correct frequency for A4', () => {
    expect(noteNameToHz('A4')).toBeCloseTo(440.0, 1);
  });
});

describe('usePianoSampler', () => {
  let createOscSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset createOscillator to return fresh objects each call
    let oscCallCount = 0;
    createOscSpy = mockAudioContext.createOscillator.mockImplementation(() => {
      oscCallCount++;
      return {
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        type: '',
        frequency: { setValueAtTime: vi.fn() },
      };
    });
    mockAudioContext.createGain.mockImplementation(() => ({
      connect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    }));
    mockAudioContext.state = 'running';
    mockAudioContext.currentTime = 0.5;
    void oscCallCount;
  });

  it('Test 1: playNote("C4") calls createOscillator twice (fundamental + second harmonic)', () => {
    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('Test 2: playNote("C4") sets fundamental frequency to 261.63 Hz', () => {
    const osc1 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    const osc2 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    let callCount = 0;
    mockAudioContext.createOscillator.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? osc1 : osc2;
    });

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');

    expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(261.63, 0),
      expect.any(Number)
    );
  });

  it('Test 3: playNote("A4") sets fundamental frequency to 440 Hz', () => {
    const osc1 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    const osc2 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    let callCount = 0;
    mockAudioContext.createOscillator.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? osc1 : osc2;
    });

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('A4');

    expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(440.0, 0),
      expect.any(Number)
    );
  });

  it('Test 4: playNote("C4") sets second harmonic frequency to ~523.26 Hz (2x fundamental)', () => {
    const osc1 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    const osc2 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    let callCount = 0;
    mockAudioContext.createOscillator.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? osc1 : osc2;
    });

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');

    // Second harmonic = 2x fundamental = 523.26
    expect(osc2.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(523.26, 0),
      expect.any(Number)
    );
  });

  it('Test 5: playNote calls gain.linearRampToValueAtTime for ADSR attack phase', () => {
    const gainEnv = {
      connect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    mockAudioContext.createGain.mockReturnValueOnce(gainEnv);

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');

    expect(gainEnv.gain.linearRampToValueAtTime).toHaveBeenCalled();
  });

  it('Test 6: playNote calls oscillator.start() and oscillator.stop() for both oscillators', () => {
    const osc1 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    const osc2 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    let callCount = 0;
    mockAudioContext.createOscillator.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? osc1 : osc2;
    });

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');

    expect(osc1.start).toHaveBeenCalledTimes(1);
    expect(osc1.stop).toHaveBeenCalledTimes(1);
    expect(osc2.start).toHaveBeenCalledTimes(1);
    expect(osc2.stop).toHaveBeenCalledTimes(1);
  });

  it('Test 7: When audioContext.state is "suspended", playNote calls ctx.resume() before scheduling', () => {
    mockAudioContext.state = 'suspended';

    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4');

    expect(mockAudioContext.resume).toHaveBeenCalled();
    // Oscillators should still be created (scheduling continues)
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('Test 8: When audioContext.state is "closed", playNote returns without scheduling (no crash)', () => {
    mockAudioContext.state = 'closed';

    const { result } = renderHook(() => usePianoSampler());
    expect(() => result.current.playNote('C4')).not.toThrow();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('Test 9: playNote with custom startTime schedules at that time instead of ctx.currentTime', () => {
    const osc1 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    const osc2 = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
    let callCount = 0;
    mockAudioContext.createOscillator.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? osc1 : osc2;
    });

    const customStartTime = 2.5;
    const { result } = renderHook(() => usePianoSampler());
    result.current.playNote('C4', { startTime: customStartTime });

    expect(osc1.start).toHaveBeenCalledWith(customStartTime);
    expect(osc2.start).toHaveBeenCalledWith(customStartTime);
  });
});
