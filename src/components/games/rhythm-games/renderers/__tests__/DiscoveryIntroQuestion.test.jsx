import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, fallback, _opts) => {
      if (typeof fallback === "string") return fallback;
      return key;
    },
    i18n: { language: "en" },
  })),
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
  schedulePatternPlayback: vi.fn(() => ({ startTime: 0.1, totalDuration: 2.0 })),
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
const make8PairQuestion = () => ({ focusDuration: "8_pair" });
const makeQuarterQuestion = () => ({ focusDuration: "q" });

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
    const mockAudioEngine = useAudioEngine();
    const createPianoSound = mockAudioEngine.createPianoSound;

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
});
