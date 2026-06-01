import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, fallback, _opts) => {
      // Pattern A: t(key, "fallback string")
      if (typeof fallback === "string") return fallback;
      // Pattern B: t(key, { defaultValue: "..." }) — REQ-04 pagination uses this
      if (fallback && typeof fallback === "object" && fallback.defaultValue) {
        return fallback.defaultValue;
      }
      return key;
    },
    i18n: { language: "en", exists: () => false },
  })),
  // <Trans> stub — renders the `defaults` string (falls back to i18nKey).
  // Tests don't assert on the title text, so plain-text output is sufficient.
  Trans: ({ defaults, i18nKey }) => <>{defaults || i18nKey}</>,
}));

// Mock useAudioEngine — returns stub that avoids real Web Audio API
vi.mock("../../../../../hooks/useAudioEngine", () => ({
  useAudioEngine: vi.fn(() => ({
    audioContextRef: { current: null },
    gainNodeRef: { current: null },
    getCurrentTime: vi.fn(() => 0),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    resumeAudioContext: vi.fn(() => Promise.resolve(true)),
    createPianoSound: vi.fn(),
  })),
}));

// Mock AudioContextProvider
vi.mock("../../../../../contexts/AudioContextProvider", () => ({
  useAudioContext: vi.fn(() => ({
    audioContextRef: {
      current: {
        state: "running",
        currentTime: 0,
        resume: vi.fn(() => Promise.resolve()),
      },
    },
    getOrCreateAudioContext: vi.fn(() => ({
      state: "running",
      currentTime: 0,
      resume: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

// Mock useMotionTokens
vi.mock("../../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
  })),
}));

// Mock schedulePatternPlayback so we can capture beats and playNote arguments
vi.mock("../../utils/rhythmTimingUtils", () => ({
  schedulePatternPlayback: vi.fn(() => ({
    startTime: 0.1,
    totalDuration: 2.0,
  })),
}));

// Mock the VexFlow helpers — pattern mode converts a binary array to beats
// and renders RhythmStaffDisplay; tests just need to verify the function is
// called with the right binary, not the actual VexFlow output.
vi.mock("../../utils/rhythmVexflowHelpers", () => ({
  binaryPatternToBeats: vi.fn((binary) =>
    // Mirror the real algorithm closely enough for assertions: each `1` starts
    // a beat, each `0` extends it by one sixteenth unit.
    binary.reduce((acc, cell, i) => {
      if (cell === 1 || (cell === 0 && i === 0)) {
        acc.push({ durationUnits: 1, isRest: cell === 0 });
      } else {
        acc[acc.length - 1].durationUnits += 1;
      }
      return acc;
    }, [])
  ),
}));

// Mock RhythmStaffDisplay — pattern-mode renders a staff; tests just verify
// the wrapper is present in the DOM with the right beats prop.
vi.mock("../../components/RhythmStaffDisplay", () => ({
  RhythmStaffDisplay: ({ beats, timeSignature }) => (
    <div
      data-testid="rhythm-staff"
      data-beat-count={beats?.length}
      data-time-signature={timeSignature}
    />
  ),
}));

// Mock DurationCard — provide SVG_COMPONENTS with stub components for needed keys
vi.mock("../../components/DurationCard", () => ({
  SVG_COMPONENTS: {
    "8_pair": (props) => <svg data-testid="duration-icon" {...props} />,
    q: (props) => <svg data-testid="duration-icon" {...props} />,
    quarter: (props) => <svg data-testid="duration-icon" {...props} />,
    h: (props) => <svg data-testid="duration-icon" {...props} />,
    w: (props) => <svg data-testid="duration-icon" {...props} />,
  },
}));

// Mock durationInfo — provide minimal DURATION_INFO and getSyllable
vi.mock("../../utils/durationInfo", () => ({
  DURATION_INFO: {
    "8_pair": {
      durationUnits: 4,
      isRest: false,
      i18nKey: "rhythm.duration.beamedEighths",
    },
    q: {
      durationUnits: 4,
      isRest: false,
      i18nKey: "rhythm.duration.quarter",
    },
    quarter: {
      durationUnits: 4,
      isRest: false,
      i18nKey: "rhythm.duration.quarter",
    },
    h: {
      durationUnits: 8,
      isRest: false,
      i18nKey: "rhythm.duration.half",
    },
  },
  getSyllable: vi.fn(() => "ti-ti"),
}));

// ---------------------------------------------------------------------------
// Import mocks for capturing call arguments
// ---------------------------------------------------------------------------
import { schedulePatternPlayback } from "../../utils/rhythmTimingUtils";
import { useAudioEngine } from "../../../../../hooks/useAudioEngine";

// ---------------------------------------------------------------------------
// Import component under test — after all mocks
// ---------------------------------------------------------------------------
import DiscoveryIntroQuestion from "../DiscoveryIntroQuestion";

// ---------------------------------------------------------------------------
// Question fixtures
// ---------------------------------------------------------------------------
// REQ-04: pagination — fixtures pin a single 'sound' card so the existing
// audio-scheduling tests land directly on the Listen card. Without this,
// CONCEPT_CARDS["8_pair"]/CONCEPT_CARDS["q"] would default to 4 cards and the
// first one (meet) would not show the Listen button.
const make8PairQuestion = () => ({
  focusDuration: "8_pair",
  cards: [{ kind: "sound" }],
});
const makeQuarterQuestion = () => ({
  focusDuration: "q",
  cards: [{ kind: "sound" }],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("DiscoveryIntroQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("schedules 8 eighth notes for 8_pair focusDuration", async () => {
    render(
      <DiscoveryIntroQuestion
        question={make8PairQuestion()}
        onComplete={vi.fn()}
      />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledOnce();

    const beats = schedulePatternPlayback.mock.calls[0][0];
    expect(beats).toHaveLength(8);
    beats.forEach((beat) => {
      expect(beat).toEqual({ durationUnits: 2, isRest: false });
    });
  });

  it("uses pitch-alternating playNote for 8_pair", async () => {
    render(
      <DiscoveryIntroQuestion
        question={make8PairQuestion()}
        onComplete={vi.fn()}
      />
    );

    // Get the createPianoSound spy from the audioEngine instance the component received
    // useAudioEngine is called once during render — get the return value from that call
    const componentAudioEngine =
      useAudioEngine.mock.results[useAudioEngine.mock.results.length - 1].value;
    const createPianoSound = componentAudioEngine.createPianoSound;

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledOnce();

    // Extract the playNote function (4th argument, index 3)
    const playNoteFn = schedulePatternPlayback.mock.calls[0][3];
    expect(typeof playNoteFn).toBe("function");

    // Call playNote 8 times to simulate schedulePatternPlayback invoking it
    for (let i = 0; i < 8; i++) {
      playNoteFn("C4", { startTime: 1.0 + i * 0.3, duration: 0.25 });
    }

    expect(createPianoSound).toHaveBeenCalledTimes(8);

    // Even indices (0, 2, 4, 6) → pitchShift 0 (high)
    // Odd indices (1, 3, 5, 7) → pitchShift -7 (low)
    createPianoSound.mock.calls.forEach((callArgs, i) => {
      const pitchShift = callArgs[3];
      if (i % 2 === 0) {
        expect(pitchShift).toBe(0);
      } else {
        expect(pitchShift).toBe(-7);
      }
    });
  });

  it("schedules 4 quarter notes for quarter focusDuration (no pitch alternation)", async () => {
    render(
      <DiscoveryIntroQuestion
        question={makeQuarterQuestion()}
        onComplete={vi.fn()}
      />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledOnce();

    const beats = schedulePatternPlayback.mock.calls[0][0];
    expect(beats).toHaveLength(4);
    beats.forEach((beat) => {
      expect(beat.durationUnits).toBe(4);
    });
  });

  it("renders Got it! button", () => {
    render(
      <DiscoveryIntroQuestion
        question={make8PairQuestion()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText("Got it!")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // focusPattern path — pattern-mode discovery cards for Unit 8 (q-h-q,
  // syn-syn) render a VexFlow staff and play the figure at node tempo
  // instead of showing a single-duration SVG glyph.
  // -------------------------------------------------------------------------

  it("renders RhythmStaffDisplay (not SVG icon) when focusPattern is provided", () => {
    const qhqBinary = [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    render(
      <DiscoveryIntroQuestion
        question={{
          focusDuration: "h",
          focusPattern: { id: "qhq", binary: qhqBinary, tempo: 62 },
        }}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByTestId("rhythm-staff")).toBeInTheDocument();
    expect(screen.queryByTestId("duration-icon")).not.toBeInTheDocument();
  });

  it("plays the focusPattern binary at the focusPattern tempo", async () => {
    const synsynBinary = [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    render(
      <DiscoveryIntroQuestion
        question={{
          focusDuration: "8",
          focusPattern: { id: "synsyn", binary: synsynBinary, tempo: 67 },
        }}
        onComplete={vi.fn()}
      />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledOnce();
    const [beats, tempo, , playNoteFn] = schedulePatternPlayback.mock.calls[0];
    expect(beats.length).toBeGreaterThan(0);
    expect(tempo).toBe(67);
    expect(typeof playNoteFn).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// REQ-04 pagination tests (Phase 1 v3.5)
// ---------------------------------------------------------------------------
// Multi-card scaffolding flow: 2-4 swipable cards per discovery_intro question.
// CONCEPT_CARDS map provides defaults; inline question.cards overrides.
// onComplete(1, 1) only fires on the final card.
// Pattern mode (focusPattern.id) is unaffected — preserved as single-card.

describe("pagination (Phase 1 v3.5 — REQ-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function makeQuestion(overrides = {}) {
    return { focusDuration: "q", ...overrides };
  }

  it("paginates through CONCEPT_CARDS sequence for focusDuration='q' (4 cards)", async () => {
    const onComplete = vi.fn();
    render(
      <DiscoveryIntroQuestion
        question={makeQuestion()}
        onComplete={onComplete}
      />
    );

    // Card 1 (meet) — Next visible, not yet complete
    let nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(nextBtn); // → card 2 (sound)
    });
    expect(onComplete).not.toHaveBeenCalled();

    nextBtn = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextBtn); // → card 3 (music)
    });
    expect(onComplete).not.toHaveBeenCalled();

    nextBtn = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextBtn); // → card 4 (ready, final)
    });
    expect(onComplete).not.toHaveBeenCalled();

    // Final card — primary button switches to "Got it!"
    const finalBtn = screen.getByRole("button", { name: /got it/i });
    expect(finalBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(finalBtn);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(1, 1);
  });

  it("respects inline question.cards over CONCEPT_CARDS default", async () => {
    const onComplete = vi.fn();
    const question = makeQuestion({
      focusDuration: "q",
      cards: [{ kind: "meet" }, { kind: "ready" }], // 2 cards (overrides default 4)
    });
    render(
      <DiscoveryIntroQuestion question={question} onComplete={onComplete} />
    );

    // Card 1 (meet) — Next
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    expect(onComplete).not.toHaveBeenCalled();

    // Card 2 (ready, final) — Got it!
    const finalBtn = screen.getByRole("button", { name: /got it/i });
    await act(async () => {
      fireEvent.click(finalBtn);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("clicking Next on non-final card does NOT call onComplete", async () => {
    const onComplete = vi.fn();
    render(
      <DiscoveryIntroQuestion
        question={makeQuestion()}
        onComplete={onComplete}
      />
    );
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete(1, 1) exactly once on final card (guards against double-fire)", async () => {
    const onComplete = vi.fn();
    const question = makeQuestion({
      focusDuration: "q",
      cards: [{ kind: "ready" }], // single-card override → final from start
    });
    render(
      <DiscoveryIntroQuestion question={question} onComplete={onComplete} />
    );

    const btn = screen.getByRole("button", { name: /got it/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    // Try a second click — hasCompletedRef guards re-entry.
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(1, 1);
  });

  it("resets cardIndex when focusDuration changes", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <DiscoveryIntroQuestion
        question={makeQuestion({ focusDuration: "q" })}
        onComplete={onComplete}
      />
    );

    // Advance to card 2 in 'q'
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Re-render with new focusDuration 'h' — cardIndex should reset to 0
    rerender(
      <DiscoveryIntroQuestion
        question={makeQuestion({ focusDuration: "h" })}
        onComplete={onComplete}
      />
    );

    // Should be back on card 1 (Next visible, NOT Got it!)
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /got it/i })
    ).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
