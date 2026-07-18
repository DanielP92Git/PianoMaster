import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRhythmPlayback } from "../useRhythmPlayback";

// Minimal getter-backed fake AudioContext. The hook's whole audio surface is:
//   audioEngine.audioContextRef.current -> { currentTime, createOscillator, createGain }
//   audioEngine.gainNodeRef.current     -> a bare connect() target
//   audioEngine.getCurrentTime()        -> only used inside stop()
// The highlight interval reads context.currentTime off the closure captured in play(), so
// mutating `now` and advancing timers drives the clock deterministically — no real WebAudio.
let now = 0;

function makeAudioParam() {
  return {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function makeContext() {
  return {
    get currentTime() {
      return now;
    },
    createOscillator: () => ({
      frequency: makeAudioParam(),
      type: "",
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }),
    createGain: () => ({ gain: makeAudioParam(), connect: vi.fn() }),
  };
}

function makeAudioEngine(context) {
  return {
    audioContextRef: { current: context },
    gainNodeRef: { current: {} },
    getCurrentTime: () => now,
  };
}

// One note occupying [0, 1). play() schedules audio at now + 0.1, so end-of-pattern fires
// once elapsed (context.currentTime - startTime) exceeds 1 + 0.5 = 1.5.
const ONE_NOTE = [{ type: "note", startTime: 0, endTime: 1, frequency: 440 }];

function renderPlayback() {
  const context = makeContext();
  const audioEngine = makeAudioEngine(context);
  const { result } = renderHook(() =>
    useRhythmPlayback({ audioEngine, tempo: 80 })
  );
  return { result, audioEngine };
}

/** Advance the fake audio clock to absolute time `t` (seconds) and let the 50ms interval fire. */
function tickTo(t) {
  now = t;
  act(() => {
    vi.advanceTimersByTime(50);
  });
}

describe("useRhythmPlayback", () => {
  beforeEach(() => {
    now = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT fire onComplete during the 100ms scheduling lead-in (the comparison-playback bug)", () => {
    const { result } = renderPlayback();
    const onBeat = vi.fn();
    const onComplete = vi.fn();

    // now = 0 at play(); startTime = 0.1, so the first tick sees elapsed = -0.1 (no note sounding).
    act(() => {
      result.current.play(ONE_NOTE, onBeat, onComplete);
    });
    tickTo(0.05); // elapsed = -0.05

    expect(onComplete).not.toHaveBeenCalled();
    expect(onBeat).toHaveBeenLastCalledWith(-1);
  });

  it("fires onComplete exactly once after the last note's end + 0.5s, and not again", () => {
    const { result } = renderPlayback();
    const onComplete = vi.fn();

    act(() => {
      result.current.play(ONE_NOTE, vi.fn(), onComplete);
    });
    // startTime = 0.1; endBranch requires elapsed > 1.5 -> absolute time > 1.6.
    tickTo(1.4); // elapsed 1.3 — not yet
    expect(onComplete).not.toHaveBeenCalled();

    tickTo(1.7); // elapsed 1.6 — fires
    expect(onComplete).toHaveBeenCalledTimes(1);

    tickTo(2.5); // interval already cleared by stop(); no re-fire
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("chains a second pass on onComplete without re-firing the first (capture-and-null ordering)", () => {
    const { result } = renderPlayback();
    const done2 = vi.fn();
    const firstComplete = vi.fn(() => {
      // Synchronously start pass 2 from within pass 1's completion (the startComparison pattern).
      result.current.play(ONE_NOTE, vi.fn(), done2);
    });

    act(() => {
      result.current.play(ONE_NOTE, vi.fn(), firstComplete);
    });
    tickTo(1.7); // pass 1 completes -> schedules pass 2 at now + 0.1 = 1.8
    expect(firstComplete).toHaveBeenCalledTimes(1);
    expect(done2).not.toHaveBeenCalled();

    // Pass 2's startTime = 1.8; its end branch needs elapsed > 1.5 -> absolute time > 3.3.
    tickTo(3.4);
    expect(done2).toHaveBeenCalledTimes(1);
    expect(firstComplete).toHaveBeenCalledTimes(1); // never re-fired
  });

  it("treats a leading gap as no-note (-1) without stranding, then completes at the end", () => {
    const { result } = renderPlayback();
    // Note 0 starts at 0.4 (leading gap — mirrors a timeDiff offset in the 'yours' rendition).
    const gapped = [
      { type: "note", startTime: 0.4, endTime: 1.4, frequency: 440 },
    ];
    const onBeat = vi.fn();
    const onComplete = vi.fn();

    act(() => {
      result.current.play(gapped, onBeat, onComplete);
    });
    tickTo(0.35); // startTime 0.1, elapsed 0.25 < 0.4 -> inside the gap, no note sounding
    expect(onBeat).toHaveBeenLastCalledWith(-1);
    expect(onComplete).not.toHaveBeenCalled();

    tickTo(2.1); // elapsed 2.0 > 1.4 + 0.5 -> completes
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("tolerates a 2-arg call (no onComplete) like handleReplayPreview", () => {
    const { result } = renderPlayback();
    const onBeat = vi.fn();

    expect(() => {
      act(() => {
        result.current.play(ONE_NOTE, onBeat);
      });
      tickTo(1.7); // reaches the end branch; done === undefined must be harmless
    }).not.toThrow();
  });

  it("returns false and never fires onComplete when the audio context is missing", () => {
    const audioEngine = makeAudioEngine(null); // audioContextRef.current = null
    const { result } = renderHook(() =>
      useRhythmPlayback({ audioEngine, tempo: 80 })
    );
    const onComplete = vi.fn();

    let started;
    act(() => {
      started = result.current.play(ONE_NOTE, vi.fn(), onComplete);
    });

    expect(started).toBe(false);
    tickTo(2.0);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
