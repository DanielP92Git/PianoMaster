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
      // Pattern B: t(key, { defaultValue: "..." }) — pagination uses this
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

// Mock NeedsLandscapeContext
vi.mock("../../../../../contexts/NeedsLandscapeContext", () => ({
  useDeclareNeedsLandscape: vi.fn(),
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

// Mock RhythmStaffDisplay — pattern/meter modes render a staff; tests just
// verify the wrapper is present in the DOM with the right beats prop.
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
// Helpers — every intro now walks the same 3 steps:
//   1. notation  2. syllable  3. playback (Listen + Got it!)
// The Listen button lives on the final (playback) card, so the audio tests
// advance two cards before clicking it.
// ---------------------------------------------------------------------------
async function clickNext() {
  const nextBtn = screen.getByRole("button", { name: /next/i });
  await act(async () => {
    fireEvent.click(nextBtn);
  });
}

async function gotoPlaybackCard() {
  await clickNext(); // notation → syllable
  await clickNext(); // syllable → playback
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("DiscoveryIntroQuestion — playback (final card)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("schedules 8 eighth notes for 8_pair focusDuration", async () => {
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "8_pair" }}
        onComplete={vi.fn()}
      />
    );

    await gotoPlaybackCard();
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
        question={{ focusDuration: "8_pair" }}
        onComplete={vi.fn()}
      />
    );

    await gotoPlaybackCard();

    // Capture the createPianoSound spy from the LATEST audioEngine instance —
    // navigation re-renders the component, and the mock returns a fresh spy
    // each render, so grab it after reaching the playback card.
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
        question={{ focusDuration: "q" }}
        onComplete={vi.fn()}
      />
    );

    await gotoPlaybackCard();
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

  it("renders Got it! button on the final card", async () => {
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "q" }}
        onComplete={vi.fn()}
      />
    );

    await gotoPlaybackCard();
    expect(screen.getByText("Got it!")).toBeInTheDocument();
  });

  it("does NOT show the Listen button on non-playback cards", () => {
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "q" }}
        onComplete={vi.fn()}
      />
    );

    // Card 1 (notation) — no Listen button yet.
    expect(screen.queryByText("Listen")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Figure path (staff) — meters and patterns render a VexFlow staff instead of
// a single-duration glyph, on every card.
// ---------------------------------------------------------------------------

describe("DiscoveryIntroQuestion — figure (staff) modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

    await gotoPlaybackCard();
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

  it("renders a staff for the 3/4 meter concept (no glyph, no DURATION_INFO)", () => {
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "3_4" }}
        onComplete={vi.fn()}
      />
    );

    const staff = screen.getByTestId("rhythm-staff");
    expect(staff).toBeInTheDocument();
    expect(staff).toHaveAttribute("data-time-signature", "3/4");
    expect(staff).toHaveAttribute("data-beat-count", "3"); // three quarters
    expect(screen.queryByTestId("duration-icon")).not.toBeInTheDocument();
  });

  it("plays the 6/8 meter bar at its meter tempo", async () => {
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "6_8" }}
        onComplete={vi.fn()}
      />
    );

    await gotoPlaybackCard();
    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledOnce();
    const [beats, tempo] = schedulePatternPlayback.mock.calls[0];
    expect(beats).toHaveLength(6); // six eighths
    expect(tempo).toBe(112);
  });
});

// ---------------------------------------------------------------------------
// Pagination — uniform 3-step flow (notation → syllable → playback).
// onComplete(1, 1) only fires on the final card.
// ---------------------------------------------------------------------------

describe("pagination (3-step flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("walks notation → syllable → playback, completing only on the final card", async () => {
    const onComplete = vi.fn();
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "q" }}
        onComplete={onComplete}
      />
    );

    // Card 1 (notation) — Next visible, not yet complete
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await clickNext(); // → card 2 (syllable)
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    await clickNext(); // → card 3 (playback, final)
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

  it("clicking Next on a non-final card does NOT call onComplete", async () => {
    const onComplete = vi.fn();
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "q" }}
        onComplete={onComplete}
      />
    );
    await clickNext();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete(1, 1) exactly once (guards against double-fire)", async () => {
    const onComplete = vi.fn();
    render(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "q" }}
        onComplete={onComplete}
      />
    );

    await gotoPlaybackCard();
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
        question={{ focusDuration: "q" }}
        onComplete={onComplete}
      />
    );

    // Advance to card 2 in 'q'
    await clickNext();

    // Re-render with new focusDuration 'h' — cardIndex should reset to 0
    rerender(
      <DiscoveryIntroQuestion
        question={{ focusDuration: "h" }}
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
